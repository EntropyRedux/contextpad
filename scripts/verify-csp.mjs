import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Verifies that the built frontend (dist/index.html) contains no inline
 * scripts, which the shell CSP (`script-src 'self'`, no 'unsafe-inline')
 * would block at runtime. Run after `npm run build` and before packaging.
 *
 * Exits non-zero if an inline <script> is found, script-src allows
 * unsafe-inline, or the CSP is missing directives the app depends on.
 *
 * KNOWN INTENTIONAL EXCEPTION
 * ---------------------------
 * style-src retains 'unsafe-inline'. CodeMirror 6 injects all theme styles at
 * runtime via EditorView.theme() -> StyleModule -> <style> elements (13
 * injection points: themes, dynamic font size/family, slash-command/lint/
 * spellcheck/autocomplete themes, markdown highlighting). The dynamic font
 * theme is user-configurable at runtime, so it cannot be pre-baked into a
 * static stylesheet. Removing 'unsafe-inline' from style-src requires a
 * non-trivial refactor (static CSS + CSS custom properties) and is tracked
 * as a secondary hardening follow-up (see BACKLOG.md). It is NOT an unknown
 * gap: the shell renders no untrusted HTML (the preview does, under its own
 * stricter CSP), and script-src is already locked to 'self'.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distIndexPath = join(root, 'dist', 'index.html')

if (!existsSync(distIndexPath)) {
  console.error('[verify-csp] dist/index.html not found. Run `npm run build` first.')
  process.exit(1)
}

const html = readFileSync(distIndexPath, 'utf8')

// 1) No inline <script> blocks (a script tag without a src attribute)
const scriptTagRe = /<script\b([^>]*)>/gi
let match
const offenders = []
while ((match = scriptTagRe.exec(html)) !== null) {
  const attrs = match[1] || ''
  if (!/\bsrc\s*=/.test(attrs)) {
    offenders.push(html.slice(match.index, Math.min(match.index + 120, html.length)))
  }
}

if (offenders.length > 0) {
  console.error('[verify-csp] FAIL: inline <script> blocks found in dist/index.html.')
  for (const o of offenders) {
    console.error('  ->', o.replace(/\s+/g, ' ').trim())
  }
  console.error("  The shell CSP uses script-src 'self'; inline scripts will be blocked at runtime.")
  process.exit(1)
}

// 2) The CSP in tauri.conf.json must carry the directives the app relies on
const conf = JSON.parse(readFileSync(join(root, 'src-tauri', 'tauri.conf.json'), 'utf8'))
const csp = conf?.app?.security?.csp || ''
const required = [
  "script-src 'self'",
  "default-src 'self'",
  'ipc: http://ipc.localhost',
  'generativelanguage.googleapis.com',
  'api.anthropic.com',
  "frame-src 'self'"
]
const missing = required.filter(d => !csp.includes(d))

if (!csp || missing.length > 0) {
  console.error('[verify-csp] FAIL: CSP in src-tauri/tauri.conf.json is missing required directives.')
  for (const m of missing) console.error('  ->', m)
  process.exit(1)
}

// 3) script-src must NOT allow unsafe-inline (hard failure — this is the
//    directive that actually gates script execution).
if (csp.includes("'unsafe-inline'") && csp.includes('script-src')) {
  const scriptSrc = csp.match(/script-src[^;]*/)?.[0] || ''
  if (scriptSrc.includes("'unsafe-inline'")) {
    console.error('[verify-csp] FAIL: script-src still allows unsafe-inline.')
    process.exit(1)
  }
}

// 4) style-src 'unsafe-inline' is an intentional, documented exception
//    (see header). Log it so it is visible and auditable, but do not fail.
const styleSrc = csp.match(/style-src[^;]*/)?.[0] || ''
if (styleSrc.includes("'unsafe-inline'")) {
  console.log('[verify-csp] NOTE: style-src allows unsafe-inline (intentional — required by CodeMirror runtime style injection; see docs-internal/BACKLOG.md).')
}

console.log('[verify-csp] OK: no inline scripts in dist/index.html and CSP directives are present.')