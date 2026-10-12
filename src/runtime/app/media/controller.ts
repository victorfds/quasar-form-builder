import type {
  QfbLinkedRemoteMedia,
  QfbMediaCandidate,
  QfbMediaChange,
  QfbMediaController,
  QfbMediaControllerOptions,
  QfbMediaErrorDescription,
  QfbMediaFieldContext,
  QfbMediaFieldOptions,
  QfbMediaRuntimeItem,
  QfbMediaSnapshot,
  QfbMediaSource,
  QfbMediaUploadItem,
} from './types'
import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch } from 'vue'
import { createQfbId } from '../schema/identity'
import { describeMediaError, QfbMediaError } from './errors'
import { positiveNumber, validateMediaSelection } from './policy'
import {
  cloneMediaJson,
  collectMediaValues,
  copyMediaValue,
  freezeMediaJson,
  getValueAtPath,
  isQfbMediaValue,
  mediaValues,
  sameField,
  sameScope,
  setValueAtPath,
} from './values'

export function useQfbMediaController(options: QfbMediaControllerOptions): QfbMediaController {
  const scope = Object.freeze({ ...options.scope })
  if (!scope.userKey || !scope.formId || !scope.responseKey)
    throw new QfbMediaError('scope-mismatch', 'Escopo de mídia incompleto')
  const items = shallowRef<Record<string, QfbMediaRuntimeItem>>({})
  const viewer = shallowRef<{
    readonly: () => boolean
    change: (event: QfbMediaChange) => void
    error: (event: QfbMediaErrorDescription) => void
  } | null>(null)
  const locked = computed(() => Boolean(toValue(options.readonly) || viewer.value?.readonly()))
  const policy = computed(() => toValue(options.policy))
  const activity = shallowRef(0)
  const fields = new Map<
    string,
    { field: QfbMediaFieldContext, options: () => QfbMediaFieldOptions, value: () => unknown, active: boolean }
  >()
  const stages = new Set<Promise<unknown>>()
  const reservations = new Map<string, QfbMediaRuntimeItem>()
  const aborts = new Map<string, AbortController>()
  const generations = new Map<string, number>()
  const applyGenerations = new Map<string, number>()
  const applyClientGenerations = new Map<string, number>()
  const sources = new Set<QfbMediaSource>()
  let committed = cloneMediaJson(options.initialValues || {})
  let disposed = false
  let editGeneration = 0
  let initialSnapshot: QfbMediaSnapshot | undefined

  const stopLockWatch = watch(
    locked,
    () => {
      editGeneration++
    },
    { flush: 'sync' },
  )

  const stopPolicyWatch = watch(
    () => JSON.stringify(policy.value),
    () => {
      editGeneration++
    },
    { flush: 'sync' },
  )

  function fieldKey(field: QfbMediaFieldContext) {
    return JSON.stringify([field.fieldId, field.fieldPath])
  }

  function rulesKey(rules: QfbMediaFieldOptions) {
    return JSON.stringify([rules.multiple, rules.maxFiles, rules.maxFileSize, rules.maxTotalSize, rules.accept, rules.mediaKind])
  }

  function assertAlive() {
    if (disposed) throw new QfbMediaError('disposed', 'Controlador de mídia encerrado')
  }
  function assertEditable(field?: QfbMediaFieldContext) {
    assertAlive()
    const registered = field ? fields.get(fieldKey(field)) : undefined
    if (registered && !registered.active)
      throw new QfbMediaError('field-unavailable', 'Campo de mídia desmontado', field)
    const rules = registered?.options()
    if (locked.value || rules?.readonly || rules?.disabled)
      throw new QfbMediaError('readonly', 'A edição de mídia está bloqueada', field)
  }
  function registration(field: QfbMediaFieldContext) {
    const registered = fields.get(fieldKey(field))
    if (!registered || !sameField(registered.field, field))
      throw new QfbMediaError('field-unavailable', 'Campo de mídia não registrado neste contexto', field)
    return registered
  }
  function notifyError(error: unknown, field?: QfbMediaFieldContext, clientId?: string) {
    const description = describeMediaError(error, field, clientId)
    viewer.value?.error(description)
    return description
  }
  function update(clientId: string, patch: Partial<QfbMediaRuntimeItem>) {
    const current = items.value[clientId]
    if (!current || disposed) return
    const item = { ...current, ...patch }
    items.value = { ...items.value, [clientId]: item }
    viewer.value?.change({ field: item.field, clientId, state: item.state, recovery: item.recovery })
  }
  function track<T>(promise: Promise<T>): Promise<T> {
    activity.value++
    return promise.finally(() => {
      activity.value--
    })
  }
  function assertSnapshot(snapshot: QfbMediaSnapshot) {
    assertAlive()
    if (
      !snapshot
      || snapshot.version !== 1
      || !snapshot.snapshotId
      || !snapshot.scope
      || !sameScope(scope, snapshot.scope)
    ) {
      throw new QfbMediaError('scope-mismatch', 'Snapshot de outra resposta ou usuário')
    }
    if (
      !Array.isArray(snapshot.fields)
      || !Array.isArray(snapshot.uploads)
      || !Array.isArray(snapshot.removals)
      || !snapshot.values
      || !snapshot.committedValues
    ) {
      throw new QfbMediaError('invalid-snapshot', 'Snapshot de mídia inválido')
    }
    const ids = new Set<string>()
    for (const field of snapshot.fields) {
      if (
        !field.fieldId
        || !Array.isArray(field.fieldPath)
        || !field.fieldPath.length
        || field.fieldPath.some(
          segment => typeof segment !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(segment),
        )
        || ids.has(fieldKey(field))
      ) {
        throw new QfbMediaError('invalid-snapshot', 'Contexto de campo inválido')
      }
      ids.add(fieldKey(field))
    }
    const uploadedIds = new Set<string>()
    for (const item of snapshot.uploads) {
      const known = snapshot.fields.find(field => sameField(field, item.field))
      if (
        !known
        || !isQfbMediaValue(item.value)
        || item.value.documentId
        || uploadedIds.has(item.value.clientId)
        || !item.idempotencyKey
        || !mediaValues(getValueAtPath(snapshot.values, item.field.fieldPath)).some(
          value => value.clientId === item.value.clientId,
        )
      ) {
        throw new QfbMediaError('invalid-snapshot', 'Upload não corresponde aos valores do snapshot')
      }
      uploadedIds.add(item.value.clientId)
    }
    const prior = collectMediaValues(snapshot.committedValues)
    const current = collectMediaValues(snapshot.values)
    for (const removal of snapshot.removals) {
      if (
        !removal.documentId
        || !removal.clientId
        || !removal.idempotencyKey
        || !prior.some(value => value.clientId === removal.clientId && value.documentId === removal.documentId)
        || current.some(value => value.documentId === removal.documentId)
      ) {
        throw new QfbMediaError('invalid-snapshot', 'Remoção não corresponde aos valores do snapshot')
      }
    }
  }
  function stageInternal(
    field: QfbMediaFieldContext,
    input: File | QfbMediaCandidate,
    capture?: {
      generation: number
      policy: NonNullable<typeof policy.value>
      rules: QfbMediaFieldOptions
      recovery?: boolean
    },
  ) {
    assertAlive()
    if (!capture) assertEditable(field)
    const registered = registration(field)
    const activePolicy = capture?.policy || policy.value
    if (!activePolicy)
      throw new QfbMediaError('policy-unavailable', 'A política de mídia ainda não está disponível', field)
    const candidate: QfbMediaCandidate
      = 'binary' in input
        ? input
        : {
            binary: { kind: 'blob', blob: input },
            name: input.name,
            mimeType: input.type || 'application/octet-stream',
            size: input.size,
          }
    const clientId = createQfbId()
    const value = copyMediaValue({
      version: 1,
      clientId,
      name: candidate.name,
      mimeType: candidate.mimeType,
      size: candidate.size,
      durationMs: candidate.durationMs,
    })
    if (
      !isQfbMediaValue(value)
      || (candidate.binary.kind === 'blob' && candidate.binary.blob.size !== value.size)
      || (candidate.binary.kind === 'native' && !candidate.binary.uri)
    ) {
      throw new QfbMediaError('invalid-value', 'Metadados de arquivo inválidos', field, clientId)
    }
    const rules = capture?.rules || registered.options()
    const selectionRules = rulesKey(rules)
    const existing = mediaValues(registered.value())
    for (const id of existing.map(item => item.clientId)) reservations.delete(id)
    const pending = [...reservations.values()].filter(item => sameField(item.field, field)).map(item => item.value)
    validateMediaSelection(rules.multiple ? [...existing, ...pending, value] : [value], activePolicy, rules, field)
    const generation = capture?.generation ?? editGeneration
    const operationGeneration = generations.get(clientId) || 0
    const item: QfbMediaRuntimeItem = { field: cloneMediaJson(field), value, state: 'staging' }
    items.value = { ...items.value, [clientId]: item }
    reservations.set(clientId, item)
    applyGenerations.set(clientId, generation)
    applyClientGenerations.set(clientId, operationGeneration)
    update(clientId, {})
    const task = track(
      (async () => {
        try {
          await options.storage.write(scope, value, candidate.binary)
          const currentRules = registered.options()
          const recovery
            = capture?.recovery
              || disposed
              || locked.value
              || !registered.active
              || currentRules.readonly
              || currentRules.disabled
              || selectionRules !== rulesKey(currentRules)
              || generation !== editGeneration
              || operationGeneration !== (generations.get(clientId) || 0)
          update(clientId, { state: 'local', recovery })
          if (recovery) reservations.delete(clientId)
          return copyMediaValue(value)
        }
        catch (error) {
          reservations.delete(clientId)
          const failure = new QfbMediaError(
            'storage',
            error instanceof Error ? error.message : 'Não foi possível armazenar o arquivo',
            field,
            clientId,
          )
          update(clientId, { state: 'error', error: notifyError(failure) })
          throw failure
        }
      })(),
    )
    stages.add(task)
    void task.finally(() => stages.delete(task)).catch(() => {})
    return task
  }

  const controller: QfbMediaController = {
    scope,
    readonly: locked,
    policy,
    items: computed(() => freezeMediaJson(cloneMediaJson(items.value))),
    busy: computed(() => activity.value > 0),
    recovery: computed(() => ({
      version: 1,
      scope,
      items: Object.values(items.value)
        .filter(item => item.recovery && item.state === 'local')
        .map(item => ({ field: cloneMediaJson(item.field), value: copyMediaValue(item.value) })),
    })),
    registerField(field, getOptions, getValue) {
      assertAlive()
      if (!field.fieldId || !field.fieldPath.length)
        throw new QfbMediaError('field-unavailable', 'O campo precisa de fieldId e endereço FormKit', field)
      const key = fieldKey(field)
      const movingUpload = Object.values(items.value).some(
        item =>
          item.state === 'uploading'
          && item.field.fieldId === field.fieldId
          && mediaValues(getValue()).some(value => value.clientId === item.value.clientId)
          && !sameField(item.field, field),
      )
      if (movingUpload)
        throw new QfbMediaError('conflict', 'O endereço de um campo não pode mudar durante o envio', field)
      const registered = { field: cloneMediaJson(field), options: getOptions, value: getValue, active: true }
      fields.set(key, registered)
      for (const value of mediaValues(getValue())) {
        if (!items.value[value.clientId]) {
          items.value = {
            ...items.value,
            [value.clientId]: {
              field: registered.field,
              value: copyMediaValue(value),
              state: value.documentId ? 'uploaded' : 'local',
            },
          }
        }
      }
      // Keep the last address and limits for preserved, unmounted conditional inputs.
      return () => {
        if (fields.get(key) !== registered) return
        registered.value = () => undefined
        registered.active = false
      }
    },
    associateViewer(isReadonly, onChange, onError) {
      assertAlive()
      if (viewer.value) throw new QfbMediaError('conflict', 'Use um controlador separado para cada visualizador')
      const association = { readonly: isReadonly, change: onChange, error: onError }
      viewer.value = association
      return () => {
        if (viewer.value === association) {
          viewer.value = null
          editGeneration++
        }
      }
    },
    async stage(field, candidate) {
      try {
        return await stageInternal(field, candidate)
      }
      catch (error) {
        if (!(error instanceof QfbMediaError && error.description.code === 'storage')) notifyError(error, field)
        throw error
      }
    },
    beginCapture(field) {
      assertEditable(field)
      const registered = registration(field)
      if (!policy.value)
        throw new QfbMediaError('policy-unavailable', 'A política de mídia ainda não está disponível', field)
      const capture = { generation: editGeneration, policy: cloneMediaJson(policy.value), rules: cloneMediaJson(registered.options()) }
      let released = false
      return {
        finish: (candidate, recovery = false) => {
          if (released) return Promise.reject(new QfbMediaError('cancelled', 'Captura encerrada', field))
          released = true
          return stageInternal(field, candidate, { ...capture, recovery })
        },
        release: () => {
          released = true
        },
      }
    },
    canApply(clientId) {
      const item = items.value[clientId]
      if (!item || disposed || item.recovery) return false
      const registered = fields.get(fieldKey(item.field))
      const rules = registered?.options()
      const allowed = Boolean(
        !locked.value
        && policy.value
        && applyGenerations.get(clientId) === editGeneration
        && applyClientGenerations.get(clientId) === (generations.get(clientId) || 0)
        && registered
        && registered.active
        && sameField(registered.field, item.field)
        && rules
        && !rules.readonly
        && !rules.disabled,
      )
      if (!allowed && item.state === 'local') update(clientId, { recovery: true })
      return allowed
    },
    async prepare(values) {
      assertEditable()
      await Promise.all([...stages])
      assertEditable()
      const copy = cloneMediaJson(values)
      const uploads: QfbMediaUploadItem[] = []
      const seen = new Set<string>()
      const contexts: QfbMediaFieldContext[] = []
      for (const registered of fields.values()) {
        const raw = getValueAtPath(values, registered.field.fieldPath)
        if (raw === undefined || raw === null || (Array.isArray(raw) && !raw.length)) continue
        const media = mediaValues(raw)
        if (
          !media.length
          || (Array.isArray(raw) && media.length !== raw.length)
          || (!Array.isArray(raw) && !isQfbMediaValue(raw))
        ) {
          throw new QfbMediaError(
            'invalid-value',
            'Selecione novamente o arquivo: a resposta não contém uma referência de mídia válida',
            registered.field,
          )
        }
        if (!policy.value && media.some(value => !value.documentId)) {
          throw new QfbMediaError(
            'policy-unavailable',
            'A política de mídia ainda não está disponível',
            registered.field,
          )
        }
        if (policy.value) validateMediaSelection(media, policy.value, registered.options(), registered.field)
        contexts.push(cloneMediaJson(registered.field))
        for (const value of media) {
          if (seen.has(value.clientId)) {
            throw new QfbMediaError(
              'conflict',
              'A mesma mídia está associada a mais de um campo',
              registered.field,
              value.clientId,
            )
          }
          seen.add(value.clientId)
          const runtime = items.value[value.clientId]
          if (runtime?.recovery) {
            throw new QfbMediaError(
              'invalid-value',
              'Confirme o arquivo na área de recuperação antes de salvar',
              registered.field,
              value.clientId,
            )
          }
          if (!value.documentId) {
            try {
              await options.storage.read(scope, value.clientId)
            }
            catch {
              throw new QfbMediaError(
                'missing-source',
                `${value.name}: arquivo local não disponível`,
                registered.field,
                value.clientId,
              )
            }
            uploads.push({
              value: copyMediaValue(value),
              field: cloneMediaJson(registered.field),
              idempotencyKey: `qfb:upload:${value.clientId}`,
            })
            update(value.clientId, { state: 'queued' })
          }
          reservations.delete(value.clientId)
        }
      }
      // Restored snapshots can be sent without remounting their input components.
      if (!fields.size && initialSnapshot) {
        contexts.push(...cloneMediaJson(initialSnapshot.fields))
        for (const field of initialSnapshot.fields) {
          for (const value of mediaValues(getValueAtPath(copy, field.fieldPath))) seen.add(value.clientId)
        }
        for (const item of initialSnapshot.uploads) {
          if (
            mediaValues(getValueAtPath(copy, item.field.fieldPath)).some(
              value => value.clientId === item.value.clientId && !value.documentId,
            )
          ) {
            await options.storage.read(scope, item.value.clientId)
            uploads.push(cloneMediaJson(item))
          }
        }
      }
      const live = collectMediaValues(copy)
      if (live.some(value => !seen.has(value.clientId)))
        throw new QfbMediaError('field-unavailable', 'Mídia sem um campo e endereço registrados')
      const removals = collectMediaValues(committed)
        .filter(value => value.documentId && !live.some(current => current.documentId === value.documentId))
        .map(value => ({
          documentId: value.documentId!,
          clientId: value.clientId,
          idempotencyKey: `qfb:remove:${value.clientId}:${value.documentId}`,
        }))
      const snapshot: QfbMediaSnapshot = {
        version: 1,
        snapshotId: createQfbId(),
        scope,
        values: copy,
        committedValues: cloneMediaJson(committed),
        fields: contexts,
        uploads,
        removals,
      }
      assertSnapshot(snapshot)
      return freezeMediaJson(snapshot)
    },
    async uploadPending(responseId, snapshot) {
      assertEditable()
      assertSnapshot(snapshot)
      if (!responseId) throw new QfbMediaError('invalid-value', 'responseId é obrigatório para enviar arquivos')
      const results: QfbLinkedRemoteMedia[] = []
      const errors: QfbMediaErrorDescription[] = []
      let cursor = 0
      const concurrency = Math.max(1, Math.floor(positiveNumber(options.concurrency) || 2))
      const worker = async () => {
        while (cursor < snapshot.uploads.length) {
          const item = snapshot.uploads[cursor++]!
          const { clientId } = item.value
          if (aborts.has(clientId)) {
            errors.push(notifyError(new QfbMediaError('conflict', 'Upload já está em andamento', item.field, clientId)))
            continue
          }
          const abort = new AbortController()
          const generation = generations.get(clientId) || 0
          aborts.set(clientId, abort)
          if (!items.value[clientId]) {
            items.value = {
              ...items.value,
              [clientId]: { value: copyMediaValue(item.value), field: cloneMediaJson(item.field), state: 'queued' },
            }
          }
          update(clientId, { state: 'uploading', error: undefined, progress: undefined })
          try {
            assertEditable(item.field)
            const binary = await options.storage.read(scope, clientId)
            if (abort.signal.aborted) throw new QfbMediaError('cancelled', 'Envio cancelado', item.field, clientId)
            const result = await options.transport.upload({
              ...item,
              responseId,
              binary,
              signal: abort.signal,
              onProgress: (progress) => {
                if (generation === (generations.get(clientId) || 0) && !abort.signal.aborted)
                  update(clientId, { progress: { ...progress, clientId } })
              },
            })
            if (abort.signal.aborted || disposed || generation !== (generations.get(clientId) || 0))
              throw new QfbMediaError('cancelled', 'Resultado de uma operação cancelada', item.field, clientId)
            if (
              result.kind !== 'linked'
              || !isQfbMediaValue(result.value)
              || !result.value.documentId
              || result.value.clientId !== clientId
              || !sameField(result.field, item.field)
            ) {
              throw new QfbMediaError(
                'conflict',
                'O servidor retornou uma associação de mídia diferente',
                item.field,
                clientId,
              )
            }
            results.push(cloneMediaJson(result))
            update(clientId, { state: 'uploaded', value: copyMediaValue(result.value) })
          }
          catch (error) {
            const description = notifyError(
              abort.signal.aborted ? new QfbMediaError('cancelled', 'Envio cancelado', item.field, clientId) : error,
              item.field,
              clientId,
            )
            errors.push(description)
            update(clientId, { state: description.code === 'cancelled' ? 'local' : 'error', error: description })
          }
          finally {
            if (aborts.get(clientId) === abort) aborts.delete(clientId)
          }
        }
      }
      await track(Promise.all(Array.from({ length: Math.min(concurrency, snapshot.uploads.length) }, worker)))
      return { results, errors }
    },
    async reconcile(responseId) {
      assertAlive()
      const abort = new AbortController()
      const key = `list:${createQfbId()}`
      aborts.set(key, abort)
      try {
        const remote = await track(options.transport.list(responseId, abort.signal))
        assertAlive()
        const result = {
          linked: {} as Record<string, QfbLinkedRemoteMedia>,
          unassigned: [] as import('./types').QfbUnassignedRemoteMedia[],
          errors: [] as QfbMediaErrorDescription[],
        }
        for (const item of remote) {
          if (item.kind === 'unassigned') {
            result.unassigned.push(cloneMediaJson(item))
            continue
          }
          const existing = items.value[item.value.clientId]
          const previous = result.linked[item.value.clientId]
          if (
            !isQfbMediaValue(item.value)
            || !item.value.documentId
            || (existing && !sameField(existing.field, item.field))
            || (previous && previous.value.documentId !== item.value.documentId)
          ) {
            result.errors.push(
              notifyError(
                new QfbMediaError(
                  'conflict',
                  'Documentos com identidade ou campo conflitante',
                  item.field,
                  item.value.clientId,
                ),
              ),
            )
            continue
          }
          result.linked[item.value.clientId] = cloneMediaJson(item)
        }
        return result
      }
      finally {
        aborts.delete(key)
      }
    },
    applyRemote(values, results) {
      assertAlive()
      const copy = cloneMediaJson(values)
      for (const result of results) {
        if (result.kind !== 'linked' || !isQfbMediaValue(result.value) || !result.value.documentId) continue
        const known
          = fields.get(fieldKey(result.field))?.field
            || initialSnapshot?.fields.find(field => sameField(field, result.field))
        if (!known || !sameField(known, result.field)) continue
        const current = getValueAtPath(copy, result.field.fieldPath)
        const apply = (value: unknown) =>
          isQfbMediaValue(value)
          && value.clientId === result.value.clientId
          && (!value.documentId || value.documentId === result.value.documentId)
            ? copyMediaValue(result.value)
            : value
        setValueAtPath(copy, result.field.fieldPath, Array.isArray(current) ? current.map(apply) : apply(current))
      }
      return copy
    },
    async applyRemovals(responseId, snapshot) {
      assertEditable()
      assertSnapshot(snapshot)
      const errors: QfbMediaErrorDescription[] = []
      for (const removal of snapshot.removals) {
        assertEditable()
        if (collectMediaValues(committed).some(value => value.documentId === removal.documentId))
          throw new QfbMediaError('conflict', 'Confirme primeiro o JSON sem a referência removida')
        const abort = new AbortController()
        aborts.set(removal.clientId, abort)
        update(removal.clientId, { state: 'removing' })
        try {
          await track(options.transport.remove(responseId, removal.documentId, removal.idempotencyKey, abort.signal))
        }
        catch (error) {
          errors.push(notifyError(error, undefined, removal.clientId))
        }
        finally {
          aborts.delete(removal.clientId)
        }
      }
      return errors
    },
    restore(snapshot) {
      assertSnapshot(snapshot)
      if (viewer.value || activity.value)
        throw new QfbMediaError('conflict', 'Restaure o snapshot antes de associar o visualizador')
      initialSnapshot = freezeMediaJson(cloneMediaJson(snapshot))
      committed = cloneMediaJson(snapshot.committedValues)
      for (const item of snapshot.uploads) {
        items.value = {
          ...items.value,
          [item.value.clientId]: {
            value: copyMediaValue(item.value),
            field: cloneMediaJson(item.field),
            state: 'queued',
          },
        }
      }
    },
    markCommitted(values) {
      assertEditable()
      committed = cloneMediaJson(values)
      for (const value of collectMediaValues(committed)) {
        if (items.value[value.clientId] && value.documentId)
          update(value.clientId, { value: copyMediaValue(value), state: 'uploaded', error: undefined })
      }
    },
    rollback() {
      assertEditable()
      editGeneration++
      for (const clientId of aborts.keys()) controller.cancel(clientId)
      for (const item of Object.values(items.value)) {
        if (
          !collectMediaValues(committed).some(value => value.clientId === item.value.clientId)
          && !item.value.documentId
        ) {
          update(item.value.clientId, { recovery: true, state: 'local' })
        }
      }
      reservations.clear()
      return cloneMediaJson(committed)
    },
    async confirmRecovered(clientId, targetField) {
      const item = items.value[clientId]
      if (!item?.recovery)
        throw new QfbMediaError('invalid-value', 'Arquivo de recuperação não encontrado', undefined, clientId)
      if (targetField && !sameField(targetField, item.field))
        throw new QfbMediaError('conflict', 'A recuperação pertence a outro contexto de campo', targetField, clientId)
      const destination = targetField || item.field
      assertEditable(destination)
      const registered = fields.get(fieldKey(destination))
      if (!registered)
        throw new QfbMediaError('field-unavailable', 'Campo de recuperação não disponível', item.field, clientId)
      if (!policy.value) {
        throw new QfbMediaError(
          'policy-unavailable',
          'A política de mídia ainda não está disponível',
          item.field,
          clientId,
        )
      }
      validateMediaSelection(
        registered.options().multiple ? [...mediaValues(registered.value()), item.value] : [item.value],
        policy.value,
        registered.options(),
        item.field,
      )
      const generation = editGeneration
      await options.storage.read(scope, clientId)
      assertEditable(destination)
      if (generation !== editGeneration || fields.get(fieldKey(destination)) !== registered)
        throw new QfbMediaError('conflict', 'O contexto ou a política mudou; confirme a recuperação novamente', destination, clientId)
      validateMediaSelection(
        registered.options().multiple ? [...mediaValues(registered.value()), item.value] : [item.value],
        policy.value!,
        registered.options(),
        destination,
      )
      applyGenerations.set(clientId, editGeneration)
      applyClientGenerations.set(clientId, generations.get(clientId) || 0)
      update(clientId, { recovery: false, state: 'local', field: cloneMediaJson(registered.field) })
      return copyMediaValue(item.value)
    },
    async discardRecovered(clientId) {
      const item = items.value[clientId]
      if (!item?.recovery) return
      assertEditable(item.field)
      await options.storage.remove(scope, clientId)
      const next = { ...items.value }
      delete next[clientId]
      items.value = next
    },
    async getSource(value) {
      assertAlive()
      let source: QfbMediaSource | undefined
      if ('clientId' in value) {
        try {
          if (await options.storage.has(scope, value.clientId))
            source = await options.storage.source(scope, value.clientId)
        }
        catch (error) {
          if (!value.documentId)
            throw new QfbMediaError('storage', error instanceof Error ? error.message : 'Falha ao ler o arquivo local', undefined, value.clientId)
        }
      }
      if (!source && value.documentId) {
        const abort = new AbortController()
        const key = `source:${createQfbId()}`
        aborts.set(key, abort)
        try {
          source = await options.transport.access(value.documentId, abort.signal)
        }
        finally {
          aborts.delete(key)
        }
      }
      if (!source) {
        throw new QfbMediaError(
          'missing-source',
          'Arquivo local não disponível',
          undefined,
          'clientId' in value ? value.clientId : undefined,
        )
      }
      if (disposed) {
        source.release()
        throw new QfbMediaError('disposed', 'Controlador encerrado')
      }
      let released = false
      const managed: QfbMediaSource = {
        url: source.url,
        expiresAt: source.expiresAt,
        release: () => {
          if (!released) {
            released = true
            sources.delete(managed)
            source.release()
          }
        },
      }
      sources.add(managed)
      return managed
    },
    cancel(clientId) {
      generations.set(clientId, (generations.get(clientId) || 0) + 1)
      aborts.get(clientId)?.abort()
      if (items.value[clientId]?.state === 'staging') update(clientId, { recovery: true })
    },
    dispose() {
      if (disposed) return
      disposed = true
      editGeneration++
      stopLockWatch()
      stopPolicyWatch()
      for (const abort of aborts.values()) abort.abort()
      aborts.clear()
      for (const source of sources) source.release()
      viewer.value = null
    },
  }
  if (options.initialSnapshot) controller.restore(options.initialSnapshot)
  if (options.initialRecovery) {
    if (options.initialRecovery.version !== 1 || !sameScope(scope, options.initialRecovery.scope))
      throw new QfbMediaError('scope-mismatch', 'Recuperação de outra resposta ou usuário')
    for (const item of options.initialRecovery.items) {
      if (!isQfbMediaValue(item.value)) throw new QfbMediaError('invalid-value', 'Referência de recuperação inválida')
      items.value = {
        ...items.value,
        [item.value.clientId]: { ...cloneMediaJson(item), state: 'local', recovery: true },
      }
    }
  }
  if (getCurrentScope()) onScopeDispose(controller.dispose)
  return controller
}
