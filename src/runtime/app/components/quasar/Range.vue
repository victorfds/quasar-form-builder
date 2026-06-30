<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QRangeProps } from 'quasar'

interface RangeValue {
  min: number
  max: number
}

const props = defineProps<{ context: FormKitFrameworkContext & { attrs: QRangeProps & { description?: string } } }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() => hasError.value || (props.context?.state?.submitted && props.context?.state?.valid === false) || (props.context?.state?.touched && props.context?.state?.valid === false))
const rangeAttrs = computed<QRangeProps & { description?: string }>(() => ({
  ...props.context.attrs,
  min: Number((props.context as any).min ?? props.context.attrs.min ?? 0),
  max: Number((props.context as any).max ?? props.context.attrs.max ?? 100),
  step: Number((props.context as any).step ?? props.context.attrs.step ?? 1),
}))
const modelValue = computed<RangeValue>(() => {
  const value = props.context.value as RangeValue | undefined
  const min = Number(rangeAttrs.value.min ?? 0)
  const max = Number(rangeAttrs.value.max ?? 100)
  return {
    min: Math.max(min, Math.min(max, Number(value?.min ?? min))),
    max: Math.max(min, Math.min(max, Number(value?.max ?? max))),
  }
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
      <div class="range-field full-width">
        <q-range
          :model-value="modelValue"
          label
          label-always
          color="primary"
          v-bind="rangeAttrs"
          @update:model-value="(val) => context?.node.input(val)"
          @change="checkForErrorMessages"
        />
      </div>
    </template>
  </q-field>
</template>

<style scoped>
.range-field {
  padding: 1.25rem 0 0.5rem;
}
</style>
