<script setup lang="ts">
import type { FormKitSchemaDefinition } from '@formkit/core'
import { computed, inject } from 'vue'
import { qfbViewerReadonlyKey } from '../media/injection'
import { normalizeQfbConditions } from '../schema/expressions'

type RenderableSchema = FormKitSchemaDefinition & Record<string, any>

const props = defineProps<{
  schema: RenderableSchema
  data?: Record<string, unknown>
  readonly?: boolean
}>()
const viewerReadonly = inject(qfbViewerReadonlyKey, computed(() => false))
const renderSchema = computed(() => {
  const schema = normalizeQfbConditions(props.schema)
  if (props.readonly || viewerReadonly.value) {
    schema.readonly = true
    schema.disabled = true
    schema.disable = true
    schema.attrs = { ...schema.attrs, readonly: true, disabled: true, disable: true }
  }
  if (schema.$formkit) schema.preserve = true
  return schema
})

const schemaKey = computed(() => [
  props.schema.fieldId || props.schema.name,
  props.schema.$formkit || props.schema.$el || '',
  props.schema.inputType || '',
  props.schema.mask || '',
  props.schema['fill-mask'] ? 'fill' : 'no-fill',
  props.schema['reverse-fill-mask'] ? 'reverse' : 'forward',
  props.schema['unmasked-value'] ? 'raw' : 'masked',
].join('|'))
</script>

<template>
  <FormKitSchema :key="schemaKey" :schema="renderSchema" :data="data" />
</template>
