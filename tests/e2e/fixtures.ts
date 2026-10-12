import process from 'node:process'
import { test as base } from '@playwright/test'

export const test = base.extend({
  page: async ({ page, browserName }, use) => {
    await page.addInitScript(({ controlled }) => {
      if (!navigator.mediaDevices) return
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async (constraints: MediaStreamConstraints) => {
        if (Reflect.get(window, '__qfbMicrophoneDenied'))
          throw new DOMException('Denied', 'NotAllowedError')
        if (!controlled) return original(constraints)
        const context = new AudioContext()
        const oscillator = context.createOscillator()
        const destination = context.createMediaStreamDestination()
        oscillator.connect(destination)
        oscillator.start()
        void context.resume().catch(() => {})
        const tracks = destination.stream.getTracks()
        for (const track of tracks) {
          const stop = track.stop.bind(track)
          track.stop = () => {
            stop()
            if (tracks.every(item => item.readyState === 'ended')) {
              oscillator.stop()
              void context.close()
            }
          }
        }
        return destination.stream
      } })
    }, { controlled: browserName !== 'chromium' || Boolean(process.env.QFB_BROWSER_WS) })
    await use(page)
  },
})
