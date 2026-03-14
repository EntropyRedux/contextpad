import { spawnSync } from 'node:child_process'
import os from 'node:os'

const checks = [
  { name: 'Node.js', cmd: 'node', args: ['-v'], required: true },
  { name: 'npm', cmd: 'npm', args: ['-v'], required: true },
  { name: 'Tauri CLI', cmd: 'npx', args: ['tauri', '--version'], required: true },
  { name: 'Rust (cargo)', cmd: 'cargo', args: ['--version'], required: true },
  { name: 'Rustup', cmd: 'rustup', args: ['--version'], required: true },
]

function runCheck({ name, cmd, args, required }) {
  const result = spawnSync(cmd, args, { encoding: 'utf-8', shell: true })
  const ok = result.status === 0
  const output = (result.stdout || result.stderr || '').trim().split('\n')[0]

  return {
    name,
    ok,
    required,
    output: output || '(no output)',
  }
}

const isWindows = os.platform() === 'win32'
const results = checks.map(runCheck)

console.log('=== ContextPad Desktop Preflight ===')
console.log(`Platform: ${os.platform()} ${os.release()}`)
console.log('')

for (const item of results) {
  const marker = item.ok ? 'OK' : (item.required ? 'MISSING' : 'WARN')
  console.log(`[${marker}] ${item.name}: ${item.output}`)
}

const missingRequired = results.filter(r => !r.ok && r.required)

if (missingRequired.length > 0) {
  console.log('')
  console.error('Desktop preflight failed. Missing required dependencies:')
  for (const item of missingRequired) {
    console.error(` - ${item.name}`)
  }

  if (isWindows) {
    console.log('')
    console.log('Suggested next steps (Windows):')
    console.log(' - Install Rust toolchain (cargo + rustup) from https://rustup.rs')
    console.log(' - Ensure Microsoft C++ Build Tools are installed (Desktop development with C++)')
    console.log(' - Re-open terminal and run: npm run tauri:preflight')
  }

  process.exit(1)
}

console.log('')
console.log('Preflight passed. You can run desktop packaging with: npm run tauri:build')