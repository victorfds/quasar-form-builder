<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QToggleProps } from 'quasar'
import { computed } from 'vue'
import { useValidationMessages } from '#qfb/composables/useValidationMessages'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QToggleProps & { description?: string } } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() => hasError.value || (props.context?.state?.submitted && props.context?.state?.valid === false) || (props.context?.state?.touched && props.context?.state?.valid === false))
const modelValue = computed(() => props.context.value === true)
const toggleAttrs = computed(() => {
  const {
    description: _description,
    toggleIndeterminate: _toggleIndeterminate,
    'true-value': _trueValue,
    'false-value': _falseValue,
    trueValue: _trueValueCamel,
    falseValue: _falseValueCamel,
    ...attrs
  } = props.context.attrs as QToggleProps & Record<string, unknown>

  return attrs
})
</script>

<template>
  <q-field
    borderless
    :model-value="modelValue"
    :hint="context.attrs.description"
    :error-message="getMessages"
    :error="errorActive"
    hide-bottom-space
  >
    <template #control>
      <q-toggle
        :model-value="modelValue"
        :label="context.label"
        color="primary"
        v-bind="toggleAttrs"
        @update:model-value="(val) => context?.node.input(Boolean(val))"
        @blur="checkForErrorMessages"
      />
    </template>
  </q-field>
</template>
