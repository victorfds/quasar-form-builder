<script setup lang="ts">
import type { FormKitFrameworkContext, FormKitSchemaDefinition } from '@formkit/core'

const props = defineProps<{
  context: FormKitFrameworkContext & {
    children?: FormKitSchemaDefinition[]
    structureChildren?: FormKitSchemaDefinition[]
    attrs: {
      structureChildren?: FormKitSchemaDefinition[]
      children?: FormKitSchemaDefinition[]
      description?: string
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
</script>

<template>
  <q-card flat bordered class="structure-container">
    <q-card-section v-if="context.label || context.attrs.description" class="q-pb-none">
      <div v-if="context.label" class="text-subtitle2">
        {{ context.label }}
      </div>
      <div v-if="context.attrs.description" class="text-caption text-grey-7">
        {{ context.attrs.description }}
      </div>
    </q-card-section>
    <q-card-section>
      <BuilderStructureCanvas :fields="children" :list-key="listKey" empty-text="Container vazio" />
    </q-card-section>
  </q-card>
</template>

<style scoped>
.structure-container {
  border: 1px solid var(--line-color, #d7dde2) !important;
  border-radius: 6px;
  width: 100%;
}
</style>
