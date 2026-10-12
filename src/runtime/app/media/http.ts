import type {
  QfbLinkedRemoteMedia,
  QfbMediaSource,
  QfbMediaTransportAdapter,
  QfbMediaUploadOptions,
  QfbRemoteMedia,
} from './types'
import { QfbMediaError } from './errors'
import { isQfbMediaValue } from './values'

export interface QfbHttpMediaTransportOptions {
  urls: {
    list: (responseId: string) => string
    upload: (responseId: string) => string
    access: (documentId: string) => string
    remove: (responseId: string, documentId: string) => string
  }
  headers?: () => HeadersInit | Promise<HeadersInit>
  credentials?: RequestCredentials
  filePartName?: string
  metadataPartName?: string
  idempotencyHeader?: string
  metadata?: (options: QfbMediaUploadOptions) => unknown
  listFromResponse?: (body: unknown) => unknown[]
  toRemote: (dto: unknown) => QfbRemoteMedia
  toAccess: (dto: unknown) => QfbMediaSource
}

function assertRemote(item: QfbRemoteMedia): QfbRemoteMedia {
  if (item.kind === 'linked') {
    if (
      !isQfbMediaValue(item.value)
      || !item.value.documentId
      || !item.field?.fieldId
      || !Array.isArray(item.field.fieldPath)
    ) {
      throw new QfbMediaError('transport', 'DTO de mídia vinculada inválido')
    }
    return item
  }
  if (item.kind !== 'unassigned' || !item.document?.documentId)
    throw new QfbMediaError('transport', 'DTO de anexo inválido')
  return {
    kind: 'unassigned',
    document: {
      ...item.document,
      name: item.document.name ?? '',
      mimeType: item.document.mimeType ?? 'application/octet-stream',
      size: item.document.size ?? 0,
    },
  }
}

export function createQfbHttpMediaTransport(config: QfbHttpMediaTransportOptions): QfbMediaTransportAdapter {
  async function request(url: string, signal: AbortSignal, method = 'GET', idempotencyKey?: string) {
    const headers = new Headers(await config.headers?.())
    if (idempotencyKey) headers.set(config.idempotencyHeader || 'Idempotency-Key', idempotencyKey)
    const response = await fetch(url, { method, headers, signal, credentials: config.credentials })
    if (!response.ok) throw new QfbMediaError('transport', `Falha HTTP ${response.status}`)
    return response
  }
  return {
    async list(responseId, signal) {
      const body = await (await request(config.urls.list(responseId), signal)).json()
      const list = config.listFromResponse ? config.listFromResponse(body) : body
      if (!Array.isArray(list)) throw new QfbMediaError('transport', 'A listagem de mídia deve ser um array')
      return list.map(dto => assertRemote(config.toRemote(dto)))
    },
    async access(documentId, signal) {
      const source = config.toAccess(await (await request(config.urls.access(documentId), signal)).json())
      if (!source.url || typeof source.release !== 'function')
        throw new QfbMediaError('transport', 'Fonte remota inválida')
      return source
    },
    async remove(responseId, documentId, idempotencyKey, signal) {
      await request(config.urls.remove(responseId, documentId), signal, 'DELETE', idempotencyKey)
    },
    async upload(options) {
      if (options.binary.kind !== 'blob' || typeof XMLHttpRequest === 'undefined') {
        throw new QfbMediaError(
          'transport',
          'Este transporte exige Blob e XMLHttpRequest; use um adaptador customizado para URIs nativas',
          options.field,
          options.value.clientId,
        )
      }
      const headers = new Headers(await config.headers?.())
      if (options.signal.aborted)
        throw new QfbMediaError('cancelled', 'Envio cancelado', options.field, options.value.clientId)
      const blob = options.binary.blob
      return new Promise<QfbLinkedRemoteMedia>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const abort = () => xhr.abort()
        const cleanup = () => options.signal.removeEventListener('abort', abort)
        xhr.open('POST', config.urls.upload(options.responseId))
        xhr.withCredentials = config.credentials === 'include'
        headers.forEach((value, name) => {
          if (name.toLowerCase() !== 'content-type') xhr.setRequestHeader(name, value)
        })
        xhr.setRequestHeader(config.idempotencyHeader || 'Idempotency-Key', options.idempotencyKey)
        xhr.upload.onprogress = event =>
          options.onProgress({
            clientId: options.value.clientId,
            loaded: event.loaded,
            total: event.lengthComputable ? event.total : undefined,
          })
        xhr.onerror = () => {
          cleanup()
          reject(
            new QfbMediaError('transport', 'Falha de conexão durante o upload', options.field, options.value.clientId),
          )
        }
        xhr.onabort = () => {
          cleanup()
          reject(new QfbMediaError('cancelled', 'Envio cancelado', options.field, options.value.clientId))
        }
        xhr.onload = () => {
          cleanup()
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new QfbMediaError('transport', `Falha HTTP ${xhr.status}`, options.field, options.value.clientId))
            return
          }
          try {
            const result = assertRemote(config.toRemote(JSON.parse(xhr.responseText)))
            if (result.kind !== 'linked') {
              throw new QfbMediaError(
                'transport',
                'O upload precisa retornar uma mídia vinculada',
                options.field,
                options.value.clientId,
              )
            }
            resolve(result)
          }
          catch (error) {
            reject(error)
          }
        }
        options.signal.addEventListener('abort', abort, { once: true })
        const form = new FormData()
        form.append(config.filePartName || 'file', blob, options.value.name)
        form.append(
          config.metadataPartName || 'metadata',
          JSON.stringify(config.metadata?.(options) ?? { value: options.value, field: options.field }),
        )
        xhr.send(form)
      })
    },
  }
}
