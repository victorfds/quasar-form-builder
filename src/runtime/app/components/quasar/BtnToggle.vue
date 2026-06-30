<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QBtnToggleProps } from 'quasar'

type BtnToggleContext = FormKitFrameworkContext & {
  attrs: QBtnToggleProps & { description?: string }
  options?: QBtnToggleProps['options']
  multiple?: boolean
}

const props = defineProps<{ context: BtnToggleContext }>()
const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() =>
  hasError.value
  || (props.context?.state?.submitted && props.context?.state?.valid === false)
  || (props.context?.state?.touched && props.context?.state?.valid === false),
)
const toggleAttrs = computed<QBtnToggleProps>(() => ({
  ...(() => {
    const {
      columns: _columns,
      description: _description,
      ...attrs
    } = props.context.attrs as QBtnToggleProps & { columns?: unknown, description?: string }
    return attrs
  })(),
  options: props.context.attrs.options || props.context.options || [],
  multiple: props.context.attrs.multiple ?? props.context.multiple,
}))
const modelValue = computed(() => {
  if (toggleAttrs.value.multiple) return Array.isArray(props.context.value) ? props.context.value : []
  return props.context.value ?? null
})
</script>

<template>
  <q-field
    borderless
    :model-value="modelValue"
    :label="context.label"
    :hint="context.attrs.description"
    :error-message="getMessages"
    :error="errorActive"
    stack-label
    hide-bottom-space
  >
    <template #control>
      <q-btn-toggle
        :model-value="modelValue"
        unelevated
        v-bind="toggleAttrs"
        toggle-color="primary"
        emit-value
        @update:model-value="(val) => context?.node.input(val)"
        @blur="checkForErrorMessages"
      />
    </template>
  </q-field>
</template>
