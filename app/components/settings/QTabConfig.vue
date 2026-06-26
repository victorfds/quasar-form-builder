<script setup lang="ts">
const { dark } = useQuasar()
const formStore = useFormStore()

const activeTab = computed(() => formStore.activeTabConfig)
const tabsFieldName = computed(() => formStore.activeTabsFieldName)
const tabTitle = computed(() => activeTab.value?.label || activeTab.value?.name || '')
const activeTabName = computed(() => activeTab.value?.name || null)
const tabsCount = computed(() => {
  if (!tabsFieldName.value) return 0
  const tabsField = formStore.getFieldByName(tabsFieldName.value) as { tabs?: unknown[] } | undefined
  return tabsField?.tabs?.length || 0
})

const labelInputRef = ref<{ focus: () => void } | null>(null)
const tabLabel = computed(() => activeTab.value?.label || '')

async function focusTabLabel() {
  if (!activeTab.value) return
  await nextTick()
  labelInputRef.value?.focus()
}

let stopFocusTabLabel: (() => void) | undefined

onMounted(() => {
  stopFocusTabLabel = useEventListener(window, 'builder:focus-tab-label', focusTabLabel)
})

onBeforeUnmount(() => {
  stopFocusTabLabel?.()
})

function onClickLabel(refElement: { focus: () => void } | null) {
  refElement?.focus()
}

function updateTabLabel(value: string | number | null) {
  if (!activeTab.value || !tabsFieldName.value) return
  formStore.updateTabLabel(tabsFieldName.value, activeTab.value.name, String(value || ''))
}

function closeTabConfig() {
  formStore.setActiveTabConfig(null)
}

function removeTab() {
  if (!activeTab.value || !tabsFieldName.value) return
  formStore.removeTab(tabsFieldName.value, activeTab.value.name)
}

function duplicateTab() {
  if (!activeTab.value || !tabsFieldName.value) return
  formStore.duplicateTab(tabsFieldName.value, activeTab.value.name)
}

function updateTabCondition(prop: 'if' | 'validation' | 'disable' | 'readonly', value: any) {
  if (!activeTabName.value || !tabsFieldName.value || prop !== 'if') return
  formStore.updateTabProp(tabsFieldName.value, activeTabName.value, prop, value)
}
</script>

<template>
  <q-list separator style="max-width: 340px;">
    <q-item :class="{ 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }">
      <q-item-section avatar>
        <q-btn
          size="sm"
          flat
          dense
          round
          icon="close"
          :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
          @click="closeTabConfig"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          <h6 class="break-all text-h6 no-margin">
            {{ tabTitle }}
          </h6>
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <div class="q-gutter-xs">
          <q-btn
            size="sm"
            flat
            dense
            round
            icon="o_content_copy"
            :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
            @click="duplicateTab"
          />
          <q-btn
            size="sm"
            flat
            dense
            round
            icon="o_delete"
            :color="dark.isActive ? 'grey-5' : 'blue-grey-8'"
            :disable="tabsCount <= 1"
            @click="removeTab"
          />
        </div>
      </q-item-section>
    </q-item>

    <q-expansion-item
      :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
      :expand-icon-class="dark.isActive ? 'text-grey-5' : 'text-blue-grey-8'"
      label="Propriedades"
      default-opened
    >
      <q-card>
        <q-card-section>
          <div class="row align-center items-center justify-between">
            <label for="tab-label" @click="onClickLabel(labelInputRef)">
              <span class="text-body2">
                Cabeçalho
              </span>
            </label>
            <q-input
              id="tab-label"
              ref="labelInputRef"
              :model-value="tabLabel"
              hide-bottom-space
              filled
              class="mw-200"
              color="cyan-8"
              dense
              type="text"
              @update:model-value="updateTabLabel"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item
      :header-class="{ 'text-weight-semibold text-subtitle2': true, 'bg-grey-9 text-grey-11': dark.isActive, 'bg-blue-grey-1 text-blue-grey-10': !dark.isActive }"
      :expand-icon-class="dark.isActive ? 'text-grey-5' : 'text-blue-grey-8'"
      label="Condições"
    >
      <SettingsSlotsConditionsCard
        v-if="activeTab"
        :key="activeTab?.name"
        no-conditions-message="A aba não contém condições"
        save-to="if"
        :element="activeTab"
        :update-prop="updateTabCondition"
      />
    </q-expansion-item>
  </q-list>
</template>
