<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { ColumnsType, FormViewerFieldChangePayload, FormViewerReadyPayload, FormViewerSubmitInvalidPayload, FormViewerValues, FormViewerValuesUpdatePayload, QfbFormFieldError, QfbSchemaField } from '../../types'
import type { QfbMediaChange, QfbMediaController, QfbMediaErrorDescription, QfbMediaFieldContext } from '../../types/media'
import { computed, nextTick, onBeforeUnmount, onMounted, provide, shallowRef, toRaw, watch } from 'vue'
import { useFieldLayout } from '#qfb/composables/useFieldLayout'
import { builderModeKey, schemaDataKey } from '#qfb/constants/injectionKeys'
import { withStructureChildrenListForRender } from '#qfb/utils'
import { createFormSchemaData, extractFormData } from '../../utils/formData'
import { describeMediaError } from '../../utils/mediaErrors'
import { getValueAtPath } from '../../utils/mediaValues'
import { walkQfbSchema } from '../../utils/schemaIdentity'
import { qfbMediaControllerKey, qfbMediaErrorKey, qfbViewerReadonlyKey } from '../constants/injectionKeys'
import { applyQfbExternalErrors } from '../utils/fieldErrors'

type ViewerField = QfbSchemaField & {
  fieldId?: string
  name?: string
  columns?: ColumnsType & Record<string, any>
  align?: 'left' | 'center' | 'right'
  $el?: string
  label?: string
  info?: string
  description?: string
}

const props = defineProps<{
  formFields: QfbSchemaField[]
  readonly?: boolean
  mediaController?: QfbMediaController
  formErrors?: string[]
  fieldErrors?: QfbFormFieldError[]
}>()
const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'updateModelValues', payload: FormViewerValuesUpdatePayload): void
  (e: 'fieldChange', payload: FormViewerFieldChangePayload): void
  (e: 'viewerReady', payload: FormViewerReadyPayload): void
  (e: 'submitInvalid', payload: FormViewerSubmitInvalidPayload): void
  (e: 'mediaChange', payload: QfbMediaChange): void
  (e: 'mediaError', payload: QfbMediaErrorDescription): void
}>()
const values = defineModel<any>({ default: () => ({}) })
const formNode = shallowRef<FormKitNode>()
let mounted = false
async function flush(): Promise<FormViewerValues> {
  await nextTick()
  const node = formNode.value
  if (node) await node.settled
  const current = cloneFormValue(node?.value ?? values.value)
  if (!props.readonly && !props.mediaController?.readonly.value) updateModelValues(current)
  return current
}
defineExpose({
  flush,
  submit: () => {
    if (!props.readonly && !props.mediaController?.readonly.value) formNode.value?.submit()
  },
})
const data = computed(() => createFormSchemaData(props.formFields, values.value))
// FormKit adds group/default values in place; never let those mutate the caller's SSR model.
const inputValues = computed(() => cloneFormValue(values.value))

provide(builderModeKey, false)
provide(schemaDataKey, data)
provide(qfbMediaErrorKey, error => emit('mediaError', error))
provide(
  qfbMediaControllerKey,
  computed(() => props.mediaController),
)
provide(
  qfbViewerReadonlyKey,
  computed(() => Boolean(props.readonly || props.mediaController?.readonly.value)),
)

watch(
  () => props.mediaController,
  (controller, _previous, cleanup) => {
    if (!controller) return
    cleanup(
      controller.associateViewer(
        () => Boolean(props.readonly),
        event => emit('mediaChange', event),
        error => emit('mediaError', error),
      ),
    )
  },
  { immediate: true, flush: 'sync' },
)

