import type { QfbMediaCandidate, QfbMediaPolicy } from './types'
import { shallowRef } from 'vue'
import { createQfbId } from '../schema/identity'
import { QfbMediaError } from './errors'
import { baseMimeType, mimeMatches } from './policy'

export type QfbAudioCaptureState = 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'ready' | 'error'
export interface QfbAudioCaptureOptions {
  owner?: object
  maxDurationSeconds?: number
  maxFileSize?: number
  preferredMimeTypes?: string[]
  policy?: QfbMediaPolicy | null
}
const captureOwners = new WeakSet<object>()
const defaultOwner = {}
const extensions: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/wav': 'wav',
}
const permissionErrors: Record<string, string> = {
  NotAllowedError: 'Permissão para usar o microfone negada',
  NotFoundError: 'Microfone não encontrado',
  NotReadableError: 'Microfone ocupado ou indisponível',
  SecurityError: 'A gravação exige um contexto seguro',
  AbortError: 'A captura do microfone foi interrompida',
}

export function createQfbAudioCapture(options: QfbAudioCaptureOptions = {}) {
  const state = shallowRef<QfbAudioCaptureState>('idle')
  const durationMs = shallowRef(0)
  const candidate = shallowRef<QfbMediaCandidate>()
  const error = shallowRef<string>()
  const owner = options.owner || defaultOwner
  let stream: MediaStream | undefined
  let recorder: MediaRecorder | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  let chunks: Blob[] = []
  let activeMs = 0
  let startedAt = 0
  let generation = 0
  let stopped: Promise<QfbMediaCandidate> | undefined
  let resolveStop: ((value: QfbMediaCandidate) => void) | undefined
  let rejectStop: ((error: unknown) => void) | undefined

  function clock() {
    return performance.now()
  }
  function measure() {
    durationMs.value = Math.round(activeMs + (state.value === 'recording' ? clock() - startedAt : 0))
  }
  function cleanup() {
    if (timer) clearInterval(timer)
    timer = undefined
    stream?.getTracks().forEach(track => track.stop())
    stream = undefined
    captureOwners.delete(owner)
  }
  function fail(problem: unknown) {
    const name = problem instanceof Error ? problem.name : ''
    error.value = permissionErrors[name] || (problem instanceof Error ? problem.message : 'Falha ao gravar áudio')
    state.value = 'error'
    candidate.value = undefined
    if (recorder) {
      recorder.onstop = null
      recorder.ondataavailable = null
      recorder.onerror = null
      if (recorder.state !== 'inactive') recorder.stop()
      recorder = undefined
    }
    chunks = []
    cleanup()
    rejectStop?.(new QfbMediaError('capture', error.value))
  }
  function finish() {
    const mimeType = recorder?.mimeType || chunks.find(chunk => chunk.type)?.type || ''
    const blob = new Blob(chunks, { type: mimeType })
    cleanup()
    recorder = undefined
    chunks = []
    if (!blob.size || !mimeType || !extensions[baseMimeType(mimeType)]) {
      fail(new Error('A gravação está vazia ou o formato não é compatível'))
      return
    }
    const name = `${createQfbId()}.${extensions[baseMimeType(mimeType)]}`
    candidate.value = { binary: { kind: 'blob', blob }, name, mimeType, size: blob.size, durationMs: durationMs.value }
    state.value = 'ready'
    resolveStop?.(candidate.value)
  }
  async function start() {
    if (['requesting', 'recording', 'paused', 'stopping'].includes(state.value)) return
    if (
      typeof navigator === 'undefined'
      || !navigator.mediaDevices?.getUserMedia
      || typeof MediaRecorder === 'undefined'
      || !globalThis.isSecureContext
    ) {
      throw new QfbMediaError('capture', 'Gravação não disponível neste ambiente; selecione um áudio existente')
    }
    if (captureOwners.has(owner)) throw new QfbMediaError('capture', 'Outro campo está usando o microfone')
    const preferences = options.preferredMimeTypes?.length
      ? options.preferredMimeTypes
      : ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4']
    const supported = preferences.find(
      mime =>
        MediaRecorder.isTypeSupported(mime)
        && extensions[baseMimeType(mime)]
        && (!options.policy
          || (options.policy.allowedMimeTypes.some(allowed => mimeMatches(mime, allowed))
            && options.policy.allowedExtensions.some(
              extension =>
                extension === '*' || extension.replace(/^\./, '').toLowerCase() === extensions[baseMimeType(mime)],
            ))),
    )
    if (!supported)
      throw new QfbMediaError('capture', 'Nenhum formato de gravação é aceito pelo navegador e pela política')
    captureOwners.add(owner)
    state.value = 'requesting'
    error.value = undefined
    candidate.value = undefined
    chunks = []
    activeMs = 0
    durationMs.value = 0
    const operation = ++generation
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (operation !== generation) {
        acquired.getTracks().forEach(track => track.stop())
        return
      }
      stream = acquired
      recorder = new MediaRecorder(stream, { mimeType: supported })
      stopped = new Promise<QfbMediaCandidate>((resolve, reject) => {
        resolveStop = resolve
        rejectStop = reject
      })
      void stopped.catch(() => {})
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data)
        const limit = Math.min(options.maxFileSize || Infinity, options.policy?.maxFileSize || Infinity)
        if (
          chunks.reduce((size, chunk) => size + chunk.size, 0) >= limit
          && ['recording', 'paused'].includes(state.value)
        ) {
          void stop().catch(() => {})
        }
      }
      recorder.onerror = event =>
        fail((event as Event & { error?: Error }).error || new Error('Falha de encoding do áudio'))
      recorder.onstop = finish
      recorder.start(250)
      startedAt = clock()
      state.value = 'recording'
      timer = setInterval(() => {
        measure()
        if (
          durationMs.value >= (options.maxDurationSeconds || 300) * 1000
          && ['recording', 'paused'].includes(state.value)
        ) {
          void stop().catch(() => {})
        }
      }, 100)
    }
    catch (problem) {
      if (operation === generation) fail(problem)
      throw new QfbMediaError('capture', error.value || 'Falha ao iniciar a gravação')
    }
  }
  function pause() {
    if (state.value !== 'recording' || !recorder) return
    measure()
    activeMs = durationMs.value
    recorder.pause()
    state.value = 'paused'
  }
  function resume() {
    if (state.value !== 'paused' || !recorder) return
    recorder.resume()
    startedAt = clock()
    state.value = 'recording'
  }
  async function stop() {
    if (state.value === 'ready' && candidate.value) return candidate.value
    if (state.value === 'stopping' && stopped) return stopped
    if (!recorder || !stopped) throw new QfbMediaError('capture', 'Não existe gravação para encerrar')
    measure()
    activeMs = durationMs.value
    state.value = 'stopping'
    recorder.stop()
    return stopped
  }
  function discard() {
    generation++
    if (recorder) {
      recorder.onstop = null
      recorder.ondataavailable = null
      recorder.onerror = null
      if (recorder.state !== 'inactive') recorder.stop()
    }
    cleanup()
    recorder = undefined
    chunks = []
    candidate.value = undefined
    error.value = undefined
    durationMs.value = 0
    state.value = 'idle'
    rejectStop?.(new QfbMediaError('cancelled', 'Gravação descartada'))
  }
  return { state, durationMs, candidate, error, start, pause, resume, stop, discard, dispose: discard }
}
