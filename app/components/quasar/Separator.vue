<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QSeparator } from 'quasar'

// Define props that combine FormKit context and QBtnProps
defineProps<{ context: FormKitFrameworkContext & { attrs: QSeparator } }>()
</script>

<template>
  <WithLabelAndDescription :label="context.label" :info="context.attrs.info" :description="context.attrs.description">
    <q-separator :color="context.attrs.color" :size="context.attrs.size || 'md'" v-bind="context.attrs" />
  </WithLabelAndDescription>
</template>
