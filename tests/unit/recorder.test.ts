import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQfbAudioCapture } from '../../src/runtime/app/composables/audioCapture'

class Recorder {
  static current: Recorder
  static finalData = 'final audio'
  static isTypeSupported = vi.fn((mime: string) => mime.startsWith('audio/webm'))
  state = 'inactive'
  mimeType: string
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: ((event: { error: Error }) => void) | null = null
  constructor(_stream: unknown, options: { mimeType: string }) {
    this.mimeType = options.mimeType
    Recorder.current = this
  }

  start() {
    this.state = 'recording'
  }

  pause() {
    this.state = 'paused'
  }

  resume() {
    this.state = 'recording'
  }

  stop() {
    this.state = 'inactive'
    queueMicrotask(() => {
      this.ondataavailable?.({ data: new Blob([Recorder.finalData], { type: this.mimeType }) })
      this.onstop?.()
    })
  }
}

describe('audio capture lifecycle', () => {
  const stopTrack = vi.fn()
  const getUserMedia = vi.fn()
  const captures: ReturnType<typeof createQfbAudioCapture>[] = []
  const capture = (options: Parameters<typeof createQfbAudioCapture>[0] = {}) => {
    const result = createQfbAudioCapture(options)
    captures.push(result)
    return result
  }
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['performance', 'setInterval', 'clearInterval'] })
    getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] })
    Recorder.finalData = 'final audio'
    Recorder.isTypeSupported.mockImplementation(mime => mime.startsWith('audio/webm'))
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    vi.stubGlobal('MediaRecorder', Recorder)
    vi.stubGlobal('isSecureContext', true)
  })
  afterEach(() => {
    captures.splice(0).forEach(item => item.dispose())
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })
  it('waits for final data, excludes pauses, and preserves actual MIME and extension', async () => {
    const audio = capture()
    await audio.start()
    await vi.advanceTimersByTimeAsync(1000)
    audio.pause()
    await vi.advanceTimersByTimeAsync(2000)
    audio.resume()
    await vi.advanceTimersByTimeAsync(500)
    const value = await audio.stop()
    expect(value.durationMs).toBe(1500)
    expect(value.mimeType).toBe('audio/webm;codecs=opus')
    expect(value.name).toMatch(/\.webm$/)
    expect(value.size).toBe(new Blob(['final audio']).size)
    expect(audio.state.value).toBe('ready')
    expect(stopTrack).toHaveBeenCalledTimes(1)
  })
  it('stops at the active duration limit', async () => {
    const audio = capture({ maxDurationSeconds: 1 })
    await audio.start()
    await vi.advanceTimersByTimeAsync(1200)
    expect(audio.state.value).toBe('ready')
    expect(audio.candidate.value?.durationMs).toBe(1000)
    expect(vi.getTimerCount()).toBe(0)
  })
  it('stops at a chunk size limit while retaining final data', async () => {
    const audio = capture({ maxFileSize: 3 })
    await audio.start()
    Recorder.current.ondataavailable?.({ data: new Blob(['chunk']) })
    await Promise.resolve()
    expect(audio.state.value).toBe('ready')
    expect(audio.candidate.value?.size).toBe(new Blob(['chunkfinal audio']).size)
  })
  it('explains denied permission and releases the microphone lease', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'))
    const audio = capture()
    await expect(audio.start()).rejects.toThrow('Permissão')
    expect(audio.state.value).toBe('error')
    await capture().start()
  })
  it('intersects supported formats with backend policy', async () => {
    const audio = capture({
      policy: { maxFileSize: 1000, allowedMimeTypes: ['audio/mp4'], allowedExtensions: ['m4a'] },
    })
    await expect(audio.start()).rejects.toThrow('Nenhum formato')
    expect(getUserMedia).not.toHaveBeenCalled()
  })
  it('allows only one capture per application', async () => {
    const owner = {}
    const first = capture({ owner })
    const second = capture({ owner })
    await first.start()
    await expect(second.start()).rejects.toThrow('Outro campo')
    first.discard()
    await second.start()
  })
  it('rejects empty recordings and encoding failures', async () => {
    const empty = capture()
    Recorder.finalData = ''
    await empty.start()
    await expect(empty.stop()).rejects.toThrow('vazia')
    const failed = capture()
    await failed.start()
    Recorder.current.onerror?.({ error: new Error('encoding failed') })
    expect(failed.state.value).toBe('error')
    expect(failed.candidate.value).toBeUndefined()
    expect(stopTrack).toHaveBeenCalledTimes(2)
  })
  it('does not access browser APIs when created in SSR', () => {
    vi.stubGlobal('navigator', undefined)
    vi.stubGlobal('MediaRecorder', undefined)
    expect(capture().state.value).toBe('idle')
    expect(getUserMedia).not.toHaveBeenCalled()
  })
})
