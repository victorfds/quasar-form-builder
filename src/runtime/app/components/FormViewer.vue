<script setup lang="ts">
import type { FormKitNode, FormKitSchemaDefinition } from '@formkit/core'
import type {
  ColumnsType,
  FormViewerFieldChangePayload,
  FormViewerReadyPayload,
  FormViewerSubmitInvalidPayload,
  FormViewerValues,
  FormViewerValuesUpdatePayload,
} from '#qfb/types'
import { computed, nextTick, onMounted, provide, toRaw } from 'vue'
import { useFieldLayout } from '#qfb/composables/useFieldLayout'
import { builderModeKey, schemaDataKey } from '#qfb/constants/injectionKeys'
import { withStructureChildrenListForRender } from '#qfb/utils'
import { createFormSchemaData } from '#qfb/utils/formData'

type ViewerField = FormKitSchemaDefinition & {
  name?: string
  columns?: ColumnsType & Record<string, any>
  align?: 'left' | 'center' | 'right'
  $el?: string
  label?: string
  info?: string
  description?: string
}

const props = defineProps<{ formFields: FormKitSchemaDefinition[], readonly?: boolean }>()
const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'updateModelValues', payload: FormViewerValuesUpdatePayload): void
  (e: 'fieldChange', payload: FormViewerFieldChangePayload): void
  (e: 'viewerReady', payload: FormViewerReadyPayload): void
  (e: 'submitInvalid', payload: FormViewerSubmitInvalidPayload): void
}>()
const values = defineModel<any>({ default: () => ({}) })
const data = computed(() => createFormSchemaData(props.formFields, values.value))

provide(builderModeKey, false)
provide(schemaDataKey, data)

function onSubmit(data: any, _node: FormKitNode) {
  if (props.readonly) return
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
    return Object.fromEntries(
      Object.entries(rawValue).map(([key, item]) => [key, cloneFormValue(item)]),
    ) as T
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
  if (props.readonly) return
  const previousValues = cloneFormValue(values.value)
  const nextValues = cloneFormValue(newValues)
  const changedFields = getChangedFields(previousValues, nextValues)
  const timestamp = Date.now()

  values.value = newValues

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
    if (n.type !== 'input') return
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

const renderFields = computed(() => withStructureChildrenListForRender((props.formFields || []) as unknown as ViewerField[]))
const { getGridColumnStyle, getAlignClass } = useFieldLayout()

onMounted(async () => {
  await nextTick()
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
      :model-value="values" type="form" :actions="false"
      validation-visibility="submit" @submit="onSubmit" @submit-invalid="onSubmitInvalid"
      @update:model-value="updateModelValues"
    >
      <FormCanvas>
        <div
          v-for="field in renderFields"
          :key="field.name"
          class="form-field form-field--responsive"
          :class="getAlignClass(field)"
          :style="getGridColumnStyle(field)"
        >
          <WithLabelAndDescription
            v-if="field.$el" :label="field.label" :info="field.info"
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
.formkit-outer[data-invalid="true"] .q-field__control {
  outline: 1px solid #e53935;
  outline-offset: -1px;
}

/* Show asterisk only when invalid is visible (blurred or after submit) */
.formkit-outer[data-invalid="true"] .q-field__label::after {
  content: ' *';
  color: #e53935;
}
</style>
