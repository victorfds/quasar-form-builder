<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { MatrixColumnConfig, MatrixColumnType, MatrixOption, MatrixRowConfig } from '~/types'
import { builderModeKey, schemaDataKey } from '~/constants/injectionKeys'
import { getEffectiveMatrixColumnType, matrixColumnTypeUsesOptions } from '~/constants/matrix'

type StaticMatrixValue = Record<string, Record<string, unknown>>
type DynamicMatrixValue = Array<Record<string, unknown>>

type MatrixContext = FormKitFrameworkContext & {
  rows?: MatrixRowConfig[]
  columnsConfig?: MatrixColumnConfig[]
  defaultColumnOptions?: MatrixOption[]
  table?: boolean
  rowsMode?: 'static' | 'dynamic'
  matrixView?: 'default' | 'table'
  defaultColumnType?: MatrixColumnType
  attrs: Record<string, any>
}

const props = defineProps<{ context: MatrixContext }>()

const matrixPropNames = [
  'rows',
  'columnsConfig',
  'defaultColumnType',
  'defaultColumnOptions',
  'table',
  'rowsMode',
  'initialRows',
  'minRows',
  'maxRows',
  'canAddRows',
  'addButtonText',
  'canRemoveRows',
  'matrixView',
  'minColumnWidth',
  'maxColumnWidth',
  'cellGap',
  'horizontalPadding',
  'hideRowLabels',
  'allowMultilineRows',
  'stickyRowLabels',
  'hideColumnLabels',
  'allowMultilineColumns',
  'stickyColumnHeaders',
  'matrixSize',
]

const defaultRows: MatrixRowConfig[] = [
  { label: 'Linha 1', value: 'row_1' },
  { label: 'Linha 2', value: 'row_2' },
]

const defaultColumns: MatrixColumnConfig[] = [
  { label: 'Coluna 1', value: 'column_1', type: 'default' },
  { label: 'Coluna 2', value: 'column_2', type: 'default' },
]

const defaultOptions: MatrixOption[] = [
  { label: 'Opção 1', value: 'option_1' },
  { label: 'Opção 2', value: 'option_2' },
]

const builderMode = inject(builderModeKey, false)
const schemaData = inject(schemaDataKey, computed(() => ({})))
const formStore = useFormStore()

const matrixAttrs = computed(() => getFormKitContextAttrs(props.context, matrixPropNames))
const isEditing = computed(() => builderMode && formStore.formSettings.previewMode === 'editing')
const schemaValues = computed(() => unref(schemaData) || {})
const rowsMode = computed(() => matrixAttrs.value.rowsMode === 'dynamic' ? 'dynamic' : 'static')
const isDynamicRows = computed(() => rowsMode.value === 'dynamic')
const matrixView = computed(() => matrixAttrs.value.matrixView || (matrixAttrs.value.table ? 'table' : 'default'))
const shouldRenderTable = computed(() => matrixView.value === 'table' || matrixAttrs.value.table)

const rows = computed<MatrixRowConfig[]>(() =>
  firstFilledArray<MatrixRowConfig>(matrixAttrs.value.rows, props.context.rows, defaultRows),
)

const inheritedColumnOptions = computed<MatrixOption[]>(() =>
  firstFilledArray<MatrixOption>(matrixAttrs.value.defaultColumnOptions, props.context.defaultColumnOptions, defaultOptions),
)

const columns = computed<MatrixColumnConfig[]>(() =>
  firstFilledArray<MatrixColumnConfig>(matrixAttrs.value.columnsConfig, props.context.columnsConfig, defaultColumns)
    .map(column => ({
      ...column,
      type: column.type || 'default',
    })),
)

const visibleColumns = computed(() => {
  if (isEditing.value) return columns.value
  return columns.value.filter(column => evaluateLogicString(column.if, schemaValues.value))
})

const visibleRows = computed(() => {
  if (isEditing.value) return rows.value
  return rows.value.filter(row => evaluateLogicString(row.if, schemaValues.value))
})

const staticModel = computed<StaticMatrixValue>(() => {
  const value = props.context.value
  return value && typeof value === 'object' && !Array.isArray(value) ? value as StaticMatrixValue : {}
})

const dynamicModel = computed<DynamicMatrixValue>(() => {
  const value = props.context.value
  return Array.isArray(value) ? value as DynamicMatrixValue : []
})

