import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

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
const directory = await mkdtemp(join(tmpdir(), 'qfb-git-toolchain-'))
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
