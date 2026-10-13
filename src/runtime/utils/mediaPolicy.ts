import type { QfbMediaFieldContext, QfbMediaFieldOptions, QfbMediaPolicy, QfbMediaValue } from '../types/media'
import { createQfbMediaError } from './mediaErrors'

export function baseMimeType(mime: string): string {
  const base = mime.split(';')[0]!.trim().toLowerCase()
  const aliases: Record<string, string> = { 'image/jpg': 'image/jpeg', 'image/pjpeg': 'image/jpeg', 'audio/x-m4a': 'audio/mp4', 'audio/m4a': 'audio/mp4', 'audio/mp3': 'audio/mpeg', 'audio/mpeg3': 'audio/mpeg', 'audio/x-mpeg-3': 'audio/mpeg', 'audio/x-wav': 'audio/wav', 'audio/wave': 'audio/wav', 'audio/vnd.wave': 'audio/wav', 'audio/x-aac': 'audio/aac', 'audio/aacp': 'audio/aac', 'audio/x-flac': 'audio/flac' }
  return Object.hasOwn(aliases, base) ? aliases[base]! : base
}
export function mimeMatches(mime: string, allowed: string): boolean {
  const type = baseMimeType(mime)
  const rule = baseMimeType(allowed)
  return rule === '*/*' || rule === type || (rule.endsWith('/*') && type.startsWith(rule.slice(0, -1)))
}
export function positiveNumber(value: unknown): number | undefined {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : undefined
}
export function formatMediaSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateMediaFieldLimits(
  values: Array<Pick<QfbMediaValue, 'name' | 'size'> & { clientId?: string }>,
  options: QfbMediaFieldOptions,
  field: QfbMediaFieldContext,
): void {
  const countLimit = options.multiple ? positiveNumber(options.maxFiles) : 1
  if (countLimit && values.length > countLimit) {
    const rejected = values.at(-1)!
    throw createQfbMediaError('file-limit', `${rejected.name}: Limite de ${countLimit} arquivo(s)`, field, rejected.clientId)
  }
  const totalLimit = positiveNumber(options.maxTotalSize)
  if (totalLimit && values.reduce((sum, value) => sum + value.size, 0) > totalLimit) {
    const rejected = values.at(-1)!
    throw createQfbMediaError('file-limit', `${rejected.name}: Tamanho total máximo: ${formatMediaSize(totalLimit)}`, field, rejected.clientId)
  }
  const limit = positiveNumber(options.maxFileSize)
  for (const value of values) {
    if (limit && value.size > limit)
      throw createQfbMediaError('file-limit', `${value.name}: tamanho máximo ${formatMediaSize(limit)}`, field, value.clientId)
  }
}

export function validateMediaSelection(
  values: QfbMediaValue[],
  policy: QfbMediaPolicy | null | undefined,
  options: QfbMediaFieldOptions,
  field: QfbMediaFieldContext,
): void {
  if (
    values.some(value => !value.documentId)
    && (!policy || !positiveNumber(policy.maxFileSize)
      || !Array.isArray(policy.allowedMimeTypes)
      || !Array.isArray(policy.allowedExtensions))
  ) {
    throw createQfbMediaError('policy-unavailable', 'A política de mídia ainda não está disponível', field)
  }
  validateMediaFieldLimits(values, options, field)
  for (const value of values) {
    const limit = policy && !value.documentId ? Math.min(policy.maxFileSize, positiveNumber(options.maxFileSize) || policy.maxFileSize) : Infinity
    if (value.size > limit) {
      throw createQfbMediaError(
        'file-limit',
        `${value.name}: tamanho máximo ${formatMediaSize(limit)}`,
        field,
        value.clientId,
      )
    }
    if (!value.documentId && policy && !policy.allowedMimeTypes.some(type => mimeMatches(value.mimeType, type)))
      throw createQfbMediaError('mime-type', `${value.name}: tipo ${value.mimeType} não permitido`, field, value.clientId)
    const extension = value.name.includes('.') ? value.name.split('.').at(-1)!.toLowerCase() : ''
    if (!value.documentId && policy && !policy.allowedExtensions.some(ext => ext === '*' || ext.replace(/^\./, '').toLowerCase() === extension))
      throw createQfbMediaError('extension', `${value.name}: extensão não permitida`, field, value.clientId)
    if (
      options.mediaKind
      && options.mediaKind !== 'file'
      && !baseMimeType(value.mimeType).startsWith(`${options.mediaKind}/`)
    ) {
      throw createQfbMediaError('mime-type', `${value.name}: selecione ${options.mediaKind}`, field, value.clientId)
    }
    const durationLimit = positiveNumber(options.maxDurationSeconds)
    if (durationLimit && value.durationMs !== undefined && value.durationMs > durationLimit * 1000)
      throw createQfbMediaError('file-limit', `${value.name}: duração máxima de ${durationLimit} segundo(s)`, field, value.clientId)
    const accept
      = options.accept
        ?.split(',')
        .map(item => item.trim())
        .filter(Boolean) || []
    if (
      accept.length
      && !accept.some(item =>
        item.startsWith('.') ? item.slice(1).toLowerCase() === extension : mimeMatches(value.mimeType, item),
      )
    ) {
      throw createQfbMediaError('mime-type', `${value.name}: formato não aceito pelo campo`, field, value.clientId)
    }
  }
}

/** Called only while selecting a new file in a browser, never on SSR import. */
export function probeMediaDuration(blob: Blob, mime: string, signal?: AbortSignal): Promise<number> {
  if (signal?.aborted) return Promise.reject(new Error('Verificação de duração cancelada.'))
  if (typeof document === 'undefined') return Promise.reject(new Error('A duração deve ser informada pelo adaptador de captura.'))
  return new Promise((resolve, reject) => {
    const player = document.createElement(baseMimeType(mime).startsWith('video/') ? 'video' : 'audio')
    const url = URL.createObjectURL(blob)
    let timer: ReturnType<typeof setTimeout>
    const cleanup = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
      player.onloadedmetadata = null
      player.onerror = null
      player.removeAttribute('src')
      player.load()
      URL.revokeObjectURL(url)
    }
    function cancel() {
      cleanup()
      reject(new Error('Verificação de duração cancelada.'))
    }
    signal?.addEventListener('abort', cancel, { once: true })
    timer = setTimeout(() => {
      cleanup()
      reject(new Error('Não foi possível verificar a duração do arquivo.'))
    }, 10_000)
    player.onloadedmetadata = () => {
      const duration = Math.round(player.duration * 1000)
      cleanup()
      if (Number.isFinite(duration) && duration >= 0) resolve(duration)
      else reject(new Error('O arquivo não informa uma duração válida.'))
    }
    player.onerror = () => {
      cleanup()
      reject(new Error('Não foi possível verificar a duração do arquivo.'))
    }
    player.preload = 'metadata'
    player.src = url
  })
}
