<script setup lang="ts">
import type { FormKitSchemaDefinition } from '@formkit/core'
import type { BuilderCatalogCategory, BuilderCatalogItem, BuilderEventMap, BuilderFieldListKey, StructureCell } from '#qfb/types'
import { getBuilderCatalogByCategory } from '#qfb/constants/fieldCatalog'
import { clearBuilderDragActive, markBuilderDragType } from '#qfb/utils/builderDrag'

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

interface CatalogPointerDragState {
  tool: BuilderCatalogItem
  dataTransfer: DataTransfer
  pointerId: number
  startX: number
  startY: number
  dragging: boolean
  currentTarget: Element | null
  ghost: HTMLElement | null
  sourceElement: HTMLElement | null
}

const catalogDragThreshold = 6
const catalogDroppableSelector = [
  '.preview-element-area-top',
  '.preview-element-area-bottom',
  '.preview-element-area-left',
  '.preview-element-area-right',
  '.overlay-preview-element',
  '.overlay-drop-here',
  '.form-canvas',
  '.structure-tabs__tab',
  '.q-stepper__tab',
  '.stepper-header-overlay-wrapper',
  '.steps-root-drop-guide',
  '[data-structure-list-key]',
  '.structure-grid__cell',
  '.structure-table__cell',
].join(',')
let catalogPointerDrag: CatalogPointerDragState | null = null

function setCatalogDragData(dataTransfer: DataTransfer, schema: FormKitSchemaDefinition) {
  const clonedSchema = cloneSchema(schema)
  const schemaData = JSON.stringify(clonedSchema)

  dataTransfer.effectAllowed = 'copy'
  dataTransfer.dropEffect = 'copy'
  dataTransfer.setData('text', schemaData)
  dataTransfer.setData('text/plain', schemaData)
  markBuilderDragType(dataTransfer, clonedSchema as Record<string, unknown>)
}

function createCatalogDragEvent(type: string, state: CatalogPointerDragState, ev?: PointerEvent) {
  return new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    dataTransfer: state.dataTransfer,
    clientX: ev?.clientX,
    clientY: ev?.clientY,
    screenX: ev?.screenX,
    screenY: ev?.screenY,
    ctrlKey: ev?.ctrlKey,
    shiftKey: ev?.shiftKey,
    altKey: ev?.altKey,
    metaKey: ev?.metaKey,
  })
}

function getCatalogPointerTarget(ev: PointerEvent) {
  if (typeof document === 'undefined') return null
  const stackedElements = document.elementsFromPoint(ev.clientX, ev.clientY)
  for (const element of stackedElements) {
    if (element.matches(catalogDroppableSelector)) return element
    const droppableElement = element.closest(catalogDroppableSelector)
    if (droppableElement) return droppableElement
  }
  const geometricTarget = Array.from(document.querySelectorAll(catalogDroppableSelector)).find((element) => {
    const rect = element.getBoundingClientRect()
    return ev.clientX >= rect.left
      && ev.clientX <= rect.right
      && ev.clientY >= rect.top
      && ev.clientY <= rect.bottom
  })
  if (geometricTarget) return geometricTarget
  return stackedElements[0] || null
}

function createCatalogDragGhost(tool: BuilderCatalogItem, sourceElement: HTMLElement | null) {
  const ghost = document.createElement('div')
  ghost.className = `tool-item-drag-ghost ${dark.isActive ? 'tool-item-drag-ghost--dark' : 'tool-item-drag-ghost--light'}`
  ghost.setAttribute('aria-hidden', 'true')

  const clonedContent = sourceElement?.querySelector('.tool-item__content')?.cloneNode(true)
  if (clonedContent instanceof HTMLElement) {
    clonedContent.classList.remove('q-mb-lg')
    clonedContent.classList.add('tool-item-drag-ghost__content')
    ghost.appendChild(clonedContent)
  }
  else {
    const avatar = document.createElement('div')
    avatar.className = 'tool-item-drag-ghost__fallback-avatar'
    avatar.textContent = tool.icon

    const textWrapper = document.createElement('div')
    textWrapper.className = 'tool-item-drag-ghost__fallback-text'

    const title = document.createElement('div')
    title.className = 'tool-title text-weight-semibold text-subtitle2'
    title.textContent = tool.title

    const description = document.createElement('div')
    description.className = 'tool-description text-caption'
    description.textContent = tool.description

    textWrapper.append(title, description)
    ghost.append(avatar, textWrapper)
  }

  document.body.appendChild(ghost)
  return ghost
}

