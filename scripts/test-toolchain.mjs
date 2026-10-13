import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(await readFile(join(root, 'tests/fixtures/public-exports.json'), 'utf8'))
const entries = { module: 'src/module.ts', media: 'src/runtime/media.ts', schema: 'src/runtime/schema.ts' }
const program = ts.createProgram(Object.values(entries).map(file => join(root, file)), {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  skipLibCheck: true,
})
const checker = program.getTypeChecker()
for (const [name, file] of Object.entries(entries)) {
  const source = program.getSourceFile(join(root, file))
  const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(source)).map(symbol => symbol.name).sort()
  assert.deepEqual(exports, manifest.types[name], `${name} public type/value exports changed`)
}
console.log('Public module/media/schema export manifests passed')

const require = createRequire(import.meta.url)
const cliRequire = createRequire(require.resolve('nuxt/package.json'))
const nested = createRequire(cliRequire.resolve('@nuxt/cli'))
const { cac } = await import(pathToFileURL(nested.resolve('cac')).href)
const { default: completion } = await import(pathToFileURL(nested.resolve('@bomb.sh/tab/cac')).href)
const cli = cac('qfb-toolchain-check')
cli.command('inspect [value]').option('--limit <count>', 'Limit')
const adapter = await completion(cli)
assert(adapter.commands.has('inspect'))
assert(adapter.commands.get('inspect').options.has('limit'))
cli.parse(['node', 'qfb-toolchain-check', 'inspect', 'input', '--limit', '2'], { run: false })
assert.equal(cli.options.limit, 2)
assert(cli.commands.some(command => command.name === 'complete'))
console.log('Nuxt CLI CAC 7 completion adapter passed')

const devtools = createRequire(cliRequire.resolve('@nuxt/devtools/package.json'))
const { simpleGit: Git } = await import(pathToFileURL(devtools.resolve('simple-git')).href)
const temporaryRoot = fileURLToPath(new URL('../.tmp/toolchain-test/', import.meta.url))
await mkdir(temporaryRoot, { recursive: true })
const directory = await mkdtemp(join(temporaryRoot, 'git-'))
try {
  const git = Git(directory)
  await git.init()
  assert((await git.status()).isClean())
  assert.equal(typeof (await git.branch()).current, 'string')
  assert.equal((await git.revparse(['--show-toplevel'])).trim(), directory)
  console.log('Nuxt Devtools simple-git 4 status/branch/revparse API passed')
}
finally {
  await rm(directory, { force: true, recursive: true })
}
