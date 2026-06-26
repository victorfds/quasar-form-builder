<script setup lang="ts">
import type { FormKitSchemaDefinition } from '@formkit/core'
import type { BuilderCatalogCategory, BuilderCatalogItem } from '~/types'
import { getBuilderCatalogByCategory } from '~/constants/fieldCatalog'

const model = defineModel<boolean>()
const { dark } = useQuasar()

const catalogTabs: { name: BuilderCatalogCategory, label: string }[] = [
  { name: 'fields', label: 'Campos' },
  { name: 'statics', label: 'Estáticos' },
  { name: 'structures', label: 'Estruturas' },
]

const toolsByCategory = computed<Record<BuilderCatalogCategory, BuilderCatalogItem[]>>(() => ({
  fields: getBuilderCatalogByCategory('fields'),
  statics: getBuilderCatalogByCategory('statics'),
  structures: getBuilderCatalogByCategory('structures'),
}))

const tab = ref('elements')
const elementsTypes = ref<BuilderCatalogCategory>('fields')

function cloneSchema(schema: FormKitSchemaDefinition): FormKitSchemaDefinition {
  return JSON.parse(JSON.stringify(schema))
}

function onDragStart(ev: DragEvent, tool: FormKitSchemaDefinition) {
  ev.dataTransfer?.setData('text', JSON.stringify(cloneSchema(tool)))
}
</script>

<template>
  <q-drawer v-model="model" class="no-scroll" show-if-above persistent side="left" data-drawer="left">
    <q-tabs
      v-model="tab"
      narrow-indicator
      :class="dark.isActive ? 'bg-transparent' : 'bg-blue-grey-1'"
      align="justify"
      indicator-color="transparent"
      :active-bg-color="dark.isActive ? 'grey-9' : 'white'"
    >
      <q-tab name="elements" label="Elementos" no-caps />
      <q-tab name="tree" label="Árvore" no-caps />
    </q-tabs>
    <q-scroll-area class="fit elements-drawer-scroll" visible>
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="elements">
          <q-tabs
            v-model="elementsTypes"
            narrow-indicator
            dense
            :class="dark.isActive ? 'bg-transparent' : 'bg-blue-grey-1'"
            align="justify"
            indicator-color="transparent"
            :active-bg-color="dark.isActive ? 'grey-9' : 'white'"
          >
            <q-tab
              v-for="catalogTab in catalogTabs"
              :key="catalogTab.name"
              :name="catalogTab.name"
              :label="catalogTab.label"
              no-caps
            />
          </q-tabs>

          <q-tab-panels v-model="elementsTypes" animated>
            <q-tab-panel
              v-for="catalogTab in catalogTabs"
              :key="catalogTab.name"
              :name="catalogTab.name"
              class="no-padding q-mt-lg elements-drawer-panel"
            >
              <div
                v-for="tool in toolsByCategory[catalogTab.name]"
                :key="tool.name"
                class="tool-item"
                draggable="true"
                @dragstart="(event) => onDragStart(event, tool.schema)"
              >
                <div class="row items-start no-wrap q-mb-lg">
                  <q-avatar
                    rounded
                    size="md"
                    font-size="1.3rem"
                    :color="dark.isActive ? 'grey-9' : 'blue-grey-2'"
                    :text-color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
                    :icon="tool.icon"
                  />
                  <div class="q-ml-sm">
                    <div
                      class="tool-title text-weight-semibold text-subtitle2"
                      :class="dark.isActive ? 'text-grey-11' : 'text-blue-grey-10'"
                    >
                      {{ tool.title }}
                    </div>
                    <div
                      class="tool-description text-caption"
                      :class="dark.isActive ? 'text-grey-7 ' : 'text-blue-grey-7'"
                    >
                      {{ tool.description }}
                    </div>
                  </div>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-tab-panel>
      </q-tab-panels>
    </q-scroll-area>
  </q-drawer>
</template>

<style lang="scss">
.tool-item {
  cursor: grab;
}

.tool-title {
  line-height: 1rem;
}

.tool-description {
  line-height: 1rem;
}

.tool-item:active {
  cursor: grabbing;
  opacity: 0.4;
}

.elements-drawer-panel {
  padding-bottom: 4rem !important;
}
</style>
