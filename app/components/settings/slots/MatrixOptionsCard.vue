<script setup lang="ts">
import type { MatrixColumnConfig, MatrixColumnType, MatrixOption, MatrixRowConfig, MatrixSize, MatrixViewMode } from '~/types'
import { getEffectiveMatrixColumnType, matrixColumnTypeOptions, matrixColumnTypeUsesOptions, matrixSizeOptions, matrixViewOptions } from '~/constants/matrix'

type MatrixOptionProp = 'rows' | 'columnsConfig'

const { dark } = useQuasar()
const formStore = useFormStore()
const { onEnteredProp } = formStore

const defaultRows: MatrixRowConfig[] = [
  { label: 'Linha 1', value: 'row_1' },
  { label: 'Linha 2', value: 'row_2' },
]

const defaultColumns: MatrixColumnConfig[] = [
  { label: 'Coluna 1', value: 'column_1', type: 'default' },
  { label: 'Coluna 2', value: 'column_2', type: 'default' },
]

const defaultColumnOptions: MatrixOption[] = [
  { label: 'Opção 1', value: 'option_1' },
  { label: 'Opção 2', value: 'option_2' },
]

function cloneRows(options: MatrixRowConfig[] | undefined) {
  return options?.length ? structuredClone(toRaw(options)) : structuredClone(defaultRows)
}

function cloneColumns(options: MatrixColumnConfig[] | undefined) {
  return options?.length
    ? structuredClone(toRaw(options)).map(column => ({ ...column, type: column.type || 'default' }))
    : structuredClone(defaultColumns)
}

function cloneMatrixOptions(options: MatrixOption[] | undefined) {
  return options?.length ? structuredClone(toRaw(options)) : structuredClone(defaultColumnOptions)
}

const elementStates = reactive<{
  rows: MatrixRowConfig[]
  columnsConfig: MatrixColumnConfig[]
  defaultColumnType: MatrixColumnType
  defaultColumnOptions: MatrixOption[]
  rowsMode: 'static' | 'dynamic'
  initialRows: number | ''
  minRows: number | ''
  maxRows: number | ''
  canAddRows: boolean
  addButtonText: string
  canRemoveRows: boolean
  matrixView: MatrixViewMode
  minColumnWidth: number | ''
  maxColumnWidth: number | ''
  cellGap: number | ''
  horizontalPadding: boolean
  hideRowLabels: boolean
  allowMultilineRows: boolean
  stickyRowLabels: boolean
  hideColumnLabels: boolean
  allowMultilineColumns: boolean
  stickyColumnHeaders: boolean
  matrixSize: MatrixSize
}>({
  rows: cloneRows(formStore.activeField?.rows),
  columnsConfig: cloneColumns(formStore.activeField?.columnsConfig),
  defaultColumnType: formStore.activeField?.defaultColumnType || 'text',
  defaultColumnOptions: cloneMatrixOptions(formStore.activeField?.defaultColumnOptions),
  rowsMode: formStore.activeField?.rowsMode === 'dynamic' ? 'dynamic' : 'static',
  initialRows: formStore.activeField?.initialRows ?? 1,
  minRows: formStore.activeField?.minRows ?? '',
  maxRows: formStore.activeField?.maxRows ?? '',
  canAddRows: formStore.activeField?.canAddRows !== false,
  addButtonText: String(formStore.activeField?.addButtonText || '+ Adicionar'),
  canRemoveRows: formStore.activeField?.canRemoveRows !== false,
  matrixView: formStore.activeField?.matrixView || (formStore.activeField?.table ? 'table' : 'default'),
  minColumnWidth: formStore.activeField?.minColumnWidth ?? '',
  maxColumnWidth: formStore.activeField?.maxColumnWidth ?? '',
  cellGap: formStore.activeField?.cellGap ?? '',
  horizontalPadding: formStore.activeField?.horizontalPadding !== false,
  hideRowLabels: Boolean(formStore.activeField?.hideRowLabels),
  allowMultilineRows: formStore.activeField?.allowMultilineRows !== false,
  stickyRowLabels: Boolean(formStore.activeField?.stickyRowLabels),
  hideColumnLabels: Boolean(formStore.activeField?.hideColumnLabels),
  allowMultilineColumns: formStore.activeField?.allowMultilineColumns !== false,
  stickyColumnHeaders: Boolean(formStore.activeField?.stickyColumnHeaders),
  matrixSize: formStore.activeField?.matrixSize || 'default',
})

function getOptionPrefixes(propName: MatrixOptionProp) {
  return propName === 'rows'
    ? { label: 'Linha', value: 'row' }
    : { label: 'Coluna', value: 'column' }
}

