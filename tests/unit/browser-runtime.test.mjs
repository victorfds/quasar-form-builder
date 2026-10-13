import { fileURLToPath } from 'node:url'
import { loadNuxtConfig } from '@nuxt/kit'
import { describe, expect, it, vi } from 'vitest'
import playwrightConfig from '../../playwright.config'
import { verifyBrowserRuntime, withBrowserRuntime } from '../../scripts/browser-runtime.mjs'

function fixture(extra = {}) {
  const runtime = { endpoint: 'ws://127.0.0.1:4321/', dispose: vi.fn() }
  return {
    mode: 'auto',
    platform: 'linux',
    endpoint: '',
    verify: vi.fn().mockResolvedValue(undefined),
    startDocker: vi.fn().mockResolvedValue(runtime),
    warn: vi.fn(),
    runtime,
    ...extra,
  }
}

describe('quality-check browser runtime', () => {
  it('freezes dependency discovery only in the E2E playground environment', async () => {
    const cwd = fileURLToPath(new URL('../../.playground/', import.meta.url))
    const e2e = await loadNuxtConfig({ cwd, envName: 'e2e' })
    const development = await loadNuxtConfig({ cwd, envName: 'development' })
    expect(e2e.vite.optimizeDeps.noDiscovery).toBe(true)
    expect(e2e.vite.optimizeDeps.include).toContain('jsep')
    expect(development.vite.optimizeDeps.noDiscovery).not.toBe(true)
  })
  it('prevents Nuxt CLI from re-enabling HMR in the managed E2E server', () => {
    expect(playwrightConfig.webServer.env.NUXI_DISABLE_VITE_HMR).toBe('1')
    expect(playwrightConfig.webServer.command).toContain('--envName e2e')
  })
  it('checks only the engines required by the local profile', async () => {
    const browser = { close: vi.fn() }
    const engines = Object.fromEntries(['chromium', 'firefox', 'webkit'].map(name => [name, { launch: vi.fn().mockResolvedValue(browser) }]))
    await verifyBrowserRuntime(undefined, ['chromium', 'firefox'], engines)
    expect(engines.chromium.launch).toHaveBeenCalledOnce()
    expect(engines.firefox.launch).toHaveBeenCalledOnce()
    expect(engines.webkit.launch).not.toHaveBeenCalled()
    expect(browser.close).toHaveBeenCalledTimes(2)
  })
  it('keeps all engines mandatory in the complete profile', async () => {
    const browser = { close: vi.fn() }
    const engines = Object.fromEntries(['chromium', 'firefox', 'webkit'].map(name => [name, { connect: vi.fn().mockResolvedValue(browser) }]))
    await verifyBrowserRuntime('ws://configured/', undefined, engines)
    for (const engine of Object.values(engines)) expect(engine.connect).toHaveBeenCalledOnce()
    expect(browser.close).toHaveBeenCalledTimes(3)
  })
  it('uses native browsers when all engines launch', async () => {
    const options = fixture()
    const run = vi.fn().mockResolvedValue(0)
    expect(await withBrowserRuntime(run, options)).toBe(0)
    expect(run).toHaveBeenCalledWith()
    expect(options.startDocker).not.toHaveBeenCalled()
  })
  it('falls back on Linux and disposes only its managed runtime', async () => {
    const options = fixture()
    options.verify.mockRejectedValueOnce(new Error('Missing libicu74'))
    const run = vi.fn().mockResolvedValue(0)
    await withBrowserRuntime(run, options)
    expect(options.verify).toHaveBeenLastCalledWith(options.runtime.endpoint)
    expect(run).toHaveBeenCalledWith(options.runtime.endpoint)
    expect(options.runtime.dispose).toHaveBeenCalledOnce()
  })
  it('does not bypass missing native prerequisites in explicit native mode', async () => {
    const options = fixture({ mode: 'native' })
    options.verify.mockRejectedValueOnce(new Error('Missing browser'))
    const run = vi.fn()
    await expect(withBrowserRuntime(run, options)).rejects.toThrow('playwright install --with-deps')
    expect(options.startDocker).not.toHaveBeenCalled()
    expect(run).not.toHaveBeenCalled()
  })
  it('uses a supplied remote endpoint without managing its lifecycle', async () => {
    const options = fixture({ endpoint: 'ws://configured/' })
    const run = vi.fn().mockResolvedValue(0)
    await withBrowserRuntime(run, options)
    expect(options.verify).toHaveBeenCalledWith('ws://configured/')
    expect(run).toHaveBeenCalledWith('ws://configured/')
    expect(options.startDocker).not.toHaveBeenCalled()
  })
  it('never retries failing application checks using Docker', async () => {
    const options = fixture()
    const run = vi.fn(() => {
      throw new Error('Application regression')
    })
    await expect(withBrowserRuntime(run, options)).rejects.toThrow('Application regression')
    expect(options.startDocker).not.toHaveBeenCalled()
  })
  it('cleans up a managed runtime when browser verification fails', async () => {
    const options = fixture({ mode: 'docker' })
    options.verify.mockRejectedValueOnce(new Error('Connection failed'))
    const run = vi.fn()
    await expect(withBrowserRuntime(run, options)).rejects.toThrow('Connection failed')
    expect(options.runtime.dispose).toHaveBeenCalledOnce()
    expect(run).not.toHaveBeenCalled()
  })
  it('preserves failing gate exit codes and still cleans up', async () => {
    const options = fixture({ mode: 'docker' })
    expect(await withBrowserRuntime(vi.fn().mockResolvedValue(7), options)).toBe(7)
    expect(options.runtime.dispose).toHaveBeenCalledOnce()
  })
  it('cleans up when a managed gate rejects', async () => {
    const options = fixture({ mode: 'docker' })
    await expect(withBrowserRuntime(vi.fn().mockRejectedValue(new Error('Failed gate')), options)).rejects.toThrow('Failed gate')
    expect(options.runtime.dispose).toHaveBeenCalledOnce()
  })
  it('does not attempt host-network Docker fallback on other platforms', async () => {
    const options = fixture({ platform: 'darwin' })
    options.verify.mockRejectedValueOnce(new Error('Missing browser'))
    await expect(withBrowserRuntime(vi.fn(), options)).rejects.toThrow('Browser preflight failed')
    expect(options.startDocker).not.toHaveBeenCalled()
  })
})