const nodeContexts = shallowRef<QfbMediaFieldContext[]>([])
const definitions = computed(() => {
  const fields = new Map<string, Record<string, any>>()
  walkQfbSchema(props.formFields, (field) => {
    if (field.fieldId) fields.set(String(field.fieldId).toLowerCase(), field)
  })
  return fields
})
const mediaContexts = computed(() => {
  const contexts = new Map<string, QfbMediaFieldContext>()
  for (const answer of extractFormData(props.formFields, values.value).answers) {
    if (!['q-file', 'q-audio-recorder'].includes(answer.type || '') || !answer.fieldId) continue
    const context = { fieldId: answer.fieldId, fieldPath: answer.fieldPath }
    contexts.set(JSON.stringify([context.fieldId.toLowerCase(), context.fieldPath]), context)
  }
  for (const context of nodeContexts.value) contexts.set(JSON.stringify([context.fieldId.toLowerCase(), context.fieldPath]), context)
  return [...contexts.values()]
})
const registrations = new Map<string, () => void>()
let registeredController: QfbMediaController | undefined
function clearRegistrations() {
  for (const unregister of registrations.values()) unregister()
  registrations.clear()
}
watch([() => props.mediaController, () => JSON.stringify(mediaContexts.value), () => JSON.stringify(props.formFields)], ([controller]) => {
  if (controller !== registeredController) {
    clearRegistrations()
    registeredController = controller
  }
  if (!controller) return
  const keys = new Set<string>()
  for (const field of mediaContexts.value) {
    const key = JSON.stringify([field.fieldId.toLowerCase(), field.fieldPath])
    keys.add(key)
    if (registrations.has(key)) continue
    registrations.set(key, controller.registerField(field, () => {
      const definition = definitions.value.get(field.fieldId.toLowerCase()) || {}
      return { ...definition.props, ...definition.attrs, ...definition }
    }, () => getValueAtPath(values.value, field.fieldPath)))
  }
  for (const [key, unregister] of registrations) {
    if (!keys.has(key)) {
      unregister()
      registrations.delete(key)
    }
  }
}, { immediate: true, flush: 'post' })
watch(formNode, (node, _previous, cleanup) => {
  if (!node) return
  const reconcile = () => {
    const contexts: QfbMediaFieldContext[] = []
    node.walk((child) => {
      const fieldId = child.props.fieldId || child.context?.fieldId || child.props.attrs?.fieldId
      if (fieldId && ['q-file', 'q-audio-recorder'].includes(String(child.props.type)))
        contexts.push({ fieldId: String(fieldId), fieldPath: child.address.slice(node.address.length).map(String) })
    })
    nodeContexts.value = contexts
    applyQfbExternalErrors(node, props.formErrors, props.fieldErrors)
  }
  const receipts = ['child.deep', 'childRemoved.deep', 'commit'].map(event => node.on(event, reconcile))
  reconcile()
  cleanup(() => receipts.forEach(receipt => node.off(receipt)))
}, { flush: 'sync' })
watch(() => [props.formErrors, props.fieldErrors], () => {
  if (formNode.value) applyQfbExternalErrors(formNode.value, props.formErrors, props.fieldErrors)
}, { deep: true })
onBeforeUnmount(clearRegistrations)

async function onSubmit(data: any, node: FormKitNode) {
  if (props.readonly || props.mediaController?.readonly.value) return
  if (props.mediaController) {
    try {
      await props.mediaController.prepare(data)
    }
    catch (error) {
      emit('mediaError', describeMediaError(error))
      onSubmitInvalid(node)
      return
    }
  }
  emit('submit', data)
  // The node has a builtin function that can be used called node.submit()
}