function getNextGeneratedValue(propName: MatrixOptionProp, usedValues = new Set(elementStates[propName].map(item => item.value).filter(Boolean))) {
  const { value: valuePrefix } = getOptionPrefixes(propName)
  let nextIndex = 1
  let nextValue = `${valuePrefix}_${nextIndex}`

  while (usedValues.has(nextValue)) {
    nextIndex += 1
    nextValue = `${valuePrefix}_${nextIndex}`
  }

  return nextValue
}

function normalizeOptions(propName: 'rows'): MatrixRowConfig[]
function normalizeOptions(propName: 'columnsConfig'): MatrixColumnConfig[]
function normalizeOptions(propName: MatrixOptionProp) {
  const usedValues = new Set<string>()
  const { label: labelPrefix } = getOptionPrefixes(propName)

  return elementStates[propName]
    .map((item, index) => {
      const label = String(item.label || '').trim()
      let value = String(item.value || '').trim()

      if (!label && !value) return null

      if (!value || usedValues.has(value)) {
        value = getNextGeneratedValue(propName, usedValues)
      }

      usedValues.add(value)

      return {
        ...item,
        label: label || `${labelPrefix} ${index + 1}`,
        value,
      }
    })
    .filter(Boolean)
}

function saveOptions(propName: MatrixOptionProp) {
  if (propName === 'rows') {
    const rows = normalizeOptions('rows')
    elementStates.rows = rows
    onEnteredProp('rows', rows)
    return
  }

  const columns = normalizeOptions('columnsConfig').map(column => ({
    ...column,
    type: column.type || 'default',
    options: column.options?.filter(option => option.label || option.value),
  }))
  elementStates.columnsConfig = columns
  onEnteredProp('columnsConfig', columns)
}

function addOption(propName: MatrixOptionProp) {
  const nextIndex = elementStates[propName].length + 1
  const { label: labelPrefix } = getOptionPrefixes(propName)

  if (propName === 'rows') {
    elementStates.rows.push({ label: `${labelPrefix} ${nextIndex}`, value: getNextGeneratedValue(propName) })
  }
  else {
    elementStates.columnsConfig.push({ label: `${labelPrefix} ${nextIndex}`, value: getNextGeneratedValue(propName), type: 'default' })
  }

  saveOptions(propName)
}

function removeOption(propName: MatrixOptionProp, index: number) {
  elementStates[propName].splice(index, 1)
  saveOptions(propName)
}

function updateProp(propName: keyof typeof elementStates, value: unknown) {
  ;(elementStates as Record<string, unknown>)[propName] = value
  onEnteredProp(String(propName), value)
}

function updateDefaultColumnType(value: MatrixColumnType) {
  elementStates.defaultColumnType = value
  onEnteredProp('defaultColumnType', value)

  if (defaultColumnTypeNeedsOptions() && !elementStates.defaultColumnOptions.length) {
    elementStates.defaultColumnOptions = structuredClone(defaultColumnOptions)
    onEnteredProp('defaultColumnOptions', elementStates.defaultColumnOptions)
  }
}

function updateMatrixView(value: MatrixViewMode) {
  elementStates.matrixView = value
  onEnteredProp('matrixView', value)
  onEnteredProp('table', value === 'table')
}

function columnNeedsOptions(column: MatrixColumnConfig) {
  const columnType = column.type || 'default'
  const effectiveType = getEffectiveMatrixColumnType(columnType, elementStates.defaultColumnType)
  return columnType !== 'default' && matrixColumnTypeUsesOptions(effectiveType)
}

function defaultColumnTypeNeedsOptions() {
  return matrixColumnTypeUsesOptions(getEffectiveMatrixColumnType('default', elementStates.defaultColumnType))
}

function normalizeMatrixOptions(options: MatrixOption[]) {
  const usedValues = new Set<string>()

  return options
    .map((option, index) => {
      const label = String(option.label || '').trim()
      let value = String(option.value || '').trim()

      if (!label && !value) return null

      if (!value || usedValues.has(value)) {
        let nextIndex = index + 1
        value = `option_${nextIndex}`
        while (usedValues.has(value)) {
          nextIndex += 1
          value = `option_${nextIndex}`
        }
      }

      usedValues.add(value)

      return {
        label: label || `Opção ${index + 1}`,
        value,
      }
    })
    .filter(Boolean) as MatrixOption[]
}

function saveDefaultColumnOptions() {
  const options = normalizeMatrixOptions(elementStates.defaultColumnOptions)
  elementStates.defaultColumnOptions = options
  onEnteredProp('defaultColumnOptions', options)
}

