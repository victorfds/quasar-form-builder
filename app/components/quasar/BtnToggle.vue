<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QBtnToggleProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QBtnToggleProps } }>()
const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() =>
  hasError.value
  || (props.context?.state?.submitted && props.context?.state?.valid === false)
  || (props.context?.state?.touched && props.context?.state?.valid === false)
)
</script>

<template>
  <q-btn-toggle
    :model-value="context.value" :label="context.label" unelevated v-bind="context.attrs"
    toggle-color="primary" emit-value :error-message="getMessages" :error="errorActive"
    @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages"
  />
</template>