function isRecord(value: unknown): value is FormViewerValues {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isPlainRecord(value: unknown): value is FormViewerValues {
  if (!isRecord(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function cloneFormValue<T>(value: T): T {
  const rawValue = toRaw(value) as T

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(rawValue)
    }
    catch {
      // Fall back for values that cannot be cloned by the platform, such as some file-like objects.
    }
  }

  if (Array.isArray(rawValue)) {
    return rawValue.map(item => cloneFormValue(item)) as T
  }

  if (isPlainRecord(rawValue)) {
    return Object.fromEntries(Object.entries(rawValue).map(([key, item]) => [key, cloneFormValue(item)])) as T
  }

  return rawValue
}

function getChangedFields(previousValues: unknown, newValues: unknown) {
  const previousRecord = isRecord(previousValues) ? previousValues : {}
  const newRecord = isRecord(newValues) ? newValues : {}
  const keys = new Set([...Object.keys(previousRecord), ...Object.keys(newRecord)])

  return [...keys].filter(key => !Object.is(previousRecord[key], newRecord[key]))
}

function updateModelValues(newValues: any) {
  if (!mounted || props.readonly || props.mediaController?.readonly.value) return
  const previousValues = cloneFormValue(values.value)
  const nextValues = cloneFormValue(newValues)
  const changedFields = getChangedFields(previousValues, nextValues)
  const timestamp = Date.now()

  values.value = cloneFormValue(newValues)

  emit('updateModelValues', {
    values: nextValues,
    previousValues,
    changedFields,
    timestamp,
  })

  for (const name of changedFields) {
    emit('fieldChange', {
      name,
      value: isRecord(nextValues) ? nextValues[name] : undefined,
      previousValue: isRecord(previousValues) ? previousValues[name] : undefined,
      values: nextValues,
      timestamp,
    })
  }
}

function onSubmitInvalid(node: FormKitNode) {
  // Mark all inputs as touched so FormKit shows validation messages
  node.walk((n) => {
    // Only mark real input nodes (skip the form node itself)
    if (n.type !== 'input' || n.context?.state.valid !== false) return
    n.store.set({
      visible: true,
      type: 'error',
      key: 'required',
      blocking: true,
      meta: {
        touched: true,
      },
    })
  })

  emit('submitInvalid', {
    values: cloneFormValue(values.value),
    node,
    timestamp: Date.now(),
  })
}

const renderFields = computed(() =>
  withStructureChildrenListForRender((props.formFields || []) as unknown as ViewerField[]),
)
const { getGridColumnStyle, getAlignClass } = useFieldLayout()

onMounted(async () => {
  await nextTick()
  mounted = true
  if (formNode.value) updateModelValues(formNode.value.value)
  emit('viewerReady', {
    values: cloneFormValue(values.value),
    fieldsCount: renderFields.value.length,
    timestamp: Date.now(),
  })
})
</script>

<template>
  <article>
    <FormKit
      :model-value="inputValues"
      type="form"
      :disabled="props.readonly || props.mediaController?.readonly.value"
      :actions="false"
      preserve
      validation-visibility="submit"
      @node="
        (node) => {
          formNode = node
        }
      "
      @submit="onSubmit"
      @submit-invalid="onSubmitInvalid"
      @update:model-value="updateModelValues"
    >
      <FormCanvas>
        <div
          v-for="field in renderFields"
          :key="String(field.fieldId || field.name)"
          class="form-field form-field--responsive"
          :class="getAlignClass(field)"
          :style="getGridColumnStyle(field)"
        >
          <WithLabelAndDescription
            v-if="field.$el"
            :label="field.label"
            :info="field.info"
            :description="field.description"
          >
            <FormKitSchemaRenderer :schema="field" :data="data" />
          </WithLabelAndDescription>

          <FormKitSchemaRenderer v-else :schema="field" :data="data" :readonly="props.readonly" />
        </div>
      </FormCanvas>
    </FormKit>
  </article>
</template>

<style lang="scss">
/* When inputs are invalid (after being touched or submit), make the control more evident */
.formkit-outer[data-invalid='true'] .q-field__control {
  outline: 1px solid #e53935;
  outline-offset: -1px;
}

/* Show asterisk only when invalid is visible (blurred or after submit) */
.formkit-outer[data-invalid='true'] .q-field__label::after {
  content: ' *';
  color: #e53935;
}
</style>