function addDefaultColumnOption() {
  elementStates.defaultColumnOptions.push({ label: `Opção ${elementStates.defaultColumnOptions.length + 1}`, value: `option_${elementStates.defaultColumnOptions.length + 1}` })
  saveDefaultColumnOptions()
}

function removeDefaultColumnOption(optionIndex: number) {
  elementStates.defaultColumnOptions.splice(optionIndex, 1)
  saveDefaultColumnOptions()
}

function addColumnOption(column: MatrixColumnConfig) {
  column.options = column.options?.length ? column.options : []
  column.options.push({ label: `Opção ${column.options.length + 1}`, value: `option_${column.options.length + 1}` })
  saveOptions('columnsConfig')
}

function removeColumnOption(column: MatrixColumnConfig, optionIndex: number) {
  column.options?.splice(optionIndex, 1)
  saveOptions('columnsConfig')
}

function updateColumnCondition(column: MatrixColumnConfig, value: unknown) {
  column.if = String(value || '')
  saveOptions('columnsConfig')
}

function updateRowCondition(row: MatrixRowConfig, value: unknown) {
  row.if = String(value || '')
  saveOptions('rows')
}
</script>

<template>
  <q-card flat>
    <q-card-section>
      <div class="text-subtitle2 q-mb-sm">
        Colunas
      </div>

      <div class="row align-center items-center justify-between q-mb-md">
        <span class="text-body2">Tipo padrão</span>
        <q-select
          :model-value="elementStates.defaultColumnType"
          :options="matrixColumnTypeOptions"
          emit-value
          map-options
          filled
          dense
          class="matrix-default-type-select"
          @update:model-value="val => updateDefaultColumnType(val)"
        />
      </div>

      <div v-if="defaultColumnTypeNeedsOptions()" class="matrix-config-item matrix-options-editor q-mb-sm">
        <div class="text-caption text-weight-semibold q-mb-xs">
          Opções do tipo padrão
        </div>
        <div v-for="(option, optionIndex) in elementStates.defaultColumnOptions" :key="optionIndex" class="matrix-option-row q-mt-xs">
          <q-input
            :model-value="option.label"
            label="Texto"
            hide-bottom-space
            filled
            dense
            @update:model-value="val => { option.label = String(val || ''); saveDefaultColumnOptions() }"
          />
          <q-input
            :model-value="option.value"
            label="Valor"
            hide-bottom-space
            filled
            dense
            @update:model-value="val => { option.value = String(val || ''); saveDefaultColumnOptions() }"
          />
          <q-btn size="sm" flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" @click="removeDefaultColumnOption(optionIndex)" />
        </div>
        <q-btn class="q-mt-sm" label="+ Adicionar opção" no-caps color="primary" size="sm" @click="addDefaultColumnOption" />
      </div>

      <div v-for="(column, index) in elementStates.columnsConfig" :key="column.value || index" class="matrix-config-item q-mb-sm">
        <div class="matrix-column-grid">
          <q-btn size="xs" flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" @click="removeOption('columnsConfig', index)" />
          <q-input
            :model-value="column.label"
            label="Texto"
            hide-bottom-space
            filled
            dense
            @update:model-value="val => { column.label = String(val || ''); saveOptions('columnsConfig') }"
          />
          <q-input
            :model-value="column.value"
            label="Valor"
            hide-bottom-space
            filled
            dense
            @update:model-value="val => { column.value = String(val || ''); saveOptions('columnsConfig') }"
          />
          <q-select
            :model-value="column.type || 'default'"
            :options="matrixColumnTypeOptions"
            label="Tipo"
            emit-value
            map-options
            hide-bottom-space
            filled
            dense
            class="matrix-type-select"
            @update:model-value="val => { column.type = val; saveOptions('columnsConfig') }"
          />
          <q-input
            :model-value="column.width"
            label="Largura"
            hide-bottom-space
            filled
            dense
            class="matrix-width-input"
            @update:model-value="val => { column.width = String(val || ''); saveOptions('columnsConfig') }"
          />
          <SettingsSlotsConditionsCard
            :element="column"
            :update-prop="(_prop, value) => updateColumnCondition(column, value)"
            mode="icon"
            :conditions-dialog-subtitle="`${column.value || column.label} / condição da coluna`"
          />
        </div>

        <div v-if="columnNeedsOptions(column)" class="q-mt-sm matrix-options-editor">
          <div v-for="(option, optionIndex) in (column.options || [])" :key="optionIndex" class="matrix-option-row q-mt-xs">
            <q-input
              :model-value="option.label"
              label="Texto da opção"
              hide-bottom-space
              filled
              dense
              @update:model-value="val => { option.label = String(val || ''); saveOptions('columnsConfig') }"
            />
            <q-input
              :model-value="option.value"
              label="Valor da opção"
              hide-bottom-space
              filled
              dense
              @update:model-value="val => { option.value = String(val || ''); saveOptions('columnsConfig') }"
            />
            <q-btn size="sm" flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" @click="removeColumnOption(column, optionIndex)" />
          </div>
          <q-btn class="q-mt-sm" label="+ Adicionar opção" no-caps color="primary" size="sm" @click="addColumnOption(column)" />
        </div>
      </div>

      <q-btn class="q-mt-sm full-width" label="+ Adicionar coluna" no-caps color="primary" @click="addOption('columnsConfig')" />
    </q-card-section>

    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />

    <q-card-section>
      <div class="text-subtitle2 q-mb-sm">
        Linhas
      </div>

      <q-btn-toggle
        :model-value="elementStates.rowsMode"
        class="full-width q-mb-sm"
        spread
        no-caps
        unelevated
        toggle-color="primary"
        :options="[
          { label: 'Linhas estáticas', value: 'static' },
          { label: 'Linhas dinâmicas', value: 'dynamic' },
        ]"
        @update:model-value="val => updateProp('rowsMode', val)"
      />

      <template v-if="elementStates.rowsMode === 'static'">
        <div v-for="(row, index) in elementStates.rows" :key="row.value || index" class="matrix-config-item q-mb-sm">
          <div class="matrix-row-grid">
            <q-btn size="xs" flat dense round icon="close" :color="dark.isActive ? 'grey-5' : 'blue-grey-8'" @click="removeOption('rows', index)" />
            <q-input
              :model-value="row.label"
              label="Texto"
              hide-bottom-space
              filled
              dense
              @update:model-value="val => { row.label = String(val || ''); saveOptions('rows') }"
            />
            <q-input
              :model-value="row.value"
              label="Valor"
              hide-bottom-space
              filled
              dense
              @update:model-value="val => { row.value = String(val || ''); saveOptions('rows') }"
            />
            <SettingsSlotsConditionsCard
              :element="row"
              :update-prop="(_prop, value) => updateRowCondition(row, value)"
              mode="icon"
              :conditions-dialog-subtitle="`${row.value || row.label} / condição da linha`"
            />
          </div>
        </div>
        <q-btn class="q-mt-sm full-width" label="+ Adicionar linha" no-caps color="primary" @click="addOption('rows')" />
      </template>

      <template v-else>
        <div class="column q-gutter-sm">
          <div class="row align-center items-center justify-between">
            <span class="text-body2">Quantidade inicial de linhas</span>
            <q-input :model-value="elementStates.initialRows" type="number" hide-bottom-space filled dense class="mw-100" @update:model-value="val => updateProp('initialRows', val ? Number(val) : '')" />
          </div>
          <div class="row align-center items-center justify-between">
            <span class="text-body2">Mínimo de linhas</span>
            <q-input :model-value="elementStates.minRows" type="number" placeholder="nenhum" hide-bottom-space filled dense class="mw-100" @update:model-value="val => updateProp('minRows', val ? Number(val) : '')" />
          </div>
          <div class="row align-center items-center justify-between">
            <span class="text-body2">Máximo de linhas</span>
            <q-input :model-value="elementStates.maxRows" type="number" placeholder="nenhum" hide-bottom-space filled dense class="mw-100" @update:model-value="val => updateProp('maxRows', val ? Number(val) : '')" />
          </div>
          <div class="row align-center items-center justify-between">
            <span class="text-body2">Pode adicionar linhas</span>
            <q-toggle :model-value="elementStates.canAddRows" color="primary" @update:model-value="val => updateProp('canAddRows', val)" />
          </div>
          <div class="row align-center items-center justify-between">
            <span class="text-body2">Texto do botão adicionar</span>
            <q-input :model-value="elementStates.addButtonText" hide-bottom-space filled dense class="mw-140" @update:model-value="val => updateProp('addButtonText', String(val || ''))" />
          </div>
          <div class="row align-center items-center justify-between">
            <span class="text-body2">Pode remover linhas</span>
            <q-toggle :model-value="elementStates.canRemoveRows" color="primary" @update:model-value="val => updateProp('canRemoveRows', val)" />
          </div>
        </div>
      </template>
    </q-card-section>

    <q-separator :color="dark.isActive ? 'grey-9' : 'blue-grey-1'" />

    <q-card-section>
      <div class="text-subtitle2 q-mb-sm">
        Layout
      </div>

      <div class="column q-gutter-sm">
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Visualização</span>
          <q-btn-toggle
            :model-value="elementStates.matrixView"
            no-caps
            unelevated
            dense
            toggle-color="primary"
            :options="matrixViewOptions"
            @update:model-value="updateMatrixView"
          />
        </div>
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Largura mínima da coluna</span>
          <q-input :model-value="elementStates.minColumnWidth" type="number" suffix="px" placeholder="auto" hide-bottom-space filled dense class="mw-120" @update:model-value="val => updateProp('minColumnWidth', val ? Number(val) : '')" />
        </div>
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Largura máxima da coluna</span>
          <q-input :model-value="elementStates.maxColumnWidth" type="number" suffix="px" placeholder="auto" hide-bottom-space filled dense class="mw-120" @update:model-value="val => updateProp('maxColumnWidth', val ? Number(val) : '')" />
        </div>
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Espaçamento das células</span>
          <q-input :model-value="elementStates.cellGap" type="number" suffix="px" hide-bottom-space filled dense class="mw-120" @update:model-value="val => updateProp('cellGap', val ? Number(val) : '')" />
        </div>
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Preenchimento horizontal</span>
          <q-toggle :model-value="elementStates.horizontalPadding" color="primary" @update:model-value="val => updateProp('horizontalPadding', val)" />
        </div>
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Ocultar labels das linhas</span>
          <q-toggle :model-value="elementStates.hideRowLabels" color="primary" @update:model-value="val => updateProp('hideRowLabels', val)" />
        </div>
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Permitir linhas multilinha</span>
          <q-toggle :model-value="elementStates.allowMultilineRows" color="primary" @update:model-value="val => updateProp('allowMultilineRows', val)" />
        </div>
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Fixar labels das linhas</span>
          <q-toggle :model-value="elementStates.stickyRowLabels" color="primary" @update:model-value="val => updateProp('stickyRowLabels', val)" />
        </div>
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Ocultar labels das colunas</span>
          <q-toggle :model-value="elementStates.hideColumnLabels" color="primary" @update:model-value="val => updateProp('hideColumnLabels', val)" />
        </div>
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Permitir colunas multilinha</span>
          <q-toggle :model-value="elementStates.allowMultilineColumns" color="primary" @update:model-value="val => updateProp('allowMultilineColumns', val)" />
        </div>
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Fixar cabeçalhos das colunas</span>
          <q-toggle :model-value="elementStates.stickyColumnHeaders" color="primary" @update:model-value="val => updateProp('stickyColumnHeaders', val)" />
        </div>
        <div class="row align-center items-center justify-between">
          <span class="text-body2">Tamanho</span>
          <q-btn-toggle
            :model-value="elementStates.matrixSize"
            no-caps
            unelevated
            dense
            toggle-color="primary"
            :options="matrixSizeOptions"
            @update:model-value="val => updateProp('matrixSize', val)"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.matrix-config-item {
  border: 1px solid rgba(128, 128, 128, .2);
  border-radius: 6px;
  padding: .5rem;
}

