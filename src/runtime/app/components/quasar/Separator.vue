<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QSeparatorProps } from 'quasar'

type SeparatorAttrs = QSeparatorProps & {
  columns?: unknown
  description?: string
}

const props = defineProps<{
  context: FormKitFrameworkContext & {
    vertical?: boolean
    inset?: boolean
    spaced?: boolean | string
    color?: string
    size?: string
    attrs: SeparatorAttrs
  }
}>()

const separatorAttrs = computed(() => {
  const {
    columns: _columns,
    description: _description,
    ...attrs
  } = props.context.attrs

  return {
    ...attrs,
    color: props.context.color ?? props.context.attrs.color,
    inset: props.context.inset ?? props.context.attrs.inset,
    size: props.context.size ?? props.context.attrs.size,
    spaced: props.context.spaced ?? props.context.attrs.spaced,
    vertical: Boolean(props.context.vertical ?? props.context.attrs.vertical),
  }
})
</script>

<template>
  <div class="separator-field" :class="{ 'separator-field--vertical': separatorAttrs.vertical }">
    <q-separator v-bind="separatorAttrs" />
  </div>
</template>

<style scoped>
.separator-field {
  box-sizing: border-box;
  max-width: 100%;
  width: 100%;
}

.separator-field--vertical {
  display: flex;
  justify-content: center;
  min-height: 5rem;
}
</style>
