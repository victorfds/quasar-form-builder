<script setup lang="ts">
import type { FormKitSchemaDefinition } from '@formkit/core'
import type { BuilderCatalogCategory, BuilderCatalogItem, BuilderFieldListKey, StructureCell } from '~/types'
import { getBuilderCatalogByCategory } from '~/constants/fieldCatalog'

const model = defineModel<boolean>()
const { dark } = useQuasar()
const formStore = useFormStore()

interface TreeBuildContext {
  listKey: BuilderFieldListKey
  stepName?: string
  tabsFieldName?: string
  tabName?: string
}

interface BuilderTreeNode {
  key: string
  label: string
  caption?: string
  icon?: string
  selectable?: boolean
  fieldName?: string
  stepName?: string
  tabsFieldName?: string
  tabName?: string
  children?: BuilderTreeNode[]
}

interface BuilderSelectionChangeDetail {
  fieldName?: string | null
  stepName?: string | null
  tabsFieldName?: string | null
  tabName?: string | null
}

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
const treeSearchTerm = shallowRef('')
const selectedTreeNode = shallowRef('')
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

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function getFieldNodeName(field: FormKitSchemaDefinition) {
  return getStringValue(field.name)
    || getStringValue(field.label)
    || getStringValue(field.children)
    || 'elemento'
}

function getFieldCaption(field: FormKitSchemaDefinition, fieldName: string) {
  const label = getStringValue(field.label)
  const children = getStringValue(field.children)
  const description = getStringValue(field.description)
  const help = getStringValue(field.help)
  const placeholder = getStringValue(field.placeholder)

  return [label !== fieldName ? label : '', description, help, placeholder, children]
    .find(Boolean)
    || ''
}

function getFieldIcon(field: FormKitSchemaDefinition) {
  if (field.$formkit === 'q-stepper') return 'o_dynamic_form'
  if (field.$formkit === 'q-tabs') return 'o_tab'
  if (['q-grid', 'q-table-structure'].includes(String(field.$formkit))) return 'o_grid_view'
  if (field.$formkit === 'q-container') return 'o_crop_square'
  if (field.$formkit === 'q-list-structure') return 'o_view_list'
  if (field.$formkit === 'q-input') return field.inputType === 'hidden' ? 'visibility_off' : 'text_fields'
  if (field.$formkit === 'q-select') return 'arrow_drop_down_circle'
  if (field.$el === 'hr') return 'remove'
  return 'widgets'
}

function buildFieldNodes(fields: FormKitSchemaDefinition[] = [], context: TreeBuildContext): BuilderTreeNode[] {
  return fields.map(field => buildFieldNode(field, context))
}

function buildStepperNodes(field: FormKitSchemaDefinition, _context: TreeBuildContext): BuilderTreeNode[] {
  const fieldName = getFieldNodeName(field)
  if (!Array.isArray(field.steps)) return []

  return field.steps.map((step: any) => ({
    key: `step:${fieldName}:${step.name}`,
    label: String(step.label || step.name),
    caption: 'Passo',
    icon: 'o_timeline',
    stepName: step.name,
    children: buildFieldNodes(step.children || [], {
      listKey: `step:${step.name}`,
      stepName: step.name,
    }),
  }))
}

function buildTabNodes(field: FormKitSchemaDefinition, context: TreeBuildContext): BuilderTreeNode[] {
  const fieldName = getFieldNodeName(field)
  if (!Array.isArray(field.tabs)) return []

  return field.tabs.map((tabItem: any) => ({
    key: `tab:${fieldName}:${tabItem.name}`,
    label: String(tabItem.label || tabItem.name),
    caption: 'Aba',
    icon: 'o_tab',
    stepName: context.stepName,
    tabsFieldName: fieldName,
    tabName: tabItem.name,
    children: buildFieldNodes(tabItem.children || [], {
      ...context,
      listKey: `tab:${fieldName}:${tabItem.name}`,
      tabsFieldName: fieldName,
      tabName: tabItem.name,
    }),
  }))
}

function buildRootFieldNodes(fields: FormKitSchemaDefinition[] = []) {
  return fields.flatMap((field) => {
    if (field.$formkit === 'q-stepper') return buildStepperNodes(field, { listKey: 'root' })
    if (field.$formkit === 'q-tabs') return buildTabNodes(field, { listKey: 'root' })
    return [buildFieldNode(field, { listKey: 'root' })]
  })
}

