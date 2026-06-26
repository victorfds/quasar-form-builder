<script setup lang="ts">
interface MatrixOption {
  label: string
  value: string
}

const { dark } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

function cloneOptions(options: MatrixOption[] | undefined, fallback: MatrixOption[]) {
  return options?.length ? JSON.parse(JSON.stringify(options)) : JSON.parse(JSON.stringify(fallback))
}

const defaultRows = [{ label: 'Linha 1', value: 'row_1' }]
const defaultColumns = [{ label: 'Coluna 1', value: 'column_1' }]

const elementStates = reactive<{
  rows: MatrixOption[]
  columnsConfig: MatrixOption[]
}>({
  rows: cloneOptions(formStore.activeField?.rows, defaultRows),
  columnsConfig: cloneOptions(formStore.activeField?.columnsConfig, defaultColumns),
})

watch(() => formStore.activeField?.name, () => {
  elementStates.rows = cloneOptions(formStore.activeField?.rows, defaultRows)
  elementStates.columnsConfig = cloneOptions(formStore.activeField?.columnsConfig, defaultColumns)
})

function saveOptions(propName: 'rows' | 'columnsConfig') {
  const values = elementStates[propName].filter(item => item.label && item.value)
  onEnteredProp(propName, values)
}

function addOption(propName: 'rows' | 'columnsConfig') {
  const nextIndex = elementStates[propName].length + 1
  const prefix = propName === 'rows' ? 'Linha' : 'Coluna'
  const valuePrefix = propName === 'rows' ? 'row' : 'column'
  elementStates[propName].push({ label: `${prefix} ${nextIndex}`, value: `${valuePrefix}_${nextIndex}` })
  saveOptions(propName)
}

function removeOption(propName: 'rows' | 'columnsConfig', index: number) {
  elementStates[propName].splice(index, 1)
  saveOptions(propName)
}
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="text-subtitle2">
        Linhas
      </div>
      <div v-for="(row, index) in elementStates.rows" :key="index" class="row align-center items-center justify-between q-mt-sm">
        <q-btn size="xs" flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" @click="removeOption('rows', index)" />
        <q-input v-model.trim="row.value" placeholder="valor" hide-bottom-space filled class="mw-140" color="secondary" dense @blur="saveOptions('rows')" />
        <q-input v-model.trim="row.label" placeholder="texto" hide-bottom-space filled class="mw-140" color="secondary" dense @blur="saveOptions('rows')" />
      </div>
      <q-btn class="q-mt-md" label="Adicionar linha" no-caps color="primary" @click="addOption('rows')" />
    </q-card-section>
    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />
    <q-card-section>
      <div class="text-subtitle2">
        Colunas
      </div>
      <div v-for="(column, index) in elementStates.columnsConfig" :key="index" class="row align-center items-center justify-between q-mt-sm">
        <q-btn size="xs" flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" @click="removeOption('columnsConfig', index)" />
        <q-input v-model.trim="column.value" placeholder="valor" hide-bottom-space filled class="mw-140" color="secondary" dense @blur="saveOptions('columnsConfig')" />
        <q-input v-model.trim="column.label" placeholder="texto" hide-bottom-space filled class="mw-140" color="secondary" dense @blur="saveOptions('columnsConfig')" />
      </div>
      <q-btn class="q-mt-md" label="Adicionar coluna" no-caps color="primary" @click="addOption('columnsConfig')" />
    </q-card-section>
  </q-card>
</template>
