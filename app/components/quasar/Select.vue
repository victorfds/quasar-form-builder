<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QSelectProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QSelectProps } }>()
const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() =>
  hasError.value
  || (props.context?.state?.submitted && props.context?.state?.valid === false)
  || (props.context?.state?.touched && props.context?.state?.valid === false)
)
</script>

<template>
  <q-select v-bind="context.attrs" :model-value="context.value" :label="context.label" filled hide-bottom-space
    :hint="context.help || context.attrs.description" emit-value map-options :error-message="getMessages"
    :error="errorActive" @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages" />
</template>
