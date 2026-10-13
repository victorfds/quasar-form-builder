import type {
  QfbLinkedRemoteMedia,
  QfbMediaBinary,
  QfbMediaControllerOptions,
  QfbMediaPolicy,
  QfbMediaStorageAdapter,
  QfbMediaTransportAdapter,
  QfbMediaValue,
} from '../../src/runtime/types/media'
import { describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { useQfbMediaController } from '../../src/runtime/app/composables/useQfbMediaController'
import { createQfbHttpMediaTransport } from '../../src/runtime/utils/mediaHttpTransport'
import { createQfbIndexedDbStorage } from '../../src/runtime/utils/mediaIndexedDbStorage'
import { isQfbMediaValue } from '../../src/runtime/utils/mediaValues'

const scope = { userKey: 'user', formId: 'form', responseKey: 'draft' }
const field = { fieldId: '00000000-0000-4000-8000-000000000001', fieldPath: ['group', 'photos'] }
const policy: QfbMediaPolicy = {
  maxFileSize: 100,
  allowedMimeTypes: ['image/png', 'audio/webm', 'text/plain'],
  allowedExtensions: ['png', 'webm', 'txt'],
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function fixture(overrides: Partial<QfbMediaControllerOptions> = {}) {
  const bytes = new Map<string, QfbMediaBinary>()
  const storage: QfbMediaStorageAdapter = {
    write: vi.fn(async (_scope, value, binary) => {
      bytes.set(value.clientId, binary)
    }),
    read: vi.fn(async (_scope, clientId) => {
      const binary = bytes.get(clientId)
      if (!binary) throw new Error('missing')
      return binary
    }),
    has: vi.fn(async (_scope, clientId) => bytes.has(clientId)),
    remove: vi.fn(async (_scope, clientId) => {
      bytes.delete(clientId)
    }),
    source: vi.fn(async () => ({ url: 'blob:local', release: vi.fn() })),
  }
  const transport: QfbMediaTransportAdapter = {
    list: vi.fn(async () => []),
    upload: vi.fn<QfbMediaTransportAdapter['upload']>(async item => ({
      kind: 'linked',
      field: item.field,
      value: { ...item.value, documentId: `document-${item.value.clientId}` },
    })),
    access: vi.fn(async () => ({ url: 'https://example.test/file', release: vi.fn() })),
    remove: vi.fn(async () => {}),
  }
  const values: { group: { photos: QfbMediaValue[] } } = { group: { photos: [] } }
  const controller = useQfbMediaController({ scope, policy, storage, transport, ...overrides })
  controller.registerField(
    field,
    () => ({ multiple: true, maxFiles: 5 }),
    () => values.group.photos,
  )
  const file = (name = 'photo.png', size = 3, type = 'image/png') => new File([new Uint8Array(size)], name, { type })
  const stage = async (name?: string) => {
    const value = await controller.stage(field, file(name))
    values.group.photos.push(value)
    return value
  }
  return { controller, storage, transport, bytes, values, file, stage }
}

describe('persistent media controller', () => {
  it.each(['has', 'source'] as const)('falls back to a confirmed remote source when storage.%s fails', async (operation) => {
    const test = fixture()
    vi.mocked(test.storage.has).mockResolvedValue(true)
    vi.mocked(test.storage[operation]).mockRejectedValue(new Error('Storage unavailable'))
    const source = await test.controller.getSource({
      version: 1,
      clientId: 'remote-client',
      documentId: 'remote',
      name: 'remote.png',
      mimeType: 'image/png',
      size: 3,
    })
    expect(source.url).toBe('https://example.test/file')
    expect(test.transport.access).toHaveBeenCalledWith('remote', expect.any(AbortSignal))
    source.release()
    test.controller.dispose()
  })
  it('keeps local-only storage failures recoverable instead of inventing a remote source', async () => {
    const test = fixture()
    vi.mocked(test.storage.has).mockRejectedValue(new Error('Storage unavailable'))
    await expect(test.controller.getSource({ version: 1, clientId: 'local', name: 'local.png', mimeType: 'image/png', size: 3 }))
      .rejects
      .toMatchObject({ description: { code: 'storage', recoverable: true } })
    expect(test.transport.access).not.toHaveBeenCalled()
  })
  it('preserves authorized capture under its original policy and requires current-policy confirmation', async () => {
    const activePolicy = shallowRef(policy)
    const test = fixture({ policy: activePolicy })
    const capture = test.controller.beginCapture(field)
    activePolicy.value = { ...policy, maxFileSize: 1 }
    const blob = new Blob(['recording'], { type: 'audio/webm' })
    const value = await capture.finish({ binary: { kind: 'blob', blob }, name: 'capture.webm', mimeType: blob.type, size: blob.size })
    expect(test.controller.recovery.value.items[0]?.value.clientId).toBe(value.clientId)
    await expect(test.controller.confirmRecovered(value.clientId)).rejects.toThrow('tamanho')
    activePolicy.value = policy
    await test.controller.confirmRecovered(value.clientId)
    expect(test.controller.canApply(value.clientId)).toBe(true)
  })
  it('does not confirm recovery into another list row with the same question identity', async () => {
    const readonly = shallowRef(false)
    const test = fixture({ readonly })
    const other = { ...field, fieldPath: ['rows', '1', 'file'] }
    test.controller.registerField(other, () => ({ multiple: true }), () => [])
    const capture = test.controller.beginCapture(field)
    readonly.value = true
    const blob = new Blob(['x'], { type: 'image/png' })
    const value = await capture.finish({ binary: { kind: 'blob', blob }, name: 'photo.png', mimeType: blob.type, size: blob.size }, true)
    readonly.value = false
    await expect(test.controller.confirmRecovered(value.clientId, other)).rejects.toMatchObject({ description: { code: 'conflict' } })
    expect(test.controller.recovery.value.items).toHaveLength(1)
  })
  it('keeps recovery pending if policy changes while its bytes are being read', async () => {
    const activePolicy = shallowRef(policy)
    const test = fixture({ policy: activePolicy })
    const capture = test.controller.beginCapture(field)
    const blob = new Blob(['capture'], { type: 'image/png' })
    const value = await capture.finish({ binary: { kind: 'blob', blob }, name: 'photo.png', mimeType: blob.type, size: blob.size }, true)
    const gate = deferred<QfbMediaBinary>()
    vi.mocked(test.storage.read).mockReturnValueOnce(gate.promise)
    const pending = test.controller.confirmRecovered(value.clientId)
    activePolicy.value = { ...policy, maxFileSize: 1 }
    gate.resolve({ kind: 'blob', blob })
    await expect(pending).rejects.toMatchObject({ description: { code: 'conflict' } })
    expect(test.controller.recovery.value.items).toHaveLength(1)
    expect(test.controller.canApply(value.clientId)).toBe(false)
  })
  it('keeps indexed list contexts distinct even when they reuse a question identity', async () => {
    const test = fixture()
    const firstField = { ...field, fieldPath: ['rows', '0', 'file'] }
    const secondField = { ...field, fieldPath: ['rows', '1', 'file'] }
    const values: { rows: Array<{ file: QfbMediaValue | null }> } = { rows: [{ file: null }, { file: null }] }
    test.controller.registerField(
      firstField,
      () => ({}),
      () => values.rows[0]!.file,
    )
    test.controller.registerField(
      secondField,
      () => ({}),
      () => values.rows[1]!.file,
    )
    values.rows[0]!.file = await test.controller.stage(firstField, test.file('first.png'))
    values.rows[1]!.file = await test.controller.stage(secondField, test.file('second.png'))
    const snapshot = await test.controller.prepare(values)
    expect(snapshot.uploads.map(item => item.field.fieldPath)).toEqual([firstField.fieldPath, secondField.fieldPath])
    const uploaded = await test.controller.uploadPending('response', snapshot)
    const applied = test.controller.applyRemote(values, uploaded.results) as typeof values
    expect(applied.rows.every(row => row.file?.documentId)).toBe(true)
  })
  it('requires explicit revalidation after a policy changes during staging', async () => {
    const activePolicy = shallowRef<QfbMediaPolicy | undefined>(policy)
    const test = fixture({ policy: activePolicy })
    const gate = deferred<void>()
    vi.mocked(test.storage.write).mockImplementationOnce(async (_scope, value, binary) => {
      await gate.promise
      test.bytes.set(value.clientId, binary)
    })
    const pending = test.controller.stage(field, test.file())
    activePolicy.value = undefined
    gate.resolve()
    const value = await pending
    expect(test.controller.canApply(value.clientId)).toBe(false)
    activePolicy.value = policy
    expect(test.controller.canApply(value.clientId)).toBe(false)
    await test.controller.confirmRecovered(value.clientId)
    expect(test.controller.canApply(value.clientId)).toBe(true)
  })
  it('does not allow a cancelled staged file to be applied later', async () => {
    const test = fixture()
    const value = await test.controller.stage(field, test.file())
    test.controller.cancel(value.clientId)
    expect(test.controller.canApply(value.clientId)).toBe(false)
    expect(test.controller.recovery.value.items[0]?.value.clientId).toBe(value.clientId)
  })
  it('returns references only after durable staging and keeps bytes out of snapshots', async () => {
    const gate = deferred<void>()
    const test = fixture()
    vi.mocked(test.storage.write).mockImplementationOnce(async (_scope, value, binary) => {
      await gate.promise
      test.bytes.set(value.clientId, binary)
    })
    const pending = test.controller.stage(field, test.file())
    expect(test.values.group.photos).toEqual([])
    expect(Object.values(test.controller.items.value)[0]?.state).toBe('staging')
    gate.resolve()
    const value = await pending
    expect(isQfbMediaValue(value)).toBe(true)
    test.values.group.photos.push(value)
    const snapshot = await test.controller.prepare(test.values)
    expect(JSON.parse(JSON.stringify(snapshot)).values).toEqual(test.values)
    expect(Object.isFrozen(snapshot.values)).toBe(true)
    expect(snapshot.uploads[0]?.idempotencyKey).toContain(value.clientId)
    expect(Object.keys(snapshot.uploads[0]!.value).sort()).toEqual(['clientId', 'mimeType', 'name', 'size', 'version'])
    const stored = await test.storage.read(scope, value.clientId)
    expect(stored.kind).toBe('blob')
    if (stored.kind === 'blob') expect(new Uint8Array(await stored.blob.arrayBuffer())).toEqual(new Uint8Array(3))
  })
  it('reports a failed write without producing a confirmed reference', async () => {
    const test = fixture()
    vi.mocked(test.storage.write).mockRejectedValueOnce(new Error('quota'))
    await expect(test.stage()).rejects.toThrow('quota')
    expect(test.values.group.photos).toEqual([])
    expect(Object.values(test.controller.items.value)[0]?.state).toBe('error')
  })
  it('combines remote and pending values when enforcing limits', async () => {
    const test = fixture()
    test.controller.registerField(
      field,
      () => ({ multiple: true, maxFiles: 1, maxTotalSize: 10 }),
      () => test.values.group.photos,
    )
    test.values.group.photos.push({
      version: 1,
      clientId: 'remote-client',
      documentId: 'remote',
      name: 'remote.png',
      mimeType: 'image/png',
      size: 3,
    })
    await expect(test.stage()).rejects.toThrow('Limite de 1')
    expect(test.storage.write).not.toHaveBeenCalled()
  })
  it('rejects extensions, MIME types, unavailable policy and unrecoverable legacy values', async () => {
    const test = fixture()
    await expect(test.controller.stage(field, test.file('photo.exe'))).rejects.toThrow('extensão')
    await expect(test.controller.stage(field, test.file('photo.png', 3, 'image/svg+xml'))).rejects.toThrow('tipo')
    await expect(test.controller.stage(field, test.file('photo.png', 101))).rejects.toThrow('tamanho máximo')
    const unavailable = fixture({ policy: undefined })
    await expect(unavailable.stage()).rejects.toThrow('política')
    await expect(test.controller.prepare({ group: { photos: [{}] } })).rejects.toThrow('Selecione novamente')
  })
  it('identifies the rejected file and preserves existing values at count and total limits', async () => {
    for (const limits of [{ maxFiles: 1 }, { maxTotalSize: 5 }]) {
      const test = fixture()
      const original = await test.stage('original.png')
      test.controller.registerField(field, () => ({ multiple: true, ...limits }), () => test.values.group.photos)
      await expect(test.controller.stage(field, test.file('rejected.png'))).rejects.toMatchObject({
        message: expect.stringContaining('rejected.png'),
        description: { code: 'file-limit', clientId: expect.any(String) },
      })
      expect(test.values.group.photos).toEqual([original])
      expect(test.storage.write).toHaveBeenCalledTimes(1)
    }
  })
  it('supports policy and readonly changes without applying late results', async () => {
    const readonly = shallowRef(false)
    const test = fixture({ readonly })
    const gate = deferred<void>()
    vi.mocked(test.storage.write).mockImplementationOnce(async (_scope, value, binary) => {
      await gate.promise
      test.bytes.set(value.clientId, binary)
    })
    const pending = test.controller.stage(field, test.file())
    readonly.value = true
    gate.resolve()
    const value = await pending
    expect(test.controller.canApply(value.clientId)).toBe(false)
    expect(test.controller.recovery.value.items[0]?.value).toEqual(value)
    await expect(test.controller.confirmRecovered(value.clientId)).rejects.toThrow('bloqueada')
    readonly.value = false
    expect(test.controller.canApply(value.clientId)).toBe(false)
    await test.controller.confirmRecovered(value.clientId)
    expect(test.controller.canApply(value.clientId)).toBe(true)
  })
  it('finishes an already authorized recording in recovery while blocked', async () => {
    const readonly = shallowRef(false)
    const test = fixture({ readonly })
    const capture = test.controller.beginCapture(field)
    readonly.value = true
    const blob = new Blob(['recording'], { type: 'audio/webm;codecs=opus' })
    const value = await capture.finish(
      { binary: { kind: 'blob', blob }, name: 'record.webm', mimeType: blob.type, size: blob.size, durationMs: 1000 },
      true,
    )
    expect(test.controller.recovery.value.items[0]?.value.durationMs).toBe(1000)
    expect(test.controller.canApply(value.clientId)).toBe(false)
    expect(test.values.group.photos).toEqual([])
  })
  it('lets viewer readonly override editable controller methods and isolates associations', async () => {
    const test = fixture()
    const detach = test.controller.associateViewer(() => true, vi.fn(), vi.fn())
    await expect(test.stage()).rejects.toThrow('bloqueada')
    expect(() => test.controller.markCommitted({})).toThrow('bloqueada')
    expect(() => test.controller.associateViewer(() => false, vi.fn(), vi.fn())).toThrow('separado')
    expect((await test.controller.getSource({ documentId: 'remote' })).url).toContain('https:')
    detach()
    await test.stage()
  })
  it('restores a serialized snapshot and sends it without mounted fields', async () => {
    const test = fixture()
    await test.stage()
    const snapshot = JSON.parse(JSON.stringify(await test.controller.prepare(test.values)))
    const resumed = useQfbMediaController({
      scope,
      policy,
      storage: test.storage,
      transport: test.transport,
      initialSnapshot: snapshot,
    })
    const upload = await resumed.uploadPending('response', snapshot)
    expect(upload.errors).toEqual([])
    const next = resumed.applyRemote(snapshot.values, upload.results)
    expect((next.group as typeof test.values.group).photos[0]?.documentId).toBeTruthy()
    expect(snapshot.values.group.photos[0]?.documentId).toBeUndefined()
    expect(test.transport.upload).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: snapshot.uploads[0].idempotencyKey }),
    )
  })
  it('rejects snapshots from another user or response', async () => {
    const test = fixture()
    await test.stage()
    const snapshot = await test.controller.prepare(test.values)
    const other = fixture({ scope: { ...scope, userKey: 'another' } })
    await expect(other.controller.uploadPending('response', snapshot)).rejects.toThrow('outra resposta')
    expect(other.transport.upload).not.toHaveBeenCalled()
  })
  it('preserves partial upload successes and enforces transport concurrency', async () => {
    const test = fixture({ concurrency: 2 })
    await test.stage('first.png')
    await test.stage('second.png')
    await test.stage('third.png')
    let active = 0
    let maximum = 0
    vi.mocked(test.transport.upload).mockImplementation(async (item) => {
      active++
      maximum = Math.max(maximum, active)
      await new Promise(resolve => setTimeout(resolve, 5))
      active--
      if (item.value.name === 'second.png') throw new Error('offline')
      return { kind: 'linked', field: item.field, value: { ...item.value, documentId: `doc-${item.value.name}` } }
    })
    const snapshot = await test.controller.prepare(test.values)
    const upload = await test.controller.uploadPending('response', snapshot)
    expect(maximum).toBe(2)
    expect(upload.results).toHaveLength(2)
    expect(upload.errors).toHaveLength(1)
    expect(snapshot.uploads).toHaveLength(3)
  })
  it('ignores cancelled upload completions and retains the binary', async () => {
    const test = fixture()
    const value = await test.stage()
    const started = deferred<void>()
    const gate = deferred<QfbLinkedRemoteMedia>()
    vi.mocked(test.transport.upload).mockImplementation(async () => {
      started.resolve()
      return gate.promise
    })
    const pending = test.controller.uploadPending('response', await test.controller.prepare(test.values))
    await started.promise
    test.controller.cancel(value.clientId)
    gate.resolve({ kind: 'linked', field, value: { ...value, documentId: 'late' } })
    const upload = await pending
    expect(upload.results).toEqual([])
    expect(upload.errors[0]?.code).toBe('cancelled')
    expect(test.bytes.has(value.clientId)).toBe(true)
  })
  it('never restores a removed value when applying remote results', async () => {
    const test = fixture()
    const value = await test.stage()
    const result: QfbLinkedRemoteMedia = { kind: 'linked', field, value: { ...value, documentId: 'doc' } }
    expect(test.controller.applyRemote({ group: { photos: [] } }, [result])).toEqual({ group: { photos: [] } })
  })
  it('reconciles legacy attachments and keeps local pending values on stale lists', async () => {
    const test = fixture()
    const value = await test.stage()
    vi.mocked(test.transport.list).mockResolvedValueOnce([
      { kind: 'unassigned', document: { documentId: 'legacy', name: 'original.txt', size: 1, mimeType: 'text/plain' } },
    ])
    const remote = await test.controller.reconcile('response')
    expect(remote.unassigned).toHaveLength(1)
    expect(test.controller.items.value[value.clientId]?.state).toBe('local')
    expect(test.values.group.photos).toEqual([value])
  })
  it('deletes remotely only after JSON confirmation, without clearing durable local data', async () => {
    const old: QfbMediaValue = {
      version: 1,
      clientId: 'old',
      documentId: 'remote',
      name: 'old.png',
      mimeType: 'image/png',
      size: 1,
    }
    const test = fixture({ initialValues: { group: { photos: [old] } } })
    const snapshot = await test.controller.prepare(test.values)
    await expect(test.controller.applyRemovals('response', snapshot)).rejects.toThrow('Confirme primeiro')
    expect(test.transport.remove).not.toHaveBeenCalled()
    test.controller.markCommitted(test.values)
    await test.controller.applyRemovals('response', snapshot)
    expect(test.transport.remove).toHaveBeenCalledWith(
      'response',
      'remote',
      snapshot.removals[0]!.idempotencyKey,
      expect.any(AbortSignal),
    )
    expect(test.storage.remove).not.toHaveBeenCalled()
  })
  it('rolls back edits and releases transient sources without deleting files or documents', async () => {
    const test = fixture()
    const value = await test.stage()
    const release = vi.fn()
    vi.mocked(test.storage.source).mockResolvedValue({ url: 'blob:test', release })
    const source = await test.controller.getSource(value)
    expect(test.controller.rollback()).toEqual({})
    test.controller.dispose()
    source.release()
    expect(release).toHaveBeenCalledTimes(1)
    expect(test.bytes.has(value.clientId)).toBe(true)
    expect(test.transport.remove).not.toHaveBeenCalled()
  })
})

describe('sSR-safe factories', () => {
  it('creates adapters without opening a database or accessing browser upload APIs', () => {
    expect(createQfbIndexedDbStorage()).toHaveProperty('write')
    expect(
      createQfbHttpMediaTransport({
        urls: { list: () => '/', access: () => '/', upload: () => '/', remove: () => '/' },
        toRemote: value => value as never,
        toAccess: value => value as never,
      }),
    ).toHaveProperty('upload')
  })
})
