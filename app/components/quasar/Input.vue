<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: { inputType: QInputProps['type'] } } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() => hasError.value || (props.context?.state?.submitted && props.context?.state?.valid === false) || (props.context?.state?.touched && props.context?.state?.valid === false))
</script>

<template>
  <q-input :model-value="context.value" :label="context.label" filled :type="context.attrs.inputType || 'text'"
    :hint="context.attrs.description" hide-bottom-space color="cyan-8" :error-message="getMessages" :error="errorActive"
    v-bind="context.attrs" @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages" />
</template>
