<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QSliderProps } from 'quasar'
import { computed } from 'vue'
import { useValidationMessages } from '#qfb/composables/useValidationMessages'

type SliderContext = FormKitFrameworkContext & {
  min?: number | string
  max?: number | string
  step?: number | string
  vertical?: boolean
  attrs: QSliderProps & { description?: string }
}

const props = defineProps<{ context: SliderContext }>()

const { hasError, getMessages, checkForErrorMessages } = useValidationMessages(props.context?.node)
const errorActive = computed(() => hasError.value || (props.context?.state?.submitted && props.context?.state?.valid === false) || (props.context?.state?.touched && props.context?.state?.valid === false))
const sliderAttrs = computed<QSliderProps & { description?: string }>(() => ({
  ...props.context.attrs,
  min: Number(props.context.min ?? props.context.attrs.min ?? 0),
  max: Number(props.context.max ?? props.context.attrs.max ?? 100),
  step: Number(props.context.step ?? props.context.attrs.step ?? 1),
  vertical: Boolean(props.context.vertical ?? props.context.attrs.vertical),
}))
const modelValue = computed(() => {
  const min = Number(sliderAttrs.value.min ?? 0)
  const max = Number(sliderAttrs.value.max ?? 100)
  const value = Number(props.context.value ?? min)
  return Math.max(min, Math.min(max, value))
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
      <div class="slider-field full-width" :class="{ 'slider-field--vertical': sliderAttrs.vertical }">
        <q-slider
          :model-value="modelValue"
          label
          label-always
          color="primary"
          v-bind="sliderAttrs"
          @update:model-value="(val) => context?.node.input(val)"
          @change="checkForErrorMessages"
        />
      </div>
    </template>
  </q-field>
</template>

<style scoped>
.slider-field {
  padding: 1.25rem 0 0.5rem;
}

.slider-field--vertical {
  align-items: center;
  display: flex;
  min-height: 240px;
  padding: 1rem 0;
}
</style>
