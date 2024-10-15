<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QCheckboxProps } from 'quasar'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QCheckboxProps } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>

<template>
  <q-checkbox :model-value="context.value" :label="context.label" v-bind="context.attrs" :error-message="getMessages"
    :error="hasError" @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages" />
</template>