.matrix-column-grid {
  align-items: center;
  display: grid;
  gap: .375rem;
  grid-template-columns: 24px minmax(0, 1fr) 40px;
}

.matrix-row-grid {
  align-items: center;
  display: grid;
  gap: .375rem;
  grid-template-columns: 24px minmax(0, 1fr) 40px;
}

.matrix-column-grid > :nth-child(3),
.matrix-column-grid > :nth-child(4),
.matrix-column-grid > :nth-child(5),
.matrix-row-grid > :nth-child(3) {
  grid-column: 2 / -1;
}

.matrix-column-grid > :nth-child(6),
.matrix-row-grid > :nth-child(4) {
  grid-column: 3;
  grid-row: 1;
}

.matrix-option-row {
  align-items: center;
  display: grid;
  gap: .375rem;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 32px;
}

.matrix-default-type-select {
  width: 160px;
}

.matrix-type-select {
  min-width: 116px;
}

.matrix-width-input {
  min-width: 72px;
}

.matrix-options-editor {
  background: rgba(128, 128, 128, .08);
  border-radius: 4px;
  padding: .5rem;
}

.mw-100 {
  max-width: 100px;
}

.mw-120 {
  max-width: 120px;
}

.mw-140 {
  max-width: 140px;
}

.mw-160 {
  max-width: 160px;
}

@media (max-width: 360px) {
  .matrix-option-row {
    grid-template-columns: minmax(0, 1fr) 32px;
  }

  .matrix-option-row > :nth-child(2) {
    grid-column: 1 / -1;
  }
}
</style>
