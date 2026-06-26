<script setup lang="ts">
import type { FormKitFrameworkContext, FormKitSchemaDefinition } from '@formkit/core'

const props = defineProps<{
  context: FormKitFrameworkContext & {
    children?: FormKitSchemaDefinition[]
    structureChildren?: FormKitSchemaDefinition[]
    nested?: boolean
    attrs: {
      structureChildren?: FormKitSchemaDefinition[]
      children?: FormKitSchemaDefinition[]
      description?: string
      nested?: boolean
    }
  }
}>()

const children = computed(() => firstFilledArray<FormKitSchemaDefinition>(
  props.context.structureChildren,
  props.context.attrs.structureChildren,
  props.context.children,
  props.context.attrs.children,
))
const listKey = computed(() => `children:${props.context.node.name}` as const)
const isNested = computed(() => props.context.attrs.nested ?? props.context.nested)
</script>

<template>
  <q-card flat bordered class="structure-list">
    <q-card-section>
      <div class="text-subtitle2">
        {{ context.label || (isNested ? 'Lista aninhada' : 'Lista') }}
      </div>
      <div v-if="context.attrs.description" class="text-caption text-grey-7">
        {{ context.attrs.description }}
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <BuilderStructureCanvas :fields="children" :list-key="listKey" empty-text="Item repetível vazio" />
    </q-card-section>
  </q-card>
</template>

<style scoped>
.structure-list {
  border: 1px solid var(--line-color, #d7dde2) !important;
  border-radius: 6px;
  width: 100%;
}
</style>
