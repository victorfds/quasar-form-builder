import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import process from 'node:process'

const require = createRequire(import.meta.url)
const manifestPath = require.resolve('@typescript/native/package.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const binary = resolve(dirname(manifestPath), manifest.bin.tsc)
const check = spawn(process.execPath, [binary, '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--lib', 'ES2022,DOM', 'tests/types/sdk.ts'], { stdio: 'inherit' })
check.on('error', (error) => {
  throw error
})
check.on('close', code => process.exit(code || 0))