const initialRows = computed(() => normalizeCount(matrixAttrs.value.initialRows, 1))
const minRows = computed(() => normalizeCount(matrixAttrs.value.minRows, 0))
const maxRows = computed(() => normalizeCount(matrixAttrs.value.maxRows, 0))
const dynamicRows = computed(() => {
  const currentCount = dynamicModel.value.length || initialRows.value
  const boundedByMin = Math.max(currentCount, minRows.value)
  const boundedByMax = maxRows.value ? Math.min(boundedByMin, maxRows.value) : boundedByMin

  return Array.from({ length: boundedByMax }, (_, index) => dynamicModel.value[index] || {})
})
const canAddRows = computed(() => matrixAttrs.value.canAddRows !== false && (!maxRows.value || dynamicRows.value.length < maxRows.value))
const canRemoveRows = computed(() => matrixAttrs.value.canRemoveRows !== false && dynamicRows.value.length > minRows.value)

const matrixClasses = computed(() => ({
  'matrix-field--table': shouldRenderTable.value,
  'matrix-field--cards': !shouldRenderTable.value,
  'matrix-field--hide-row-labels': Boolean(matrixAttrs.value.hideRowLabels),
  'matrix-field--hide-column-labels': Boolean(matrixAttrs.value.hideColumnLabels),
  'matrix-field--single-line-rows': !matrixAttrs.value.allowMultilineRows,
  'matrix-field--single-line-columns': !matrixAttrs.value.allowMultilineColumns,
  'matrix-field--sticky-rows': Boolean(matrixAttrs.value.stickyRowLabels),
  'matrix-field--sticky-columns': Boolean(matrixAttrs.value.stickyColumnHeaders),
  [`matrix-field--${matrixAttrs.value.matrixSize || 'default'}`]: true,
}))

const matrixStyle = computed(() => ({
  '--matrix-cell-gap': `${normalizeCount(matrixAttrs.value.cellGap, 0)}px`,
  '--matrix-cell-padding-x': matrixAttrs.value.horizontalPadding === false ? '0' : '12px',
  '--matrix-min-column-width': toCssSize(matrixAttrs.value.minColumnWidth, '0px'),
  '--matrix-max-column-width': toCssSize(matrixAttrs.value.maxColumnWidth, 'none'),
}))

function getColumnType(column: MatrixColumnConfig) {
  return getEffectiveMatrixColumnType(column.type, matrixAttrs.value.defaultColumnType)
}

function columnTypeUsesOptions(column: MatrixColumnConfig) {
  return matrixColumnTypeUsesOptions(getColumnType(column))
}

function getColumnOptions(column: MatrixColumnConfig) {
  if (!columnTypeUsesOptions(column)) return []
  return column.options?.length ? column.options : inheritedColumnOptions.value
}

function normalizeCount(value: unknown, fallback: number) {
  const count = Number(value)
  if (!Number.isFinite(count)) return fallback
  return Math.max(0, Math.round(count))
}

function toCssSize(value: unknown, fallback: string) {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'number') return `${value}px`
  const normalized = String(value).trim()
  if (!normalized) return fallback
  return /^\d+$/.test(normalized) ? `${normalized}px` : normalized
}

function isMultipleColumn(column: MatrixColumnConfig) {
  return ['checkbox-group', 'multiselect', 'tags'].includes(getColumnType(column))
}

function isBooleanColumn(column: MatrixColumnConfig) {
  return ['checkbox', 'toggle'].includes(getColumnType(column))
}

function isRangeColumn(column: MatrixColumnConfig) {
  return getColumnType(column) === 'range'
}

function getEmptyCellValue(column: MatrixColumnConfig) {
  if (isMultipleColumn(column)) return []
  if (isBooleanColumn(column)) return false
  if (isRangeColumn(column)) return { min: 0, max: 50 }
  if (getColumnType(column) === 'slider') return 0
  return ''
}

function getStaticCellValue(rowValue: string, column: MatrixColumnConfig) {
  return staticModel.value[rowValue]?.[column.value] ?? getEmptyCellValue(column)
}

function getDynamicCellValue(rowIndex: number, column: MatrixColumnConfig) {
  return dynamicRows.value[rowIndex]?.[column.value] ?? getEmptyCellValue(column)
}

