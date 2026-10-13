import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium, firefox, webkit } from '@playwright/test'

export async function verifyBrowserRuntime(endpoint, browserNames = ['chromium', 'firefox', 'webkit'], engines = { chromium, firefox, webkit }) {
  for (const name of browserNames) {
    const engine = engines[name]
    if (!engine) throw new Error(`Unknown browser engine: ${name}`)
    const browser = endpoint
      ? await engine.connect(endpoint, { timeout: 10_000 })
      : await engine.launch({ timeout: 10_000 })
    await browser.close()
  }
}

async function availablePort() {
  const server = createServer()
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(error => error ? reject(error) : resolve(address.port))
    })
  })
}

export async function startDockerBrowserRuntime(browserNames = ['chromium', 'firefox', 'webkit']) {
  const docker = spawnSync('docker', ['info', '--format', '{{.OSType}}'], { encoding: 'utf8', timeout: 10_000 })
  if (docker.error || docker.status !== 0 || docker.stdout.trim() !== 'linux')
    throw new Error(`A Linux Docker engine is required: ${docker.error?.message || docker.stderr || docker.stdout}`)

  const require = createRequire(import.meta.url)
  const { version } = require('@playwright/test/package.json')
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`No stable Playwright image can be selected for ${version}`)
  const image = `mcr.microsoft.com/playwright:v${version}-noble`
  const name = `qfb-check-${process.pid}-${randomUUID().slice(0, 8)}`
  const port = await availablePort()
  const endpoint = `ws://127.0.0.1:${port}/`
  const dispose = () => {
    spawnSync('docker', ['rm', '--force', name], { stdio: 'ignore', timeout: 15_000 })
  }
  console.log(`Starting isolated browser runtime: ${image}`)
  try {
    const started = spawnSync('docker', [
      'run',
      '--detach',
      '--rm',
      '--init',
      '--ipc=host',
      '--network=host',
      '--name',
      name,
      '--label',
      'qfb.check=true',
      '--user',
      'pwuser',
      '--workdir',
      '/home/pwuser',
      image,
      'npx',
      '--yes',
      `playwright@${version}`,
      'run-server',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
    ], { encoding: 'utf8', timeout: 300_000, maxBuffer: 10 * 1024 * 1024 })
    if (started.error || started.status !== 0)
      throw new Error(started.error?.message || started.stderr || 'Docker browser startup failed')

    const deadline = Date.now() + 60_000
    let lastError
    while (Date.now() < deadline) {
      try {
        await verifyBrowserRuntime(endpoint, browserNames)
        return { endpoint, dispose }
      }
      catch (error) {
        lastError = error
        await delay(250)
      }
    }
    const logs = spawnSync('docker', ['logs', '--tail', '30', name], { encoding: 'utf8', timeout: 5_000 })
    throw new Error(`Browser server did not become ready: ${lastError?.message}\n${logs.stdout || ''}${logs.stderr || ''}`)
  }
  catch (error) {
    dispose()
    throw error
  }
}

export async function withBrowserRuntime(run, {
  mode = 'auto',
  platform = process.platform,
  endpoint = process.env.QFB_BROWSER_WS,
  browserNames = ['chromium', 'firefox', 'webkit'],
  verify = endpoint => verifyBrowserRuntime(endpoint, browserNames),
  startDocker = () => startDockerBrowserRuntime(browserNames),
  warn = console.warn,
} = {}) {
  if (!['auto', 'native', 'docker'].includes(mode)) throw new Error(`Unknown browser runtime: ${mode}`)
  if (mode === 'auto' && endpoint) {
    await verify(endpoint)
    return run(endpoint)
  }
  if (mode !== 'docker') {
    try {
      await verify()
    }
    catch (error) {
      if (mode === 'native' || platform !== 'linux')
        throw new Error(`Browser preflight failed. Install browsers and system dependencies with pnpm exec playwright install --with-deps, or configure QFB_BROWSER_WS.\n${error.message}`, { cause: error })
      warn(`Native browsers unavailable; trying the official Docker runtime.\n${error.message}`)
      const runtime = await startDocker()
      try {
        await verify(runtime.endpoint)
        return await run(runtime.endpoint)
      }
      finally {
        await runtime.dispose()
      }
    }
    // Do not retry failed application tests with a different browser runtime.
    return run()
  }
  if (platform !== 'linux') throw new Error('Managed Docker browsers require a Linux host; use QFB_BROWSER_WS on other platforms')
  const runtime = await startDocker()
  try {
    await verify(runtime.endpoint)
    return await run(runtime.endpoint)
  }
  finally {
    await runtime.dispose()
  }
}
