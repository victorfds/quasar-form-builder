<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QEditorProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QEditorProps } }>()
const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>

<template>
  <q-editor :model-value="context.value || 'Digite seu texto aqui'" :label="context.label" flat
    :type="context.inputType" :hint="context.help" v-bind="context.attrs" :error-message="getMessages" :error="hasError"
    @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages" />
</template>