function updateStaticCell(rowValue: string, column: MatrixColumnConfig, value: unknown) {
  props.context.node.input({
    ...staticModel.value,
    [rowValue]: {
      ...(staticModel.value[rowValue] || {}),
      [column.value]: value,
    },
  })
}

function updateDynamicCell(rowIndex: number, column: MatrixColumnConfig, value: unknown) {
  const nextRows = dynamicRows.value.map(row => ({ ...row }))
  nextRows[rowIndex] = {
    ...(nextRows[rowIndex] || {}),
    [column.value]: value,
  }
  props.context.node.input(nextRows)
}

function addDynamicRow() {
  if (!canAddRows.value) return
  props.context.node.input([...dynamicRows.value.map(row => ({ ...row })), {}])
}

function removeDynamicRow(rowIndex: number) {
  if (!canRemoveRows.value) return
  props.context.node.input(dynamicRows.value.filter((_, index) => index !== rowIndex))
}

function getColumnStyle(column: MatrixColumnConfig) {
  const width = toCssSize(column.width, '')
  return {
    width: width || undefined,
    minWidth: width || 'var(--matrix-min-column-width)',
    maxWidth: 'var(--matrix-max-column-width)',
  }
}

function getInputType(column: MatrixColumnConfig) {
  const type = getColumnType(column)
  if (type === 'textarea') return 'textarea'
  if (['number', 'email', 'password', 'url', 'tel'].includes(type)) return type
  if (type === 'date') return 'date'
  if (type === 'date-time') return 'datetime-local'
  if (type === 'time') return 'time'
  return 'text'
}

function getOptionGroupType(column: MatrixColumnConfig) {
  const type = getColumnType(column)
  if (type === 'radio') return 'radio'
  return 'checkbox'
}

function getOptionGroupClass(column: MatrixColumnConfig) {
  return ['checkbox-blocks', 'checkbox-tabs'].includes(getColumnType(column))
    ? 'matrix-field__option-blocks'
    : ''
}
</script>

