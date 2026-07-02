<script setup lang="ts">
import type { FormKitSchemaDefinition } from '@formkit/core'

type RenderableSchema = FormKitSchemaDefinition & Record<string, any>

const props = defineProps<{
  schema: RenderableSchema
  data?: Record<string, unknown>
  readonly?: boolean
}>()

const schemaKey = computed(() => [
  props.schema.name,
  props.schema.$formkit || props.schema.$el || '',
  props.schema.inputType || '',
  props.schema.mask || '',
  props.schema['fill-mask'] ? 'fill' : 'no-fill',
  props.schema['reverse-fill-mask'] ? 'reverse' : 'forward',
  props.schema['unmasked-value'] ? 'raw' : 'masked',
].join('|'))
</script>

<template>
  <FormKitSchema :key="schemaKey" :schema="schema" :data="data" :readonly="readonly" />
</template>
