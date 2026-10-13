<script setup lang="ts">
import type { FormKitSchemaDefinition } from '@formkit/core'
import { computed, inject, provide } from 'vue'
import { normalizeQfbConditions } from '../../utils/schemaExpressions'
import { qfbViewerReadonlyKey } from '../constants/injectionKeys'

type RenderableSchema = FormKitSchemaDefinition & Record<string, any>

const props = defineProps<{
  schema: RenderableSchema
  data?: Record<string, unknown>
  readonly?: boolean
}>()
const viewerReadonly = inject(qfbViewerReadonlyKey, computed(() => false))
provide(qfbViewerReadonlyKey, computed(() => Boolean(props.readonly || viewerReadonly.value)))
const renderSchema = computed(() => {
  const schema = normalizeQfbConditions(props.schema)
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
