<script setup lang="ts">
import type { BuilderFieldListKey } from '#qfb/types'
import type { FormKitFrameworkContext, FormKitSchemaDefinition } from '@formkit/core'
import { builderModeKey, formBuilderDndKey, schemaDataKey } from '#qfb/constants/injectionKeys'

interface TabDefinition {
  name: string
  label?: string
  if?: string
  children?: FormKitSchemaDefinition[]
}

const props = defineProps<{
  context: FormKitFrameworkContext & {
    tabs?: TabDefinition[]
    attrs: {
      tabs?: TabDefinition[]
    }
  }
}>()

const builderMode = inject(builderModeKey, false)
const builderDnd = inject(formBuilderDndKey, null) as Record<string, any> | null
const schemaData = inject(schemaDataKey, computed(() => ({})))
const formStore = useFormStore()
const tabs = computed(() =>
  firstFilledArray<TabDefinition>(props.context.tabs, props.context.attrs.tabs).map(tab => ({
    ...tab,
    children: withStructureChildrenListForRender(tab.children || []),
  })),
)
const tabsFieldName = computed(() => props.context.node.name)
const activeTab = shallowRef('')
const isEditing = computed(() => builderMode && formStore.formSettings.previewMode === 'editing')
const selectedTabName = computed(() => formStore.activeTabsFieldName === tabsFieldName.value ? formStore.activeTabConfigName : null)
const schemaValues = computed(() => unref(schemaData) || {})
const visibleTabs = computed(() => {
  if (isEditing.value) return tabs.value
  return tabs.value.filter(tab => evaluateLogicString(tab.if, schemaValues.value))
})
const renderedTabs = computed(() => (isEditing.value ? tabs.value : visibleTabs.value))

function getTabListKey(tabName: string): BuilderFieldListKey {
  return `tab:${tabsFieldName.value}:${tabName}`
}

function setActiveTab(tabName: string) {
  if (activeTab.value === tabName) return
  activeTab.value = tabName
}

function ensureActiveTab() {
  const newTabs = renderedTabs.value
  if (!newTabs.length) {
    setActiveTab('')
    return
  }

  const configuredTab = selectedTabName.value
  if (configuredTab && newTabs.some(tab => tab.name === configuredTab)) {
    setActiveTab(configuredTab)
    return
  }

  if (!newTabs.some(tab => tab.name === activeTab.value)) {
    setActiveTab(newTabs[0].name)
  }
}

function selectTab(tabName: string) {
  setActiveTab(tabName)
  if (!isEditing.value) return
  formStore.setActiveField(null)
  formStore.setActiveTabConfig(tabsFieldName.value, tabName)
}

function isSelectedTab(tabName: string) {
  return isEditing.value && selectedTabName.value === tabName
}

function onTabDragenter(ev: DragEvent, tabName: string) {
  if (!isEditing.value) return
  ev.stopPropagation()
  setActiveTab(tabName)
  builderDnd?.handleDragover?.(ev)
  builderDnd?.onDragEnterContainer?.(getTabListKey(tabName))
}

function onTabDrop(ev: DragEvent, tabName: string) {
  if (!isEditing.value) return
  ev.preventDefault()
  ev.stopPropagation()
  builderDnd?.onDrop?.(ev, getTabListKey(tabName))
}

function addTab() {
  if (!isEditing.value) return
  formStore.addTab(tabsFieldName.value)
}

function removeTabsStructure() {
  if (!isEditing.value) return
  const tabsField = formStore.getFieldByName(tabsFieldName.value)
  if (!tabsField) return
  formStore.removeField(tabsField)
}

onMounted(() => {
  ensureActiveTab()
})

onUpdated(() => {
  ensureActiveTab()
})
</script>

<template>
  <div class="structure-tabs">
    <div v-if="isEditing" class="structure-tabs__actions">
      <q-btn
        round flat dense icon="add" size="sm" color="grey-6" aria-label="Adicionar aba"
        class="structure-tabs__action structure-tabs__action--add"
        @click.stop="addTab"
      />
      <q-btn
        round flat dense icon="close" size="sm" color="grey-6" aria-label="Remover abas"
        class="structure-tabs__action structure-tabs__action--remove"
        @click.stop="removeTabsStructure"
      />
    </div>
    <q-tabs :model-value="activeTab" dense align="left" active-color="primary" @update:model-value="tabName => setActiveTab(String(tabName))">
      <q-tab
        v-for="tab in renderedTabs"
        :key="tab.name"
        :name="tab.name"
        :label="tab.label || tab.name"
        :class="{ 'structure-tabs__tab--selected': isSelectedTab(tab.name) }"
        no-caps
        @click="selectTab(tab.name)"
        @dragenter.prevent="(ev) => onTabDragenter(ev, tab.name)"
        @dragover.prevent="(ev) => onTabDragenter(ev, tab.name)"
        @drop.prevent="(ev) => onTabDrop(ev, tab.name)"
      />
    </q-tabs>
    <q-separator />
    <q-tab-panels :model-value="activeTab" :animated="!isEditing" @update:model-value="tabName => setActiveTab(String(tabName))">
      <q-tab-panel v-for="tab in renderedTabs" :key="tab.name" :name="tab.name" class="q-px-none">
        <BuilderStructureCanvas :fields="tab.children || []" :list-key="getTabListKey(tab.name)" empty-text="Aba vazia" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<style scoped>
.structure-tabs {
  position: relative;
  width: 100%;
}

.structure-tabs__actions {
  bottom: calc(100% - 2rem);
  left: -2.5rem;
  pointer-events: none;
  position: absolute;
  right: -2.5rem;
  z-index: 3;
}

.structure-tabs__action {
  pointer-events: auto;
  position: absolute;
}

.structure-tabs__action--remove {
  left: 0;
}

.structure-tabs__action--add {
  right: 0;
}

.structure-tabs__tab--selected {
  outline: 1px solid var(--overlay-accent-color, #2980b9);
  outline-offset: -1px;
}
</style>
