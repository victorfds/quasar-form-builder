<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QSelectProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QSelectProps } }>()

const selectPropNames = [
  'options',
  'clearable',
  'counter',
  'multiple',
  'useChips',
  'useInput',
  'fillInput',
  'hideSelected',
  'optionsDense',
  'optionsCover',
  'newValueMode',
  'behavior',
  'maxValues',
  'inputDebounce',
  'filled',
  'outlined',
  'standout',
  'borderless',
  'rounded',
  'square',
  'dark',
  'readonly',
  'disable',
  'disabled',
]
const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() =>
  hasError.value
  || (props.context?.state?.submitted && props.context?.state?.valid === false)
  || (props.context?.state?.touched && props.context?.state?.valid === false),
)
const mergedAttrs = computed(() => getFormKitContextAttrs(props.context, selectPropNames))
const selectAttrs = computed(() => {
  const {
    columns: _columns,
    description: _description,
    ...attrs
  } = mergedAttrs.value

  const resolvedAttrs = getQuasarFieldDesignAttrs(attrs)
  if (resolvedAttrs.newValueMode && !resolvedAttrs.useInput) {
    resolvedAttrs.useInput = true
  }
  return resolvedAttrs
})
</script>

<template>
  <q-select
    v-bind="selectAttrs" :model-value="context.value" :label="context.label" hide-bottom-space
    :hint="context.help || context.attrs.description" emit-value map-options :error-message="getMessages"
    :error="errorActive" @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages"
  />
</template>
