import type { QfbMediaFieldContext, QfbMediaFieldOptions, QfbMediaPolicy, QfbMediaValue } from './types'
import { QfbMediaError } from './errors'

export function baseMimeType(mime: string): string {
  return mime.split(';')[0]!.trim().toLowerCase()
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
    throw new QfbMediaError('file-limit', `${rejected.name}: Limite de ${countLimit} arquivo(s)`, field, rejected.clientId)
  }
  const totalLimit = positiveNumber(options.maxTotalSize)
  if (totalLimit && values.reduce((sum, value) => sum + value.size, 0) > totalLimit) {
    const rejected = values.at(-1)!
    throw new QfbMediaError('file-limit', `${rejected.name}: Tamanho total máximo: ${formatMediaSize(totalLimit)}`, field, rejected.clientId)
  }
  const limit = positiveNumber(options.maxFileSize)
  for (const value of values) {
    if (limit && value.size > limit)
      throw new QfbMediaError('file-limit', `${value.name}: tamanho máximo ${formatMediaSize(limit)}`, field, value.clientId)
  }
}

export function validateMediaSelection(
  values: QfbMediaValue[],
  policy: QfbMediaPolicy,
  options: QfbMediaFieldOptions,
  field: QfbMediaFieldContext,
): void {
  if (
    !positiveNumber(policy.maxFileSize)
    || !Array.isArray(policy.allowedMimeTypes)
    || !Array.isArray(policy.allowedExtensions)
  ) {
    throw new QfbMediaError('policy-unavailable', 'A política de mídia ainda não está disponível', field)
  }
  validateMediaFieldLimits(values, options, field)
  for (const value of values) {
    const limit = Math.min(policy.maxFileSize, positiveNumber(options.maxFileSize) || policy.maxFileSize)
    if (value.size > limit) {
      throw new QfbMediaError(
        'file-limit',
        `${value.name}: tamanho máximo ${formatMediaSize(limit)}`,
        field,
        value.clientId,
      )
    }
    if (!policy.allowedMimeTypes.some(type => mimeMatches(value.mimeType, type)))
      throw new QfbMediaError('mime-type', `${value.name}: tipo ${value.mimeType} não permitido`, field, value.clientId)
    const extension = value.name.includes('.') ? value.name.split('.').at(-1)!.toLowerCase() : ''
    if (!policy.allowedExtensions.some(ext => ext === '*' || ext.replace(/^\./, '').toLowerCase() === extension))
      throw new QfbMediaError('extension', `${value.name}: extensão não permitida`, field, value.clientId)
    if (
      options.mediaKind
      && options.mediaKind !== 'file'
      && !baseMimeType(value.mimeType).startsWith(`${options.mediaKind}/`)
    ) {
      throw new QfbMediaError('mime-type', `${value.name}: selecione ${options.mediaKind}`, field, value.clientId)
    }
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
      throw new QfbMediaError('mime-type', `${value.name}: formato não aceito pelo campo`, field, value.clientId)
    }
  }
}
