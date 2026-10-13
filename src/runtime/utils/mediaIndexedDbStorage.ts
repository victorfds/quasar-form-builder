import type { DBSchema, IDBPDatabase } from 'idb'
import type { QfbMediaBinary, QfbMediaScope, QfbMediaStorageAdapter, QfbMediaValue } from '../types/media'
import { openDB } from 'idb'
import { createQfbMediaError } from './mediaErrors'
import { copyMediaValue } from './mediaValues'

interface MediaDatabase extends DBSchema {
  media: {
    key: string[]
    value: { value: QfbMediaValue, blob?: Blob, bytes?: ArrayBuffer }
  }
}

export interface QfbIndexedDbStorageOptions {
  databaseName?: string
  namespace?: string
  databaseVersion?: number
}

export function createQfbIndexedDbStorage(config: QfbIndexedDbStorageOptions = {}): QfbMediaStorageAdapter {
  let connection: Promise<IDBPDatabase<MediaDatabase>> | undefined
  const namespace = config.namespace || 'qfb-media'
  const key = (scope: QfbMediaScope, clientId: string) => [
    namespace,
    scope.userKey,
    scope.formId,
    scope.responseKey,
    clientId,
  ]
  function database() {
    if (typeof indexedDB === 'undefined')
      return Promise.reject(createQfbMediaError('storage', 'IndexedDB não está disponível neste ambiente'))
    connection ||= openDB<MediaDatabase>(config.databaseName || 'qfb-media', config.databaseVersion || 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('media')) db.createObjectStore('media')
      },
      blocking() {
        void connection?.then(db => db.close())
        connection = undefined
      },
      terminated() {
        connection = undefined
      },
    }).catch((error) => {
      connection = undefined
      throw createQfbMediaError('storage', error.message)
    })
    return connection
  }
  async function read(scope: QfbMediaScope, clientId: string): Promise<QfbMediaBinary> {
    const row = await (await database()).get('media', key(scope, clientId))
    if (!row) throw createQfbMediaError('missing-source', 'Arquivo local não encontrado', undefined, clientId)
    const blob = row.blob || (row.bytes && new Blob([row.bytes], { type: row.value.mimeType }))
    if (!blob || blob.size !== row.value.size)
      throw createQfbMediaError('storage', 'Arquivo local incompleto', undefined, clientId)
    return { kind: 'blob', blob }
  }
  return {
    async write(scope, value, binary) {
      if (binary.kind !== 'blob')
        throw createQfbMediaError('storage', 'URIs nativas exigem um adaptador de armazenamento nativo')
      // WebKit cannot reliably persist temporary File-backed Blobs. Read before opening the transaction.
      const bytes = await binary.blob.arrayBuffer()
      const transaction = (await database()).transaction('media', 'readwrite')
      try {
        await transaction.store.put({ value: copyMediaValue(value), bytes }, key(scope, value.clientId))
        await transaction.done
      }
      catch (error) {
        await transaction.done.catch(() => {})
        throw error
      }
    },
    read,
    async has(scope, clientId) {
      return (await (await database()).getKey('media', key(scope, clientId))) !== undefined
    },
    async remove(scope, clientId) {
      const transaction = (await database()).transaction('media', 'readwrite')
      try {
        await transaction.store.delete(key(scope, clientId))
        await transaction.done
      }
      catch (error) {
        await transaction.done.catch(() => {})
        throw error
      }
    },
    async source(scope, clientId) {
      const binary = await read(scope, clientId)
      if (binary.kind !== 'blob') throw createQfbMediaError('storage', 'Fonte local incompatível')
      const url = URL.createObjectURL(binary.blob)
      let released = false
      return {
        url,
        release: () => {
          if (!released) {
            released = true
            URL.revokeObjectURL(url)
          }
        },
      }
    },
  }
}