function buildFieldNode(field: FormKitSchemaDefinition, context: TreeBuildContext): BuilderTreeNode {
  const fieldName = getFieldNodeName(field)
  const children: BuilderTreeNode[] = []

  if (field.$formkit === 'q-stepper') children.push(...buildStepperNodes(field, context))
  if (field.$formkit === 'q-tabs') children.push(...buildTabNodes(field, context))

  if (Array.isArray(field.children) && field.children.length) {
    children.push(...buildFieldNodes(field.children, {
      ...context,
      listKey: `children:${fieldName}`,
    }))
  }

  if (Array.isArray(field.cells)) {
    ;(field.cells as StructureCell[]).forEach((cell) => {
      children.push({
        key: `cell:${fieldName}:${cell.name}`,
        label: String(cell.label || cell.name),
        caption: 'Célula',
        icon: 'o_select_all',
        selectable: false,
        children: buildFieldNodes(cell.children || [], {
          ...context,
          listKey: `cell:${fieldName}:${cell.name}`,
        }),
      })
    })
  }

  return {
    key: `field:${fieldName}`,
    label: fieldName,
    caption: getFieldCaption(field, fieldName),
    icon: getFieldIcon(field),
    fieldName,
    stepName: context.stepName,
    tabsFieldName: context.tabsFieldName,
    tabName: context.tabName,
    children,
  }
}

const treeNodes = computed<BuilderTreeNode[]>(() => {
  return [{
    key: 'form:root',
    label: String(formStore.formSettings.formName || 'Meu Formulário'),
    icon: 'o_article',
    selectable: false,
    children: buildRootFieldNodes(formStore.formFields),
  }]
})

function findTreeNode(nodes: BuilderTreeNode[], key: string): BuilderTreeNode | null {
  for (const node of nodes) {
    if (node.key === key) return node
    const child = node.children?.length ? findTreeNode(node.children, key) : null
    if (child) return child
  }

  return null
}

function findTreeNodeByPredicate(nodes: BuilderTreeNode[], predicate: (node: BuilderTreeNode) => boolean): BuilderTreeNode | null {
  for (const node of nodes) {
    if (predicate(node)) return node
    const child = node.children?.length ? findTreeNodeByPredicate(node.children, predicate) : null
    if (child) return child
  }

  return null
}

function getSelectionNode(detail: BuilderSelectionChangeDetail) {
  if (detail.fieldName) {
    return findTreeNodeByPredicate(treeNodes.value, node => node.fieldName === detail.fieldName)
  }

  if (detail.tabsFieldName && detail.tabName) {
    return findTreeNodeByPredicate(
      treeNodes.value,
      node => node.tabsFieldName === detail.tabsFieldName && node.tabName === detail.tabName && !node.fieldName,
    )
  }

  if (detail.stepName) {
    return findTreeNodeByPredicate(treeNodes.value, node => node.stepName === detail.stepName && !node.fieldName && !node.tabName)
  }

  return null
}

function syncTreeSelection(detail: BuilderSelectionChangeDetail) {
  const node = getSelectionNode(detail)
  selectedTreeNode.value = node?.key || ''
}

function syncTreeSelectionFromStore() {
  syncTreeSelection({
    fieldName: formStore.activeField?.name || null,
    stepName: formStore.activeStepConfigName,
    tabsFieldName: formStore.activeTabsFieldName,
    tabName: formStore.activeTabConfigName,
  })
}

function onBuilderSelectionChange(event: Event) {
  syncTreeSelection((event as CustomEvent<BuilderSelectionChangeDetail>).detail || {})
}

function setDrawerTab(nextTab: string | number) {
  tab.value = String(nextTab)
  if (tab.value === 'tree') syncTreeSelectionFromStore()
}

function filterTreeNode(node: BuilderTreeNode, filter: string) {
  const term = filter.trim().toLocaleLowerCase()
  if (!term) return true
  return [node.label, node.caption, node.fieldName, node.stepName, node.tabName]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
    .includes(term)
}

