<script setup lang="ts">
import type { FormKitFrameworkContext, FormKitSchemaDefinition } from '@formkit/core'
import { builderModeKey } from '~/constants/injectionKeys'

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

const { dark } = useQuasar()
const formStore = useFormStore()
const builderMode = inject(builderModeKey, false)
const isEditing = computed(() => Boolean(builderMode && formStore.formSettings.previewMode === 'editing'))
const children = computed(() => firstFilledArray<FormKitSchemaDefinition>(
  props.context.structureChildren,
  props.context.attrs.structureChildren,
  props.context.children,
  props.context.attrs.children,
))
const listKey = computed(() => `children:${props.context.node.name}` as const)
</script>

<template>
  <q-card
    flat
    class="structure-container"
    :class="{
      'structure-container--editing': isEditing,
      'structure-container--dark': dark.isActive,
    }"
  >
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
  background: transparent;
  border: 0 !important;
  border-radius: 6px;
  box-sizing: border-box;
  max-width: 100%;
  overflow: visible;
  width: 100%;
}

.structure-container--editing {
  background: rgba(225, 232, 238, .82);
}

.structure-container--editing.structure-container--dark {
  background: rgba(255, 255, 255, .055);
}

.structure-container :deep(.form-canvas) {
  max-width: 100%;
  overflow: visible;
}
</style>
