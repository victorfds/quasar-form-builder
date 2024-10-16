<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { QBtnProps } from 'quasar'

// Define props that combine FormKit context and QBtnProps
defineProps<{ context: FormKitFrameworkContext & { attrs: QBtnProps } }>()
</script>

<template>
  <q-btn :class="{ 'full-width': context.attrs.full }" :label="context.label" :icon="context.attrs.icon"
    :color="context.attrs.color || 'primary'" :loading="context.attrs.loading || false"
    :disable="context.attrs.disable || false" :size="context.attrs.size || 'md'" v-bind="context.attrs"
    @click="(event) => context?.node.input(event)" />
</template>
