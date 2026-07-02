<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QOptionGroupProps } from 'quasar'
import { computed } from 'vue'
import { useValidationMessages } from '#qfb/composables/useValidationMessages'

type OptionGroupAttrs = QOptionGroupProps & {
  groupType?: 'checkbox' | 'radio' | 'toggle'
  optionStyle?: 'default' | 'blocks'
  description?: string
}

type OptionGroupContext = FormKitFrameworkContext & {
  attrs: OptionGroupAttrs
  groupType?: 'checkbox' | 'radio' | 'toggle'
  optionStyle?: 'default' | 'blocks'
  options?: QOptionGroupProps['options']
}

const props = defineProps<{ context: OptionGroupContext }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() => hasError.value || (props.context?.state?.submitted && props.context?.state?.valid === false) || (props.context?.state?.touched && props.context?.state?.valid === false))
const groupType = computed(() => props.context.attrs.groupType || props.context.groupType || 'radio')
const optionStyle = computed(() => props.context.attrs.optionStyle || props.context.optionStyle)
const options = computed(() => props.context.attrs.options || props.context.options || [])
const isMultiple = computed(() => groupType.value === 'checkbox' || groupType.value === 'toggle')
const optionGroupAttrs = computed(() => {
  const {
    columns: _columns,
    description: _description,
    groupType: _groupType,
    optionStyle: _optionStyle,
    options: _options,
    ...attrs
  } = props.context.attrs
  return attrs
})
const modelValue = computed(() => {
  if (isMultiple.value) return Array.isArray(props.context.value) ? props.context.value : []
  return props.context.value ?? null
})
</script>

<template>
  <q-field
    borderless
    :model-value="modelValue"
    :label="context.label"
    :hint="context.attrs.description"
    :error-message="getMessages"
    :error="errorActive"
    stack-label
    hide-bottom-space
  >
    <template #control>
      <q-option-group
        class="full-width"
        :class="{ 'option-group--blocks': optionStyle === 'blocks' }"
        :model-value="modelValue"
        :type="groupType"
        :options="options"
        v-bind="optionGroupAttrs"
        @update:model-value="(val) => context?.node.input(val)"
        @blur="checkForErrorMessages"
      />
    </template>
  </q-field>
</template>

<style scoped>
.option-group--blocks :deep(.q-radio),
.option-group--blocks :deep(.q-checkbox),
.option-group--blocks :deep(.q-toggle) {
  border: 1px solid var(--line-color);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  width: 100%;
}
</style>
