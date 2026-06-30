<script setup lang="ts">
import type { FormKitFrameworkContext, FormKitSchemaDefinition } from '@formkit/core'
import { builderModeKey } from '#qfb/constants/injectionKeys'

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
const isNested = computed(() => props.context.attrs.nested ?? props.context.nested)
</script>

<template>
  <q-card
    flat
    class="structure-list"
    :class="{
      'structure-list--editing': isEditing,
      'structure-list--dark': dark.isActive,
    }"
  >
    <q-card-section>
      <div class="text-subtitle2">
        {{ context.label || (isNested ? 'Lista aninhada' : 'Lista') }}
      </div>
      <div v-if="context.attrs.description" class="text-caption text-grey-7">
        {{ context.attrs.description }}
      </div>
    </q-card-section>
    <q-separator v-if="isEditing" />
    <q-card-section>
      <BuilderStructureCanvas :fields="children" :list-key="listKey" empty-text="Item repetível vazio" />
    </q-card-section>
  </q-card>
</template>

<style scoped>
.structure-list {
  background: transparent;
  border: 0 !important;
  border-radius: 6px;
  box-sizing: border-box;
  max-width: 100%;
  overflow: visible;
  width: 100%;
}

.structure-list--editing {
  background: rgba(225, 232, 238, .82);
}

.structure-list--editing.structure-list--dark {
  background: rgba(255, 255, 255, .055);
}

.structure-list :deep(.form-canvas) {
  max-width: 100%;
  overflow: visible;
}
</style>
