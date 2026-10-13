import type { FormKitFrameworkContext } from '@formkit/core'
import type { QfbMediaCandidate, QfbMediaFieldContext, QfbMediaValue } from '../../types/media'
import { computed, inject, onMounted, onScopeDispose, shallowRef, watch } from 'vue'
import { createQfbMediaError, describeMediaError } from '../../utils/mediaErrors'
import { validateMediaFieldLimits } from '../../utils/mediaPolicy'
import { getValueAtPath, isQfbMediaValue, mediaValues, sameField } from '../../utils/mediaValues'
import { qfbMediaControllerKey, qfbMediaErrorKey } from '../constants/injectionKeys'
import { getFormKitContextAttrs } from '../utils/quasarFieldDesign'
import { useQfbFieldAccess } from './useQfbFieldAccess'

export function useQfbMediaField(context: FormKitFrameworkContext) {
  const controllerRef = inject(qfbMediaControllerKey, shallowRef(undefined))
  const emitError = inject(qfbMediaErrorKey, () => {})
  const controller = computed(() => controllerRef.value)
  const { state: access, locked: accessLocked } = useQfbFieldAccess(context)
  const errors = shallowRef<string[]>([])
  const busy = shallowRef(false)
  const ready = shallowRef(false)
  onMounted(() => {
    ready.value = true
    const value = context._value
    const candidates = Array.isArray(value) ? value : value ? [value] : []
    if (
      controller.value
      && candidates.length
      && candidates.every(item => typeof File !== 'undefined' && item instanceof File)
    ) {
      void select(Array.isArray(value) ? candidates : candidates[0])
    }
  })
  let generation = 0
  const attrs = computed(() =>
    getFormKitContextAttrs(context, [
      'fieldId',
      'multiple',
      'accept',
      'maxFileSize',
      'maxTotalSize',
      'maxFiles',
      'maxDurationSeconds',
      'gallery',
      'mediaKind',
      'capture',
      'readonly',
      'disable',
      'disabled',
    ]),
  )
  const field = computed<QfbMediaFieldContext>(() => ({
    fieldId: String(context.fieldId || attrs.value.fieldId || ''),
    fieldPath: context.node.address
      .slice(context.node.root.type === 'input' ? 0 : context.node.root.address.length)
      .map(String),
  }))
  const values = computed(() => mediaValues(context._value))
  const locked = computed(() => Boolean(accessLocked.value || controller.value?.readonly.value))
  const recovery = computed(
    () => controller.value?.recovery.value.items.filter(item => sameField(item.field, field.value)) || [],
  )
  const canSelect = computed(
    () => ready.value && !locked.value && !busy.value && (!controller.value || Boolean(controller.value.policy.value)),
  )

  function message(text?: string) {
    if (!text) {
      context.node.store.remove('qfb-media')
      return
    }
    context.node.store.set({ key: 'qfb-media', type: 'error', value: text, visible: true, blocking: true, meta: {} })
  }
  function clearErrors() {
    errors.value = []
    message()
  }
  function error(error: unknown, notify = true) {
    const text = error instanceof Error ? error.message : 'Falha ao processar o arquivo'
    errors.value = [...errors.value, text]
    message(text)
    if (notify) emitError(describeMediaError(error, field.value))
  }
  function fieldOptions() {
    return { ...attrs.value, readonly: access.value.readonly, disabled: access.value.disabled }
  }

  const stopRegistration = watch(
    [controller, () => field.value.fieldId, () => JSON.stringify(field.value.fieldPath)],
    ([current], _previous, cleanup) => {
      if (!current) return
      try {
        const unregister = current.registerField(field.value, fieldOptions, () => context._value)
        cleanup(unregister)
      }
      catch (failure) {
        error(failure)
      }
    },
    { immediate: true, flush: 'sync' },
  )

  const stopAccess = watch(
    locked,
    () => {
      generation++
    },
    { flush: 'sync' },
  )
  const stopValue = watch(
    [() => context._value, ready, controller],
    async ([value, mounted], _old, cleanup) => {
      if (!mounted || !controller.value) return
      let cancelled = false
      cleanup(() => {
        cancelled = true
      })
      const raw = Array.isArray(value) ? value : value ? [value] : []
      if (raw.some(item => !isQfbMediaValue(item))) {
        message('Selecione novamente o arquivo: a resposta não contém os dados originais')
        return
      }
      for (const item of mediaValues(value)) {
        if (item.documentId) continue
        try {
          const source = await controller.value.getSource(item)
          source.release()
        }
        catch {
          if (!cancelled) message(`${item.name}: arquivo local não disponível`)
          return
        }
      }
      if (!cancelled && !busy.value && !errors.value.length) message()
    },
    { immediate: true },
  )

  async function apply(value: QfbMediaValue, operationGeneration = generation) {
    if (!controller.value?.canApply(value.clientId) || locked.value || operationGeneration !== generation) return false
    const next = attrs.value.multiple ? [...values.value, value] : value
    await context.node.input(next)
    return true
  }

  async function select(files: File[] | File | null, preserveErrors = false) {
    if (!files || !canSelect.value) return
    if (!controller.value) {
      if (!locked.value) await context.node.input(files)
      return
    }
    const currentGeneration = generation
    const batch = Array.isArray(files) ? files : [files]
    if (!preserveErrors) clearErrors()
    busy.value = true
    message('Armazenando arquivo...')
    try {
      for (const file of batch) {
        try {
          if (locked.value || currentGeneration !== generation) break
          const value = await controller.value.stage(field.value, file)
          await apply(value, currentGeneration)
        }
        catch (failure) {
          error(failure, false)
        }
      }
    }
    finally {
      busy.value = false
      message(errors.value.at(-1))
    }
  }

  async function remove(clientId: string) {
    if (locked.value || busy.value) return
    controller.value?.cancel(clientId)
    clearErrors()
    const next = values.value.filter(value => value.clientId !== clientId)
    await context.node.input(attrs.value.multiple ? next : next[0] || null)
  }
  async function confirmRecovery(clientId: string) {
    if (!controller.value || locked.value || busy.value) return
    clearErrors()
    try {
      await apply(await controller.value.confirmRecovered(clientId, field.value))
    }
    catch (failure) {
      error(failure)
    }
  }
  async function discardRecovery(clientId: string) {
    if (!controller.value || locked.value) return
    try {
      await controller.value.discardRecovered(clientId)
    }
    catch (failure) {
      error(failure)
    }
  }

  function beginRecording() {
    if (locked.value) throw createQfbMediaError('readonly', 'A gravação está bloqueada', field.value)
    clearErrors()
    message('Gravação ainda não confirmada')
    return controller.value?.beginCapture(field.value)
  }
  async function finishRecording(
    candidate: QfbMediaCandidate,
    capture?: ReturnType<NonNullable<typeof controller.value>['beginCapture']>,
  ) {
    busy.value = true
    message('Armazenando gravação...')
    try {
      if (!controller.value) {
        if (locked.value || candidate.binary.kind !== 'blob') return
        const file = new File([candidate.binary.blob], candidate.name, { type: candidate.mimeType })
        const current: File[] = (Array.isArray(context._value) ? context._value : context._value ? [context._value] : [])
          .filter((item: unknown): item is File => item instanceof File)
        validateMediaFieldLimits(attrs.value.multiple ? [...current, file] : [file], attrs.value, field.value)
        await context.node.input(attrs.value.multiple ? [...current, file] : file)
      }
      else {
        const value = capture ? await capture.finish(candidate) : await controller.value.stage(field.value, candidate)
        await apply(value)
      }
      message()
    }
    catch (failure) {
      error(failure)
      throw failure
    }
    finally {
      busy.value = false
    }
  }

  onScopeDispose(() => {
    generation++
    stopRegistration()
    stopAccess()
    stopValue()
  })
  return {
    controller,
    field,
    attrs,
    values,
    locked,
    canSelect,
    busy,
    errors,
    recovery,
    select,
    remove,
    error,
    clearErrors,
    confirmRecovery,
    discardRecovery,
    beginRecording,
    finishRecording,
    message,
    getValueAtPath,
  }
}