<template>
  <q-field
    borderless
    :model-value="context.value"
    :label="context.label"
    :hint="matrixAttrs.description"
    stack-label
    hide-bottom-space
    class="matrix-field-wrapper"
  >
    <template #control>
      <div class="matrix-field full-width" :class="matrixClasses" :style="matrixStyle">
        <q-markup-table
          flat
          bordered
          separator="cell"
          :dense="['default', 'sm'].includes(matrixAttrs.matrixSize || 'default')"
          class="matrix-field__table full-width"
        >
          <thead v-if="!matrixAttrs.hideColumnLabels">
            <tr>
              <th v-if="!matrixAttrs.hideRowLabels" class="matrix-field__corner" />
              <th
                v-for="column in visibleColumns"
                :key="column.value"
                class="matrix-field__column-label text-left"
                :style="getColumnStyle(column)"
              >
                {{ column.label }}
              </th>
              <th v-if="isDynamicRows && matrixAttrs.canRemoveRows !== false" class="matrix-field__actions-cell" />
            </tr>
          </thead>

          <tbody v-if="!isDynamicRows">
            <tr v-for="row in visibleRows" :key="row.value">
              <th v-if="!matrixAttrs.hideRowLabels" class="matrix-field__row-label text-left">
                {{ row.label }}
              </th>
              <td v-for="column in visibleColumns" :key="column.value" class="matrix-field__cell" :style="getColumnStyle(column)">
                <template v-if="['checkbox', 'toggle'].includes(getColumnType(column))">
                  <q-toggle
                    v-if="getColumnType(column) === 'toggle'"
                    :model-value="Boolean(getStaticCellValue(row.value, column))"
                    dense
                    color="primary"
                    @update:model-value="val => updateStaticCell(row.value, column, val)"
                  />
                  <q-checkbox
                    v-else
                    :model-value="Boolean(getStaticCellValue(row.value, column))"
                    dense
                    color="primary"
                    @update:model-value="val => updateStaticCell(row.value, column, val)"
                  />
                </template>
                <q-btn-toggle
                  v-else-if="getColumnType(column) === 'checkbox-tabs'"
                  :model-value="getStaticCellValue(row.value, column)"
                  :options="getColumnOptions(column)"
                  clearable
                  dense
                  no-caps
                  unelevated
                  toggle-color="primary"
                  @update:model-value="val => updateStaticCell(row.value, column, val)"
                />
                <q-option-group
                  v-else-if="['checkbox-group', 'checkbox-blocks', 'radio'].includes(getColumnType(column))"
                  :model-value="getStaticCellValue(row.value, column)"
                  :options="getColumnOptions(column)"
                  :type="getOptionGroupType(column)"
                  :class="getOptionGroupClass(column)"
                  dense
                  @update:model-value="val => updateStaticCell(row.value, column, val)"
                />
                <q-select
                  v-else-if="['select', 'multiselect', 'tags'].includes(getColumnType(column))"
                  :model-value="getStaticCellValue(row.value, column)"
                  :options="getColumnOptions(column)"
                  :multiple="['multiselect', 'tags'].includes(getColumnType(column))"
                  :use-chips="['multiselect', 'tags'].includes(getColumnType(column))"
                  :use-input="getColumnType(column) === 'tags'"
                  :new-value-mode="getColumnType(column) === 'tags' ? 'add-unique' : undefined"
                  dense
                  filled
                  emit-value
                  map-options
                  hide-bottom-space
                  @update:model-value="val => updateStaticCell(row.value, column, val)"
                />
                <q-slider
                  v-else-if="getColumnType(column) === 'slider'"
                  :model-value="Number(getStaticCellValue(row.value, column) || 0)"
                  :min="0"
                  :max="100"
                  @update:model-value="val => updateStaticCell(row.value, column, val)"
                />
                <q-range
                  v-else-if="getColumnType(column) === 'range'"
                  :model-value="getStaticCellValue(row.value, column) as any"
                  :min="0"
                  :max="100"
                  @update:model-value="val => updateStaticCell(row.value, column, val)"
                />
                <q-input
                  v-else
                  :model-value="getStaticCellValue(row.value, column)"
                  :type="getInputType(column)"
                  dense
                  borderless
                  hide-bottom-space
                  @update:model-value="val => updateStaticCell(row.value, column, val)"
                />
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr v-for="(_, rowIndex) in dynamicRows" :key="rowIndex">
              <th v-if="!matrixAttrs.hideRowLabels" class="matrix-field__row-label text-left">
                {{ `Linha ${rowIndex + 1}` }}
              </th>
              <td v-for="column in visibleColumns" :key="column.value" class="matrix-field__cell" :style="getColumnStyle(column)">
                <template v-if="['checkbox', 'toggle'].includes(getColumnType(column))">
                  <q-toggle
                    v-if="getColumnType(column) === 'toggle'"
                    :model-value="Boolean(getDynamicCellValue(rowIndex, column))"
                    dense
                    color="primary"
                    @update:model-value="val => updateDynamicCell(rowIndex, column, val)"
                  />
                  <q-checkbox
                    v-else
                    :model-value="Boolean(getDynamicCellValue(rowIndex, column))"
                    dense
                    color="primary"
                    @update:model-value="val => updateDynamicCell(rowIndex, column, val)"
                  />
                </template>
                <q-btn-toggle
                  v-else-if="getColumnType(column) === 'checkbox-tabs'"
                  :model-value="getDynamicCellValue(rowIndex, column)"
                  :options="getColumnOptions(column)"
                  clearable
                  dense
                  no-caps
                  unelevated
                  toggle-color="primary"
                  @update:model-value="val => updateDynamicCell(rowIndex, column, val)"
                />
                <q-option-group
                  v-else-if="['checkbox-group', 'checkbox-blocks', 'radio'].includes(getColumnType(column))"
                  :model-value="getDynamicCellValue(rowIndex, column)"
                  :options="getColumnOptions(column)"
                  :type="getOptionGroupType(column)"
                  :class="getOptionGroupClass(column)"
                  dense
                  @update:model-value="val => updateDynamicCell(rowIndex, column, val)"
                />
                <q-select
                  v-else-if="['select', 'multiselect', 'tags'].includes(getColumnType(column))"
                  :model-value="getDynamicCellValue(rowIndex, column)"
                  :options="getColumnOptions(column)"
                  :multiple="['multiselect', 'tags'].includes(getColumnType(column))"
                  :use-chips="['multiselect', 'tags'].includes(getColumnType(column))"
                  :use-input="getColumnType(column) === 'tags'"
                  :new-value-mode="getColumnType(column) === 'tags' ? 'add-unique' : undefined"
                  dense
                  filled
                  emit-value
                  map-options
                  hide-bottom-space
                  @update:model-value="val => updateDynamicCell(rowIndex, column, val)"
                />
                <q-slider
                  v-else-if="getColumnType(column) === 'slider'"
                  :model-value="Number(getDynamicCellValue(rowIndex, column) || 0)"
                  :min="0"
                  :max="100"
                  @update:model-value="val => updateDynamicCell(rowIndex, column, val)"
                />
                <q-range
                  v-else-if="getColumnType(column) === 'range'"
                  :model-value="getDynamicCellValue(rowIndex, column) as any"
                  :min="0"
                  :max="100"
                  @update:model-value="val => updateDynamicCell(rowIndex, column, val)"
                />
                <q-input
                  v-else
                  :model-value="getDynamicCellValue(rowIndex, column)"
                  :type="getInputType(column)"
                  dense
                  borderless
                  hide-bottom-space
                  @update:model-value="val => updateDynamicCell(rowIndex, column, val)"
                />
              </td>
              <td v-if="matrixAttrs.canRemoveRows !== false" class="matrix-field__actions-cell">
                <q-btn
                  flat
                  dense
                  round
                  icon="close"
                  size="sm"
                  :disable="!canRemoveRows"
                  @click="removeDynamicRow(rowIndex)"
                />
              </td>
            </tr>
          </tbody>
        </q-markup-table>

        <q-btn
          v-if="isDynamicRows && matrixAttrs.canAddRows !== false"
          class="q-mt-sm"
          color="primary"
          no-caps
          size="sm"
          :disable="!canAddRows"
          :label="matrixAttrs.addButtonText || '+ Adicionar'"
          @click="addDynamicRow"
        />
      </div>
    </template>
  </q-field>
