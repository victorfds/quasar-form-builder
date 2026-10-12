<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QBtnToggleProps } from 'quasar'
import { computed } from 'vue'
import { useValidationMessages } from '#qfb/composables/useValidationMessages'
import { withoutModelValue } from '#qfb/utils/quasarFieldDesign'

type BtnToggleContext = FormKitFrameworkContext & {
  attrs: QBtnToggleProps & { description?: string, multiple?: boolean }
  options?: QBtnToggleProps['options']
  multiple?: boolean
}

const props = defineProps<{ context: BtnToggleContext }>()
const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() =>
  hasError.value
  || (props.context?.state?.submitted && props.context?.state?.valid === false)
  || (props.context?.state?.touched && props.context?.state?.valid === false),
)
const multiple = computed(() => Boolean(props.context.attrs.multiple ?? props.context.multiple))
const toggleAttrs = computed<Omit<QBtnToggleProps, 'modelValue'>>(() => ({
  ...(() => {
    const {
      columns: _columns,
      description: _description,
      ...attrs
    } = props.context.attrs as QBtnToggleProps & { columns?: unknown, description?: string }
    return withoutModelValue(attrs)
  })(),
  options: props.context.attrs.options || props.context.options || [],
}))
const modelValue = computed(() => {
  if (multiple.value) return Array.isArray(props.context._value) ? props.context._value : []
  return props.context.value ?? null
})

function selected(value: unknown): boolean {
  return Array.isArray(modelValue.value) && modelValue.value.includes(value)
}
function toggle(value: unknown) {
  if (toggleAttrs.value.disable || props.context.disabled) return
  const current: unknown[] = Array.isArray(modelValue.value) ? modelValue.value : []
  void props.context.node.input(selected(value) ? current.filter(item => item !== value) : [...current, value])
}
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
      <q-btn-toggle
        v-if="!multiple"
        :model-value="modelValue"
        unelevated
        v-bind="toggleAttrs"
        toggle-color="primary"
        emit-value
        @update:model-value="(val) => context?.node.input(val)"
        @blur="checkForErrorMessages"
      />
      <q-btn-group v-else unelevated>
        <q-btn
          v-for="(option, index) in toggleAttrs.options"
          :key="index"
          :label="option.label"
          :icon="option.icon"
          :color="selected(option.value) ? 'primary' : toggleAttrs.color"
          :text-color="selected(option.value) ? 'white' : toggleAttrs.textColor"
          :disable="toggleAttrs.disable || option.disable || Boolean(context.disabled)"
          :dense="toggleAttrs.dense"
          :no-caps="toggleAttrs.noCaps"
          :aria-pressed="selected(option.value)"
          @click="toggle(option.value)"
          @blur="checkForErrorMessages"
        />
      </q-btn-group>
    </template>
  </q-field>
</template>
