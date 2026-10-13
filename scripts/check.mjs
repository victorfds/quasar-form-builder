import { spawn } from 'node:child_process'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { withBrowserRuntime } from './browser-runtime.mjs'

const { values } = parseArgs({ options: {
  browsers: { type: 'string', default: 'auto' },
  profile: { type: 'string', default: process.env.CI ? 'full' : 'local' },
} })
if (!['local', 'full'].includes(values.profile)) throw new Error(`Unknown check profile: ${values.profile}`)
const browserNames = values.profile === 'local' ? ['chromium', 'firefox'] : ['chromium', 'firefox', 'webkit']
const steps = values.profile === 'local' ? 'check:local:steps' : 'check:steps'
const startedAt = performance.now()
console.log(`Running ${values.profile} checks (${browserNames.join(', ')})`)
let child
let interrupted
function stop(signal) {
  interrupted = signal
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  try {
    if (process.platform === 'win32') child.kill(signal)
    else process.kill(-child.pid, signal)
  }
  catch (error) {
    if (error.code !== 'ESRCH') throw error
  }
}
const onInterrupt = () => stop('SIGINT')
const onTerminate = () => stop('SIGTERM')
process.on('SIGINT', onInterrupt)
process.on('SIGTERM', onTerminate)
try {
  const code = await withBrowserRuntime(endpoint => new Promise((resolve, reject) => {
    if (interrupted) {
      resolve(interrupted === 'SIGINT' ? 130 : 143)
      return
    }
    const env = { ...process.env }
    delete env.QFB_BROWSER_WS
    if (endpoint) env.QFB_BROWSER_WS = endpoint
    child = spawn('pnpm', ['run', steps], {
      stdio: 'inherit',
      env,
      detached: process.platform !== 'win32',
    })
    child.on('error', reject)
    child.on('close', (code, signal) => resolve(code ?? (signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1)))
  }), { mode: values.browsers, browserNames })
  process.exitCode = code
}
catch (error) {
  console.error(error.message)
  process.exitCode = interrupted === 'SIGINT' ? 130 : interrupted === 'SIGTERM' ? 143 : 1
}
finally {
  process.off('SIGINT', onInterrupt)
  process.off('SIGTERM', onTerminate)
  console.log(`${values.profile} checks finished in ${((performance.now() - startedAt) / 1000).toFixed(1)}s (exit ${process.exitCode || 0})`)
}
