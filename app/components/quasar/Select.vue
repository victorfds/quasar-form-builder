<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QSelectProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QSelectProps } }>()
const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>

<template>
  <q-select :model-value="context.value" :label="context.label" filled hide-bottom-space v-bind="context.attrs"
    :hint="context.help || context.attrs.description" emit-value map-options :error-message="getMessages" :error="hasError"
    @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages" />
</template>
