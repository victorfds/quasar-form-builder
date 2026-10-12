import type { QfbLinkedRemoteMedia } from 'nuxt-quasar-form-builder/media'
import { randomUUID } from 'node:crypto'
import { adoptQfbSchema } from 'nuxt-quasar-form-builder/schema'

// This in-memory backend is only a playground fixture, not a production storage adapter.
const responses = new Map<string, { schema: unknown[], values: Record<string, unknown> }>()
const documents = new Map<string, { responseId: string, remote: QfbLinkedRemoteMedia, bytes: Uint8Array }>()
const operations = new Map<string, QfbLinkedRemoteMedia>()
function response(id: string) {
  if (!responses.has(id)) {
    const { fields } = adoptQfbSchema([
      { $formkit: 'q-input', name: 'title', label: 'Pergunta original', inputType: 'text' },
      { $formkit: 'q-file', name: 'attachments', label: 'Arquivos', multiple: true, maxFiles: 5, gallery: true },
      { $formkit: 'q-audio-recorder', name: 'voice', label: 'Áudio', mediaKind: 'audio', maxDurationSeconds: 10 },
      { $formkit: 'q-input', name: 'toggle', label: 'Controle', inputType: 'text' },
      { $formkit: 'q-file', name: 'conditional', label: 'Arquivo condicional', if: '$toggle == "show"' },
      { $formkit: 'q-container', name: 'group', children: [{ $formkit: 'q-file', name: 'nested', label: 'Arquivo no grupo' }] },
    ])
    responses.set(id, { schema: fields, values: { title: '', toggle: 'show', attachments: [], voice: null, conditional: null, group: { nested: null } } })
  }
  return responses.get(id)!
}
export default defineEventHandler(async (event) => {
  const parts = (getRouterParam(event, 'path') || '').split('/')
  const method = event.method
  if (parts[0] === 'responses' && parts[1]) {
    const id = parts[1]
    const current = response(id)
    if (parts.length === 2) {
      if (method === 'PUT') {
        const body = await readBody(event)
        if (!body.values || typeof body.values !== 'object') throw createError({ statusCode: 400, message: 'Invalid response values' })
        current.values = body.values
        // Once created, a response keeps its original definition.
      }
      return current
    }
    if (parts[2] === 'documents') {
      if (method === 'GET') return [...documents.values()].filter(item => item.responseId === id).map(item => item.remote)
      if (method === 'POST') {
        const key = `${id}:${getHeader(event, 'idempotency-key') || ''}`
        if (!getHeader(event, 'idempotency-key')) throw createError({ statusCode: 400, message: 'Idempotency key required' })
        if (operations.has(key)) return operations.get(key)
        const data = await readMultipartFormData(event)
        const file = data?.find(item => item.name === 'file')
        const metadataPart = data?.find(item => item.name === 'metadata')
        if (!file || !metadataPart) throw createError({ statusCode: 400, message: 'File and metadata required' })
        const metadata = JSON.parse(metadataPart.data.toString())
        if (file.data.length > 1024 * 1024 || !metadata.value?.clientId || !metadata.field?.fieldId) throw createError({ statusCode: 400, message: 'Invalid media' })
        const documentId = randomUUID()
        const remote: QfbLinkedRemoteMedia = { kind: 'linked', field: metadata.field, value: { ...metadata.value, size: file.data.length, documentId } }
        documents.set(documentId, { responseId: id, remote, bytes: file.data })
        operations.set(key, remote)
        return remote
      }
      if (method === 'DELETE' && parts[3]) {
        const document = documents.get(parts[3])
        if (document && document.responseId !== id) throw createError({ statusCode: 404 })
        documents.delete(parts[3])
        return { removed: true }
      }
    }
  }
  if (parts[0] === 'documents' && parts[1]) {
    const document = documents.get(parts[1])
    if (!document) throw createError({ statusCode: 404, message: 'Document not found' })
    if (parts[2] === 'access') return { url: `/api/media-demo/documents/${parts[1]}/content` }
    if (parts[2] === 'content') {
      setHeader(event, 'Content-Type', document.remote.value.mimeType)
      setHeader(event, 'Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(document.remote.value.name)}`)
      return send(event, Buffer.from(document.bytes))
    }
  }
  throw createError({ statusCode: 404 })
})
