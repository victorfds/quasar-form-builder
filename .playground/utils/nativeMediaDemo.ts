import type { QfbMediaScope, QfbMediaStorageAdapter, QfbMediaTransportAdapter } from 'nuxt-quasar-form-builder/media'
import { createQfbIndexedDbStorage } from 'nuxt-quasar-form-builder/media'

// Simulates a native URI bridge with durable browser storage; production apps supply Filesystem/native transfer.
export function createNativeMediaDemo(scope: QfbMediaScope, http: QfbMediaTransportAdapter) {
  const browser = createQfbIndexedDbStorage({ databaseName: 'qfb-playground', namespace: 'native-demo' })
  const storage: QfbMediaStorageAdapter = {
    ...browser,
    read: async (_scope, clientId) => {
      await browser.read(_scope, clientId)
      return { kind: 'native', uri: `qfb-demo://${clientId}` }
    },
  }
  const transport: QfbMediaTransportAdapter = {
    ...http,
    upload: async (options) => {
      if (options.binary.kind !== 'native') throw new Error('Native URI expected')
      const clientId = options.binary.uri.replace('qfb-demo://', '')
      const binary = await browser.read(scope, clientId)
      return http.upload({ ...options, binary })
    },
  }
  return { storage, transport }
}
