<script setup lang="ts">
interface NamedSection {
  name: string
  label?: string
  children?: unknown[]
}

const { dark } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

const elementStates = reactive<{
  columnsCount: number
  rowsCount: number
  nested: boolean
  tabs: NamedSection[]
}>({
  columnsCount: Number(formStore.activeField?.columnsCount || 2),
  rowsCount: Number(formStore.activeField?.rowsCount || 1),
  nested: Boolean(formStore.activeField?.nested),
  tabs: formStore.activeField?.tabs?.length ? toRaw(formStore.activeField.tabs) : [{ name: 'tab_1', label: 'Aba 1', children: [] }],
})

watch(() => formStore.activeField, (field) => {
  elementStates.columnsCount = Number(field?.columnsCount || 2)
  elementStates.rowsCount = Number(field?.rowsCount || 1)
  elementStates.nested = Boolean(field?.nested)
  elementStates.tabs = field?.tabs?.length ? toRaw(field.tabs) : [{ name: 'tab_1', label: 'Aba 1', children: [] }]
}, { deep: true })

function saveTabs() {
  onEnteredProp('tabs', elementStates.tabs.filter(tab => tab.name))
}

function addTab() {
  const nextIndex = elementStates.tabs.length + 1
  elementStates.tabs.push({ name: `tab_${nextIndex}`, label: `Aba ${nextIndex}`, children: [] })
  saveTabs()
}

function removeTab(index: number) {
  if (elementStates.tabs.length <= 1) return
  elementStates.tabs.splice(index, 1)
  saveTabs()
}
</script>

<template>
  <q-card flat>
    <q-card-section v-if="formStore.activeField?.$formkit === 'q-grid'">
      <div class="row align-center items-center justify-between">
        <label><span class="text-body2">Linhas</span></label>
        <q-btn-toggle
          :model-value="elementStates.rowsCount"
          no-wrap
          unelevated
          dense
          toggle-color="primary"
          :color="dark.isActive ? 'grey-10' : 'blue-grey-1'"
          :text-color="dark.isActive ? 'white' : 'grey-10'"
          :options="[
            { label: '1', value: 1 },
            { label: '2', value: 2 },
            { label: '3', value: 3 },
            { label: '4', value: 4 },
          ]"
          @update:model-value="val => { elementStates.rowsCount = val; onEnteredProp('rowsCount', val) }"
        />
      </div>
      <div class="row align-center items-center justify-between q-mt-md">
        <label><span class="text-body2">Colunas</span></label>
        <q-btn-toggle
          :model-value="elementStates.columnsCount"
          no-wrap
          unelevated
          dense
          toggle-color="primary"
          :color="dark.isActive ? 'grey-10' : 'blue-grey-1'"
          :text-color="dark.isActive ? 'white' : 'grey-10'"
          :options="[
            { label: '1', value: 1 },
            { label: '2', value: 2 },
            { label: '3', value: 3 },
            { label: '4', value: 4 },
          ]"
          @update:model-value="val => { elementStates.columnsCount = val; onEnteredProp('columnsCount', val) }"
        />
      </div>
    </q-card-section>

    <q-card-section v-else-if="formStore.activeField?.$formkit === 'q-list-structure'">
      <div class="row align-center items-center justify-between">
        <label><span class="text-body2">Lista aninhada</span></label>
        <q-toggle
          :model-value="elementStates.nested"
          color="primary"
          @update:model-value="val => { elementStates.nested = val; onEnteredProp('nested', val) }"
        />
      </div>
    </q-card-section>

    <q-card-section v-else-if="formStore.activeField?.$formkit === 'q-tabs'">
      <div class="text-subtitle2">
        Abas
      </div>
      <div v-for="(tab, index) in elementStates.tabs" :key="index" class="row align-center items-center justify-between q-mt-sm">
        <q-btn size="xs" flat dense round icon="close" :disable="elementStates.tabs.length <= 1" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" @click="removeTab(index)" />
        <q-input v-model.trim="tab.name" placeholder="nome" hide-bottom-space filled class="mw-140" color="secondary" dense @blur="saveTabs" />
        <q-input v-model.trim="tab.label" placeholder="texto" hide-bottom-space filled class="mw-140" color="secondary" dense @blur="saveTabs" />
      </div>
      <q-btn class="q-mt-md" label="Adicionar aba" no-caps color="primary" @click="addTab" />
    </q-card-section>

    <q-card-section v-else>
      <div class="text-caption text-grey-7">
        Esta estrutura usa as configurações de propriedades, layout e condições.
      </div>
    </q-card-section>
  </q-card>
</template>
