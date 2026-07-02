<script setup lang="ts">
import type { FormKitFrameworkContext, FormKitSchemaDefinition } from '@formkit/core'
import { useQuasar } from 'quasar'
import { computed, inject } from 'vue'
import { builderModeKey } from '#qfb/constants/injectionKeys'
import { useFormStore } from '#qfb/stores/formStore'
import { firstFilledArray } from '#qfb/utils'

const props = defineProps<{
  context: FormKitFrameworkContext & {
    children?: FormKitSchemaDefinition[]
    structureChildren?: FormKitSchemaDefinition[]
    description?: string
    attrs: {
      label?: string
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

function getContextText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

const structureLabel = computed(() => getContextText(props.context.label) || getContextText(props.context.attrs.label))
const structureDescription = computed(() => getContextText(props.context.attrs.description) || getContextText(props.context.description))
const hasStructureHeader = computed(() => Boolean(structureLabel.value || structureDescription.value))
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
    <q-card-section v-if="hasStructureHeader" class="q-pb-none">
      <div v-if="structureLabel" class="text-subtitle2">
        {{ structureLabel }}
      </div>
      <div v-if="structureDescription" class="text-caption text-grey-7">
        {{ structureDescription }}
      </div>
    </q-card-section>
    <q-card-section>
      <BuilderStructureCanvas :fields="children" :list-key="listKey" />
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