function updateCatalogDragGhost(state: CatalogPointerDragState, ev: PointerEvent) {
  if (!state.ghost) return
  state.ghost.style.transform = `translate3d(${ev.clientX + 12}px, ${ev.clientY + 12}px, 0)`
}

function startCatalogPointerDrag(state: CatalogPointerDragState, ev: PointerEvent) {
  state.dragging = true
  state.sourceElement?.classList.add('tool-item--dragging')
  setCatalogDragData(state.dataTransfer, state.tool.schema)
  state.ghost = createCatalogDragGhost(state.tool, state.sourceElement)
  updateCatalogDragGhost(state, ev)
  state.sourceElement?.dispatchEvent(createCatalogDragEvent('dragstart', state, ev))
}

function dispatchCatalogDragMove(state: CatalogPointerDragState, ev: PointerEvent) {
  const target = getCatalogPointerTarget(ev)

  if (state.currentTarget && state.currentTarget !== target) {
    state.currentTarget.dispatchEvent(createCatalogDragEvent('dragleave', state, ev))
  }

  if (!target) {
    state.currentTarget = null
    return
  }

  if (state.currentTarget !== target) {
    target.dispatchEvent(createCatalogDragEvent('dragenter', state, ev))
    state.currentTarget = target
  }

  target.dispatchEvent(createCatalogDragEvent('dragover', state, ev))
}

function removeCatalogPointerListeners() {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointermove', onCatalogPointerMove)
  window.removeEventListener('pointerup', onCatalogPointerUp)
  window.removeEventListener('pointercancel', onCatalogPointerCancel)
  window.removeEventListener('blur', onCatalogPointerCancel)
  window.removeEventListener('keydown', onCatalogPointerKeydown)
}

function finishCatalogPointerDrag() {
  const state = catalogPointerDrag
  if (!state) return

  removeCatalogPointerListeners()
  state.sourceElement?.classList.remove('tool-item--dragging')
  if (state.sourceElement?.hasPointerCapture?.(state.pointerId)) {
    state.sourceElement.releasePointerCapture(state.pointerId)
  }
  state.ghost?.remove()
  if (state.dragging) {
    state.sourceElement?.dispatchEvent(createCatalogDragEvent('dragend', state))
  }
  clearBuilderDragActive()
  catalogPointerDrag = null
}

function onCatalogPointerMove(ev: PointerEvent) {
  const state = catalogPointerDrag
  if (!state || ev.pointerId !== state.pointerId) return

  const distanceX = ev.clientX - state.startX
  const distanceY = ev.clientY - state.startY
  const distance = Math.hypot(distanceX, distanceY)

  if (!state.dragging) {
    if (distance < catalogDragThreshold) return
    startCatalogPointerDrag(state, ev)
  }

  ev.preventDefault()
  updateCatalogDragGhost(state, ev)
  dispatchCatalogDragMove(state, ev)
}

function onCatalogPointerUp(ev: PointerEvent) {
  const state = catalogPointerDrag
  if (!state || ev.pointerId !== state.pointerId) return

  if (state.dragging) {
    ev.preventDefault()
    const target = getCatalogPointerTarget(ev)
    if (target) {
      target.dispatchEvent(createCatalogDragEvent('dragenter', state, ev))
      target.dispatchEvent(createCatalogDragEvent('dragover', state, ev))
      target.dispatchEvent(createCatalogDragEvent('drop', state, ev))
    }
  }

  finishCatalogPointerDrag()
}

function onCatalogPointerCancel() {
  finishCatalogPointerDrag()
}

function onCatalogPointerKeydown(ev: KeyboardEvent) {
  if (ev.key !== 'Escape') return
  ev.preventDefault()
  finishCatalogPointerDrag()
}

function addCatalogPointerListeners() {
  window.addEventListener('pointermove', onCatalogPointerMove, { passive: false })
  window.addEventListener('pointerup', onCatalogPointerUp)
  window.addEventListener('pointercancel', onCatalogPointerCancel)
  window.addEventListener('blur', onCatalogPointerCancel)
  window.addEventListener('keydown', onCatalogPointerKeydown)
}

