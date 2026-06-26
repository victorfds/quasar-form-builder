<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'
import { builderModeKey } from '~/constants/injectionKeys'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: { inputType: QInputProps['type'] } } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() => hasError.value || (props.context?.state?.submitted && props.context?.state?.valid === false) || (props.context?.state?.touched && props.context?.state?.valid === false))
const builderMode = inject(builderModeKey, false)
const formStore = useFormStore()
const isEditing = computed(() => builderMode && formStore.formSettings.previewMode === 'editing')
const inputType = computed(() => props.context.attrs.inputType || 'text')
const renderedType = computed(() => inputType.value === 'hidden' && isEditing.value ? 'text' : inputType.value)
</script>

<template>
  <q-input
    v-bind="context.attrs" :model-value="context.value" :label="context.label" filled :type="renderedType"
    :hint="context.attrs.description" hide-bottom-space color="cyan-8" :error-message="getMessages" :error="errorActive"
    @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages"
  />
</template>
