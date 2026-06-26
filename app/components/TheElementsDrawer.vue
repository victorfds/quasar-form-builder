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
const searchTerm = shallowRef('')
const normalizedSearchTerm = computed(() => searchTerm.value.trim().toLocaleLowerCase())
const hasSearchTerm = computed(() => Boolean(normalizedSearchTerm.value))

const catalogSearchAliases: Partial<Record<string, string[]>> = {
  separator: ['divider', 'divisor', 'divisoria', 'divisória'],
}

function getCatalogSearchText(tool: BuilderCatalogItem, includeDescription = false) {
  const schema = tool.schema as Record<string, unknown>
  return [
    tool.name,
    tool.title,
    ...(catalogSearchAliases[tool.name] || []),
    includeDescription ? tool.description : '',
    schema.$formkit,
    schema.$el,
    schema.inputType,
    schema.name,
    schema.label,
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
}

function catalogItemMatchesSearch(tool: BuilderCatalogItem, includeDescription = false) {
  if (!normalizedSearchTerm.value) return true

  const searchable = getCatalogSearchText(tool, includeDescription)
  return searchable.includes(normalizedSearchTerm.value)
}

const directlyMatchedToolsByCategory = computed<Record<BuilderCatalogCategory, BuilderCatalogItem[]>>(() => ({
  fields: toolsByCategory.value.fields.filter(catalogItemMatchesSearch),
  statics: toolsByCategory.value.statics.filter(catalogItemMatchesSearch),
  structures: toolsByCategory.value.structures.filter(catalogItemMatchesSearch),
}))

const hasDirectSearchMatches = computed(() =>
  Object.values(directlyMatchedToolsByCategory.value).some(tools => tools.length > 0),
)

const filteredToolsByCategory = computed<Record<BuilderCatalogCategory, BuilderCatalogItem[]>>(() => {
  if (!hasSearchTerm.value || hasDirectSearchMatches.value) {
    return directlyMatchedToolsByCategory.value
  }

  return {
    fields: toolsByCategory.value.fields.filter(tool => catalogItemMatchesSearch(tool, true)),
    statics: toolsByCategory.value.statics.filter(tool => catalogItemMatchesSearch(tool, true)),
    structures: toolsByCategory.value.structures.filter(tool => catalogItemMatchesSearch(tool, true)),
  }
})
const filteredTools = computed<BuilderCatalogItem[]>(() =>
  catalogTabs.flatMap(catalogTab => filteredToolsByCategory.value[catalogTab.name]),
)

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
          <q-input
            :model-value="searchTerm"
            class="elements-drawer-search q-mb-sm"
            dense
            filled
            hide-bottom-space
            placeholder="Buscar elementos"
            clearable
            color="cyan-8"
            @update:model-value="val => { searchTerm = String(val || '') }"
            @clear="searchTerm = ''"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <div v-if="hasSearchTerm" class="q-mt-lg elements-drawer-panel">
            <div
              v-for="tool in filteredTools"
              :key="`${tool.category}:${tool.name}`"
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

            <div
              v-if="!filteredTools.length"
              class="elements-drawer-empty text-caption q-pa-sm"
              :class="dark.isActive ? 'text-grey-6' : 'text-blue-grey-6'"
            >
              Nenhum elemento encontrado
            </div>
          </div>

          <q-tabs
            v-if="!hasSearchTerm"
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

          <q-tab-panels v-if="!hasSearchTerm" v-model="elementsTypes" animated>
            <q-tab-panel
              v-for="catalogTab in catalogTabs"
              :key="catalogTab.name"
              :name="catalogTab.name"
              class="no-padding q-mt-lg elements-drawer-panel"
            >
              <div
                v-for="tool in filteredToolsByCategory[catalogTab.name]"
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

              <div
                v-if="!filteredToolsByCategory[catalogTab.name].length"
                class="elements-drawer-empty text-caption q-pa-sm"
                :class="dark.isActive ? 'text-grey-6' : 'text-blue-grey-6'"
              >
                Nenhum elemento encontrado
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

.elements-drawer-search {
  max-width: 100%;
}

.elements-drawer-empty {
  line-height: 1.25rem;
}
</style>