function onCatalogPointerDown(ev: PointerEvent, tool: BuilderCatalogItem) {
  if (typeof window === 'undefined' || typeof DataTransfer === 'undefined') return
  if (!ev.isPrimary || ev.button !== 0) return

  finishCatalogPointerDrag()

  const sourceElement = ev.currentTarget instanceof HTMLElement ? ev.currentTarget : null
  catalogPointerDrag = {
    tool,
    dataTransfer: new DataTransfer(),
    pointerId: ev.pointerId,
    startX: ev.clientX,
    startY: ev.clientY,
    dragging: false,
    currentTarget: null,
    ghost: null,
    sourceElement,
  }

  sourceElement?.setPointerCapture?.(ev.pointerId)
  addCatalogPointerListeners()
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

const drawerSlotProps = computed(() => ({
  formStore,
  tab: tab.value,
  elementsTypes: elementsTypes.value,
  searchTerm: searchTerm.value,
  treeSearchTerm: treeSearchTerm.value,
  filteredTools: filteredTools.value,
  filteredToolsByCategory: filteredToolsByCategory.value,
}))

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

function getSelectionNode(detail: BuilderEventMap['builder:selection-change']['detail']) {
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

function syncTreeSelection(detail: BuilderEventMap['builder:selection-change']['detail']) {
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

function onBuilderSelectionChange(event: BuilderEventMap['builder:selection-change']) {
  syncTreeSelection(event.detail || {})
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

function isSelectedTreeNode(key?: string) {
  return Boolean(key && selectedTreeNode.value === key)
}

function getTreeIconColor(key?: string) {
  if (isSelectedTreeNode(key)) return 'primary'
  return dark.isActive ? 'grey-9' : 'blue-grey-2'
}

function getTreeIconTextColor(key?: string) {
  if (isSelectedTreeNode(key)) return 'white'
  return dark.isActive ? 'grey-5' : 'blue-grey-8'
}

function getTreeLabelClass(key?: string) {
  if (isSelectedTreeNode(key)) return 'text-primary'
  return dark.isActive ? 'text-grey-11' : 'text-blue-grey-10'
}

function getTreeCaptionClass(key?: string) {
  if (isSelectedTreeNode(key)) return 'text-primary'
  return dark.isActive ? 'text-grey-6' : 'text-blue-grey-6'
}

function selectTreeNode(key: string | null) {
  if (!key) return

  selectedTreeNode.value = key

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
  finishCatalogPointerDrag()
  window.removeEventListener('builder:selection-change', onBuilderSelectionChange)
})
</script>

<template>
  <q-drawer v-model="model" class="no-scroll" show-if-above persistent side="left" data-drawer="left">
    <slot name="before" v-bind="drawerSlotProps" />
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
    <div class="fit elements-drawer-scroll">
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
            color="primary"
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
              :data-catalog-category="tool.category"
              :data-catalog-name="tool.name"
              draggable="false"
              @pointerdown="(event) => onCatalogPointerDown(event, tool)"
            >
              <div class="tool-item__content row items-start no-wrap q-mb-lg">
                <q-avatar
                  rounded
                  size="md"
                  :color="dark.isActive ? 'grey-9' : 'blue-grey-2'"
                  :text-color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
                  :icon="tool.icon"
                />
                <div class="tool-item__text q-ml-sm">
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
              <slot name="empty" v-bind="drawerSlotProps">
                Nenhum elemento encontrado
              </slot>
            </div>
          </div>

          <q-tabs
            v-if="!hasSearchTerm"
            v-model="elementsTypes"
            class="elements-drawer-type-tabs"
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
                :data-catalog-category="tool.category"
                :data-catalog-name="tool.name"
                draggable="false"
                @pointerdown="(event) => onCatalogPointerDown(event, tool)"
              >
                <div class="tool-item__content row items-start no-wrap q-mb-lg">
                  <q-avatar
                    rounded
                    size="md"
                    :color="dark.isActive ? 'grey-9' : 'blue-grey-2'"
                    :text-color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
                    :icon="tool.icon"
                  />
                  <div class="tool-item__text q-ml-sm">
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
                <slot name="empty" v-bind="drawerSlotProps">
                  Nenhum elemento encontrado
                </slot>
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
            color="primary"
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
            no-selection-unset
            selected-color="primary"
            @update:selected="selectTreeNode"
          >
            <template #default-header="prop">
              <div class="tree-node row items-center no-wrap">
                <q-avatar
                  rounded
                  size="xs"
                  :icon="prop.node.icon || 'widgets'"
                  :color="getTreeIconColor(prop.node.key)"
                  :text-color="getTreeIconTextColor(prop.node.key)"
                  class="tree-node__icon q-mr-sm"
                />
                <div class="tree-node__content">
                  <div
                    class="tree-node__label text-caption"
                    :class="getTreeLabelClass(prop.node.key)"
                  >
                    {{ prop.node.label }}
                  </div>
                  <div
                    v-if="prop.node.caption"
                    class="tree-node__caption text-caption"
                    :class="getTreeCaptionClass(prop.node.key)"
                  >
                    {{ prop.node.caption }}
                  </div>
                </div>
              </div>
            </template>
          </q-tree>
        </q-tab-panel>
      </q-tab-panels>
    </div>
    <slot name="after" v-bind="drawerSlotProps" />
  </q-drawer>
</template>

<style lang="scss">
.tool-item {
  box-sizing: border-box;
  cursor: grab;
  max-width: 100%;
  min-width: 0;
  width: 100%;
  user-select: none;
}

.tool-item__content {
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;
  pointer-events: none;
  width: 100%;
}

.tool-item__content .q-avatar {
  flex: 0 0 auto;
}

.tool-item__text {
  flex: 1 1 0;
  max-width: calc(100% - 2.5rem);
  min-width: 0;
  overflow-wrap: anywhere;
}

.tool-title {
  line-height: 1rem;
  max-width: 100%;
  overflow-wrap: anywhere;
  white-space: normal;
}

.tool-description {
  line-height: 1rem;
  max-width: 100%;
  overflow-wrap: anywhere;
  white-space: normal;
}

.tool-item:active {
  cursor: grabbing;
  opacity: 0.4;
}

.tool-item--dragging {
  cursor: grabbing;
  opacity: 0.4;
}

.tool-item-drag-ghost {
  align-items: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: .25rem;
  display: flex;
  font-size: .875rem;
  left: 0;
  line-height: 1rem;
  max-width: 280px;
  min-width: 220px;
  overflow: hidden;
  padding: .625rem .75rem;
  pointer-events: none;
  position: fixed;
  top: 0;
  z-index: 10000;
}

.tool-item-drag-ghost--light {
  background: transparent;
  border-color: rgba(38, 50, 56, .1);
}

.tool-item-drag-ghost--dark {
  background: transparent;
  border-color: rgba(255, 255, 255, .1);
}

.tool-item-drag-ghost__content {
  margin-bottom: 0 !important;
  max-width: 100%;
  min-width: 0;
  width: 100%;
}

.tool-item-drag-ghost__fallback-avatar {
  align-items: center;
  background: rgba(120, 144, 156, .24);
  border-radius: .25rem;
  display: flex;
  flex: 0 0 2rem;
  height: 2rem;
  justify-content: center;
  margin-right: .5rem;
  overflow: hidden;
  width: 2rem;
}

.tool-item-drag-ghost__fallback-text {
  min-width: 0;
}

.elements-drawer-panel {
  max-width: 100%;
  min-width: 0;
  padding-bottom: 4rem !important;
}

.elements-drawer-scroll {
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
}

.elements-drawer-search {
  max-width: 100%;
}

[data-drawer="left"],
[data-drawer="left"] .q-drawer__content,
.elements-drawer-scroll .q-tab-panels,
.elements-drawer-scroll .q-panel,
.elements-drawer-scroll .q-tab-panel {
  max-width: 100%;
  overflow-x: hidden;
}

.elements-drawer-type-tabs {
  max-width: 100%;
  min-width: 0;
}

.elements-drawer-type-tabs .q-tab {
  min-width: 0;
  padding-left: .5rem;
  padding-right: .5rem;
}

.elements-drawer-type-tabs .q-tab__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.elements-drawer-empty {
  line-height: 1.25rem;
}

.tree-drawer-panel {
  padding-bottom: 4rem !important;
}

.tree-node {
  min-width: 0;
}

.tree-node__icon {
  flex: 0 0 auto;
}

.tree-node__label,
.tree-node__caption {
  line-height: 1rem;
}

.tree-node__content {
  min-width: 0;
}

.tree-drawer-panel {
  --tree-selection-color-rgba: var(--overlay-accent-color-rgba, rgba(41, 128, 185, .2));
}

.tree-drawer-panel .q-tree__node-header {
  border-radius: .25rem;
}

.tree-drawer-panel .q-tree__node-header.q-tree__node--selected,
.tree-drawer-panel .q-tree__node--selected > .q-tree__node-header {
  background: var(--tree-selection-color-rgba);
}
</style>
