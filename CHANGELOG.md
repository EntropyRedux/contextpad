# Changelog
All notable changes to this project will be documented in this file.

## [1.11.1] - 2026-09-02
### Fixed
- **Shell CSP hardening (secondary):** Kept the intentional `style-src 'unsafe-inline'` exception (required by CodeMirror's runtime style injection) but made it an auditable, documented exception — `scripts/verify-csp.mjs` now logs it at build time. `script-src 'self'` (no `unsafe-inline`) remains verified with zero inline scripts in the production bundle.
- **Sandbox defense finalized:** Added a Proxy `set` trap so user action code cannot overwrite helper functions, closed the legacy `navigator.clipboard.writeText` path, and documented the remaining residual risks (self-navigation, synchronous-loop limits, `Function` reachability) directly in `public/sandbox.html`.
- **Browser-level preview verification:** Added a jsdom runtime test that extracts the actual `PREVIEW_JS_BODY` from the Rust preview-server source and exercises it against a mocked WebSocket + real DOM. Covers late-joiner connect, content replacement, settings pushes, action-button clicks, malformed-payload tolerance, and reconnect-with-backoff.
- **Repo hygiene:** Auto-generated Tauri schema files under `src-tauri/gen/` are no longer tracked (untracked + gitignored); internal planning/audit documents were consolidated into an ignored `docs-internal/` folder so they are not published to GitHub. Version bumped to `1.11.1`.

### Added
- Backlog tracking in `docs-internal/BACKLOG.md` for non-security-critical UX/notification/data-loss follow-ups.

## [1.11.0] - 2026-09-02
### Security
- **Shell CSP Hardened:** The app shell's Content-Security-Policy no longer allows `script-src 'unsafe-inline'`. The theme bootstrap moved to an external `/theme-bootstrap.js`, Vite's inline module-preload polyfill is disabled, and `npm run tauri:build` now verifies the built `dist/index.html` contains zero inline scripts before packaging (`scripts/verify-csp.mjs`). Also tightened `img-src`/`font-src` (no wildcard `https:`), scoped `connect-src` to Tauri IPC + the two token-estimation APIs (dropped the `ws://127.0.0.1:*` wildcard), and added `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'`.
- **Live Preview Sanitization:** All markdown-to-HTML rendering is now sanitized with DOMPurify before it reaches the live preview window. Inline `<script>` tags, event handlers, and `javascript:` URLs from document content can no longer execute in a Tauri webview context.
- **Strict Preview CSP:** The preview server (`src-tauri`) now sends a `Content-Security-Policy` header (`default-src 'none'; script-src 'self'; ...`) on every response. The preview runner moved to an external `/preview.js` endpoint, so the preview page loads no inline scripts.
- **CDN Scripts Removed:** Live Preview no longer loads scripts from `cdn.tailwindcss.com`, `cdnjs.cloudflare.com`, or `cdn.jsdelivr.net` (supply-chain and privacy exposure). Syntax highlighting / Mermaid / MathJax CDN loading was removed; the runner now ships only local, no-op extension hooks.
- **Preview CORS Removed:** The preview server no longer sends `Access-Control-Allow-Origin: *`. A webpage visited in a browser can no longer read the open document from the preview endpoint.
- **Preview Capabilities Restricted:** The `preview` webview now has its own minimal capability file (`core:event:default`) instead of inheriting window/webview/deep-link permissions from the main window.
- **Sandbox Hardening:** Action scripts still run in a sandboxed iframe, but the sandbox now (a) pins the parent origin via a query parameter and validates `origin` + `source` + message id on every message, (b) captures `Function`/`setTimeout` before user code runs, (c) runs under a strict CSP with `connect-src 'none'` and `img-src 'none'`, (d) neutralizes `navigator.sendBeacon` and `window.open`, and (e) exposes a read-only helper surface. The executor no longer posts with wildcard `'*'` origins. Residual risks are documented in `public/sandbox.html`.
- **Typed Preview Settings Sync:** Replaced the unsafe `(webview as any).eval(...)` settings bridge with a typed Tauri command (`update_preview_settings`) that persists and broadcasts settings over the preview WebSocket.

### Added
- **Quality CI Gate:** New `quality.yml` workflow runs `npm run typecheck`, `npm run test:run`, and `cargo check` on every push and pull request.
- **Type Checking:** Added `npm run typecheck` (tsc --noEmit), `npm run check` (typecheck + tests), and `npm run version:sync` scripts. Fixed all outstanding TypeScript errors (`slashCommands.ts` duplicate interface, `lockedEditor.ts` narrowing) — the codebase now type-checks cleanly.
- **Data-Loss Protection:** Debounced content saves are now flushed to IndexedDB on `beforeunload` and when the window is hidden, with a synchronous localStorage fallback and fallback recovery on the next launch.
- **Dirty Close Guard:** Closing the main window (custom controls, OS close, Alt+F4) is intercepted when tabs have unsaved changes and requires confirmation before the app exits.
- **Top-Level Notification Center:** Notifications render as toasts independent of the status bar (visible even when the status bar is hidden), with a dismiss button and optional inline actions.
- **Actionable External-Change Notifications:** "File changed externally" now offers a working **Reload** button that reloads the file from disk instead of a dead "click to reload" hint.
- **Per-Region Error Boundaries:** Title bar, menu bar, breadcrumb, file explorer, editor, side panel, and status bar are individually wrapped so a crash in one region no longer blanks the whole app. "Try Again" remounts the failing subtree.
- **Improved Global Error Handling:** Unhandled promise rejections are prevented from double-logging, categorized by error type, and `ChunkLoadError` auto-reload is capped at one attempt.
- **Sandbox Protocol Tests:** New vitest coverage for sandbox message origin/source/id rejection and related protocol helpers.

### Changed
- **Preview Runner Architecture:** Live preview content and settings are delivered as structured WebSocket messages (`{"type":"content"|"settings"}`); the runner reconnects with backoff and re-initializes TOC scroll spy after content updates.
- **HTML Export:** Exported documents embed a self-contained inline runner (TOC toggle + scroll spy) so they remain fully interactive when opened from disk without the preview server.
- **Release Workflows:** Packaging is gated on `v*` tags (instead of every push to main), artifact names and release tags are derived from `package.json` via `npm run version:sync`, and the `|| true` failure suppression was removed from release publishing.

### Fixed
- **Preview Server Resilience:** Server errors no longer panic silently in a spawned task; they are logged and the server state is preserved.

## [1.10.0] - 2026-03-14
### Added
- **Monokai Syntax Theme:** Added a first-party Monokai editor theme in the syntax theme registry.
- **Expanded Font Options:** Added `Inter`, `Roboto`, and `Serif` to editor font choices.
- **App-Wide Font Toggle:** Added `Apply selected font app-wide` setting and startup-time font hydration to avoid first-render font mismatch.
- **Desktop Build Preflight:** Added `tauri:preflight` script and preflight checks for Node/npm/Tauri/Rust tooling.

### Changed
- **Markdown Heading Accent Behavior:** Heading accent override is now compatible with syntax-theme marker colors (markdown markers/fences no longer forced to gray by the markdown override layer).
- **Status Bar Badge Contrast:** Token badges (`Live`, `Cached`, `Est`) now use semantic class-based colors with explicit text contrast, independent of accent selection.
- **Action Import Robustness:** Import pipeline now sanitizes malformed actions, supports legacy payload shapes, and normalizes legacy clipboard calls to the supported helper API.
- **Action Runtime Compatibility:** Added helper aliases to maintain compatibility with older action snippets (`helpers.toCopy`, `helpers.copy`, `navigator.clipboard.writeText`).

### Fixed
- **COPY Action Runtime Errors:** Resolved `editor is not defined` and clipboard helper mismatches in migrated action scripts.
- **Clipboard Execution in Sandbox:** Implemented reliable clipboard mutation bridging from sandboxed actions to main app context.
- **Menu Bar Font Inheritance:** Menu bar controls now properly follow app-wide font when enabled.
- **V0 Session Stop Logging Path:** Corrected workspace root resolution for stop-hook logging and ensured log directory creation.

### Build & Packaging
- **Executable Build Verified:** `src-tauri/target/release/contextpad.exe`
- **NSIS Installer Verified:** `src-tauri/target/release/bundle/nsis/ContextPad_1.10.0_x64-setup.exe`

## [1.9.2] - 2026-02-22
### Added
- **AST Formula Engine (Phase 3):** Replaced the legacy regex-based formula string matching with a fully hand-crafted Recursive Descent Parser. ContextPad now securely and flawlessly evaluates heavily nested inline macros (e.g., `{=UPPER(TRIM(selection))}`) into an Abstract Syntax Tree (AST) before runtime execution.
- **Dynamic Script Execution Sandbox (Phase 2):** Eradicated the unsafe `new Function` JavaScript macro evaluation. Custom user Action Scripts are now executed entirely within an isolated, invisible `iframe` sandbox that cannot access the DOM or Node APIs. Manipulations are piped back to CodeMirror securely via `postMessage`.
- **System Hardening:**
  - Enforced strict CORS policy limiting the Rust preview server strictly to `localhost:1420`.
  - Removed `'unsafe-eval'` from the Content Security Policy explicitly.
- **Robust Application Startup:**
  - Refactored `src-tauri/src/main.rs` and `useStartupFiles.ts` to utilize event-driven hydration rather than a fragile `thread::sleep` delay.
  - Rewrote cross-platform directory definitions using `@tauri-apps/api/path` to natively support macOS and Linux pathing without hardcoded Windows `\\` limiters.
- **Port Resilience:** Disabled `strictPort` on Vite to allow dynamic fallback if port 5173 is occupied.

## [1.9.0] - 2026-02-08
### Added
- **Reworked Live Preview:** 
  - Switched to an optimized surgical DOM update engine (prevents flickering).
  - Integrated GitHub Flavored Markdown (GFM) styling.
  - Added real-time customization for Font Scale, Max Width, and Margins via an `eval` bridge.
  - Improved Mermaid robustness with automatic retry logic and diagram cleanup.
  - Implemented an interactive Table of Contents (TOC) with Scroll Spy highlighting and auto-expanding sections.
- **Contextual Bookmarks:** New pinned tab type that opens actual files from disk instead of loading blueprints.
- **Hybrid Context Menus:** 
  - Added custom context menus for Tabs (Close Others/All) and File Explorer (Rename/Delete/Open in Explorer).
  - Preserved the native OS context menu in the Editor to keep features like "Talk to Type," Emojis, and Clipboard History.
- **UI Refinement:** 
  - Sleek, semi-transparent design for Action Buttons.
  - New "View" settings section to toggle Activity Bar, Status Bar, and Line Numbers.
  - Category normalization (forced UPPERCASE) across all managers for data consistency.
  - Improved Category Input UX with a hybrid select/input component.
- **File System Protection:** Locked blocks now fully protect their fence markers (```).
- **Core Reliability:** Added a `processingFilesRef` to prevent double-tab opening during file drops.

### Changed
- **Tauri v2 Migration:** Fully updated the backend and capabilities system to Tauri v2 standards.
- **Performance:** Implemented debounced metadata persistence (500ms) to eliminate UI micro-stutters during typing.

### Fixed
- **ReferenceErrors:** Resolved multiple startup and runtime errors related to undefined variables in the editor helpers.
- **Hook Order Warnings:** Refactored `App.tsx` to strictly follow React Hook rules.

## [1.5.0-dev] - 2026-01-31
### Added
- **Android Support:** Added v0.1.0 APK for Android Tablets (Keyboard-first design).
- **Linux Support:** Added official `.AppImage` build for Linux platforms.
- **Action Description:** New description field in the Action Builder.
- **Action Type Indicators:** Visual badges in the sidebar.

### Fixed
- **Startup Reliability:** preventing duplicate tabs.
- **Accessibility:** Added missing aria-labels.

## [1.5.0] - 2026-01-25
### Added
- **Welcome Document:** Interactive introduction loaded on first launch.
- **Workflow Smart Navigation:** Single-click vs Double-click behavior.
- **Bulk Operations:** Multi-select support in all managers.

## [1.0.0] - 2021-01-03
### Added
- First production-ready release.