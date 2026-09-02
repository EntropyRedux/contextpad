import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Syncs the Tauri app version from package.json into src-tauri/tauri.conf.json
 * so the desktop bundle version is always derived from a single source of truth.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const version = pkg.version

if (!version) {
  console.error('No version found in package.json')
  process.exit(1)
}

const tauriConfPath = join(root, 'src-tauri', 'tauri.conf.json')
const conf = JSON.parse(readFileSync(tauriConfPath, 'utf8'))
conf.version = version
writeFileSync(tauriConfPath, JSON.stringify(conf, null, 2) + '\n')

console.log(`Synced Tauri version -> ${version}`)