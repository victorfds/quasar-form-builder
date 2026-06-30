<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QInputProps } from 'quasar'
import { builderModeKey } from '#qfb/constants/injectionKeys'

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: { inputType: QInputProps['type'] } } }>()

const inputPropNames = [
  'clearable',
  'counter',
  'autogrow',
  'loading',
  'stackLabel',
  'debounce',
  'mask',
  'fill-mask',
  'reverse-fill-mask',
  'unmasked-value',
  'prefix',
  'suffix',
  'filled',
  'outlined',
  'standout',
  'borderless',
  'rounded',
  'square',
  'dark',
  'readonly',
  'disable',
  'disabled',
]

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() => hasError.value || (props.context?.state?.submitted && props.context?.state?.valid === false) || (props.context?.state?.touched && props.context?.state?.valid === false))
const builderMode = inject(builderModeKey, false)
const formStore = useFormStore()
const isEditing = computed(() => builderMode && formStore.formSettings.previewMode === 'editing')
const mergedAttrs = computed(() => getFormKitContextAttrs(props.context, inputPropNames))
const inputType = computed(() => props.context.attrs.inputType || 'text')
const isHiddenInput = computed(() => inputType.value === 'hidden')
const inputAttrs = computed(() => {
  const {
    columns: _columns,
    description: _description,
    inputType: _inputType,
    ...attrs
  } = mergedAttrs.value

  return getQuasarFieldDesignAttrs(attrs)
})
</script>

<template>
  <div v-if="isHiddenInput && isEditing" class="hidden-input-marker">
    <div class="hidden-input-marker__label">
      {{ context.name || context.label || 'hidden' }}
    </div>
    <div class="hidden-input-marker__value">
      (oculto)
    </div>
  </div>
  <input
    v-else-if="isHiddenInput"
    v-bind="inputAttrs"
    type="hidden"
    :name="context.name"
    :value="context.value == null ? '' : String(context.value)"
  >
  <q-input
    v-else
    v-bind="inputAttrs" :model-value="context.value" :label="context.label" :type="inputType"
    :hint="context.attrs.description" hide-bottom-space color="cyan-8" :error-message="getMessages" :error="errorActive"
    @update:model-value="(val) => context?.node.input(val)" @blur="checkForErrorMessages"
  />
</template>

<style scoped>
.hidden-input-marker {
  background: transparent;
  border: 1px solid transparent;
  color: inherit;
  min-height: 2rem;
  padding: .25rem 0;
  width: 100%;
}

.hidden-input-marker__label {
  color: inherit;
  font-size: .875rem;
  line-height: 1.25rem;
  opacity: .74;
}

.hidden-input-marker__value {
  font-style: italic;
  line-height: 1.25rem;
  opacity: .62;
}
</style>
