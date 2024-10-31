<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: { inputType: QInputProps['type'] } } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>

<template>
  <q-input :model-value="context.value" :label="context.label" filled :type="context.attrs.inputType || 'text'"
    :hint="context.help" hide-bottom-space :error-message="getMessages" :error="hasError"
    @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages" v-bind="context.attrs" />
</template>
