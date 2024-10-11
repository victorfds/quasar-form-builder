<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'
import type { ColumnsType } from '~/types'

const props = defineProps<{ context: FormKitFrameworkContext & { inputType: Pick<QInputProps, 'type'>['type'], columns?: ColumnsType } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
</script>

<template>
  <q-input :model-value="context.value" :label="context.label" filled :type="context.inputType || 'text'"
    :hint="context.help" hide-bottom-space v-bind="context.attrs" :error-message="getMessages" :error="hasError"
    @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages"
    :class="context.columns ? `span-${context.columns.container}` : `span-12`" />
</template>
