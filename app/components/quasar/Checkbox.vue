<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QCheckboxProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QCheckboxProps } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() =>
  hasError.value
  || (props.context?.state?.submitted && props.context?.state?.valid === false)
  || (props.context?.state?.touched && props.context?.state?.valid === false)
)
</script>

<template>
  <q-checkbox
    :model-value="context.value" :label="context.label" v-bind="context.attrs" :error-message="getMessages"
    :error="errorActive" @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages"
  />
</template>