</template>

<style scoped>
.matrix-field {
  min-width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

.matrix-field__table {
  border-color: rgba(141, 135, 135, .72);
  min-width: 100%;
  table-layout: fixed;
  width: 100%;
}

.matrix-field__table :deep(th),
.matrix-field__table :deep(td) {
  border-color: rgba(141, 135, 135, .72);
  border-style: solid;
  border-width: 1px;
  max-width: var(--matrix-max-column-width);
  min-width: var(--matrix-min-column-width);
  overflow-wrap: anywhere;
  padding-left: var(--matrix-cell-padding-x);
  padding-right: var(--matrix-cell-padding-x);
  vertical-align: middle;
}

.matrix-field__column-label,
.matrix-field__row-label,
.matrix-field__corner,
.matrix-field__actions-cell {
  background: rgba(128, 123, 123, .9);
  color: #fff;
  font-weight: 500;
}

.matrix-field__cell {
  background: rgba(255, 255, 255, .02);
}

.matrix-field--single-line-rows .matrix-field__row-label,
.matrix-field--single-line-columns .matrix-field__column-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.matrix-field--sticky-rows .matrix-field__row-label,
.matrix-field--sticky-rows .matrix-field__corner {
  left: 0;
  position: sticky;
  z-index: 2;
}

.matrix-field--sticky-columns .matrix-field__column-label,
.matrix-field--sticky-columns .matrix-field__corner {
  position: sticky;
  top: 0;
  z-index: 3;
}

.matrix-field--sm .matrix-field__table :deep(th),
.matrix-field--sm .matrix-field__table :deep(td) {
  padding-bottom: 4px;
  padding-top: 4px;
}

.matrix-field--md .matrix-field__table :deep(th),
.matrix-field--md .matrix-field__table :deep(td) {
  padding-bottom: 10px;
  padding-top: 10px;
}

.matrix-field--lg .matrix-field__table :deep(th),
.matrix-field--lg .matrix-field__table :deep(td) {
  padding-bottom: 14px;
  padding-top: 14px;
}

.matrix-field__option-blocks :deep(.q-radio),
.matrix-field__option-blocks :deep(.q-checkbox) {
  border: 1px solid var(--line-color);
  border-radius: 6px;
  margin-bottom: .25rem;
  padding: .375rem;
}

body.body--light .matrix-field__column-label,
body.body--light .matrix-field__row-label,
body.body--light .matrix-field__corner,
body.body--light .matrix-field__actions-cell {
  background: #e8e3e3;
  color: #1f2933;
}

body.body--light .matrix-field__cell {
  background: #fff;
}
</style>