function selectTreeNode(key: string | null) {
  selectedTreeNode.value = key || ''
  if (!key) return

  const node = findTreeNode(treeNodes.value, key)
  if (!node || node.selectable === false) return

  if (node.fieldName) {
    if (node.stepName) formStore.setActiveStep(node.stepName)
    if (node.tabsFieldName && node.tabName) formStore.setActiveTab(node.tabsFieldName, node.tabName)

    const field = formStore.getFieldByName(node.fieldName)
    if (field) formStore.setActiveField(field as any)
    return
  }

  if (node.stepName) {
    formStore.setActiveField(null)
    formStore.setActiveStep(node.stepName)
    formStore.setActiveStepConfig(node.stepName)
    return
  }

  if (node.tabsFieldName && node.tabName) {
    if (node.stepName) formStore.setActiveStep(node.stepName)
    formStore.setActiveTabConfig(node.tabsFieldName, node.tabName)
  }
}

onMounted(() => {
  window.addEventListener('builder:selection-change', onBuilderSelectionChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('builder:selection-change', onBuilderSelectionChange)
})
</script>

<template>
  <q-drawer v-model="model" class="no-scroll" show-if-above persistent side="left" data-drawer="left">
    <q-tabs
      :model-value="tab"
      narrow-indicator
      :class="dark.isActive ? 'bg-transparent' : 'bg-blue-grey-1'"
      align="justify"
      indicator-color="transparent"
      :active-bg-color="dark.isActive ? 'grey-9' : 'white'"
      @update:model-value="setDrawerTab"
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

        <q-tab-panel name="tree" class="tree-drawer-panel">
          <q-input
            :model-value="treeSearchTerm"
            class="elements-drawer-search q-mb-sm"
            dense
            filled
            hide-bottom-space
            placeholder="Procurar na árvore"
            clearable
            color="cyan-8"
            @update:model-value="val => { treeSearchTerm = String(val || '') }"
            @clear="treeSearchTerm = ''"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-tree
            :nodes="treeNodes"
            :selected="selectedTreeNode"
            :filter="treeSearchTerm"
            :filter-method="filterTreeNode"
            node-key="key"
            dense
            default-expand-all
            no-transition
            @update:selected="selectTreeNode"
          >
            <template #default-header="prop">
              <div class="tree-node row items-center no-wrap">
                <q-icon :name="prop.node.icon || 'widgets'" size="18px" class="q-mr-sm" />
                <div class="tree-node__content">
                  <div class="tree-node__label text-caption text-weight-semibold">
                    {{ prop.node.label }}
                  </div>
                  <div
                    v-if="prop.node.caption"
                    class="tree-node__caption text-caption"
                    :class="dark.isActive ? 'text-grey-6' : 'text-blue-grey-6'"
                  >
                    {{ prop.node.caption }}
                  </div>
                </div>
              </div>
            </template>
          </q-tree>
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

.tree-drawer-panel {
  padding-bottom: 4rem !important;
}

.tree-node__label,
.tree-node__caption {
  line-height: 1rem;
}

.tree-node__content {
  min-width: 0;
}

.tree-drawer-panel {
  --tree-selection-color: var(--overlay-accent-color, var(--q-primary));
  --tree-selection-color-rgba: var(--overlay-accent-color-rgba, rgba(41, 128, 185, .2));
}

.tree-drawer-panel .q-tree__node--selected,
.tree-drawer-panel .q-tree__node--selected > .q-tree__node-header {
  background: var(--tree-selection-color-rgba);
  color: var(--tree-selection-color);
}

.tree-drawer-panel .q-tree__node--selected .q-icon,
.tree-drawer-panel .q-tree__node--selected .tree-node__label,
.tree-drawer-panel .q-tree__node--selected .tree-node__caption,
.tree-drawer-panel .q-tree__node--selected > .q-tree__node-header .q-icon,
.tree-drawer-panel .q-tree__node--selected > .q-tree__node-header .tree-node__label,
.tree-drawer-panel .q-tree__node--selected > .q-tree__node-header .tree-node__caption {
  color: inherit !important;
}

.tree-drawer-panel .q-tree__node--selected .tree-node__caption,
.tree-drawer-panel .q-tree__node--selected > .q-tree__node-header .tree-node__caption {
  opacity: .72;
}
</style>
