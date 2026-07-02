<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { BuilderFieldListKey, StructureCell } from '#qfb/types'
import { useQuasar } from 'quasar'
import { computed, inject } from 'vue'
import { builderModeKey } from '#qfb/constants/injectionKeys'
import { useFormStore } from '#qfb/stores/formStore'
import { firstFilledArray } from '#qfb/utils'

interface MatrixOption {
  label: string
  value: string
}

const props = defineProps<{
  context: FormKitFrameworkContext & {
    description?: string
    rows?: MatrixOption[]
    columnsConfig?: MatrixOption[]
    cells?: StructureCell[]
    attrs: {
      label?: string
      rows?: MatrixOption[]
      columnsConfig?: MatrixOption[]
      cells?: StructureCell[]
      description?: string
    }
  }
}>()

const { dark } = useQuasar()
const formStore = useFormStore()
const builderMode = inject(builderModeKey, false)
const isEditing = computed(() => Boolean(builderMode && formStore.formSettings.previewMode === 'editing'))
const rows = computed(() => {
  const contextRows = firstFilledArray<MatrixOption>(props.context.rows, props.context.attrs.rows)
  return contextRows?.length ? contextRows : [{ label: 'Linha 1', value: 'row_1' }]
})
const columns = computed(() => {
  const contextColumns = firstFilledArray<MatrixOption>(props.context.columnsConfig, props.context.attrs.columnsConfig)
  return contextColumns?.length ? contextColumns : [{ label: 'Coluna 1', value: 'column_1' }]
})
const cells = computed(() => firstFilledArray<StructureCell>(props.context.cells, props.context.attrs.cells))

function getCellName(row: string, column: string) {
  return `${row}__${column}`
}

function getCell(row: string, column: string) {
  const name = getCellName(row, column)
  return cells.value.find(cell => cell.name === name)
}

function getCellListKey(row: string, column: string): BuilderFieldListKey {
  return `cell:${props.context.node.name}:${getCellName(row, column)}`
}

function getContextText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

const structureLabel = computed(() => getContextText(props.context.label) || getContextText(props.context.attrs.label))
const structureDescription = computed(() => getContextText(props.context.attrs.description) || getContextText(props.context.description))
const hasStructureHeader = computed(() => Boolean(structureLabel.value || structureDescription.value))
</script>

<template>
  <div class="structure-table-wrapper">
    <div v-if="hasStructureHeader" class="structure-header q-mb-sm">
      <div v-if="structureLabel" class="text-subtitle2">
        {{ structureLabel }}
      </div>
      <div v-if="structureDescription" class="text-caption text-grey-7">
        {{ structureDescription }}
      </div>
    </div>
    <q-markup-table
      dense
      flat
      class="structure-table full-width"
      :class="{
        'structure-table--editing': isEditing,
        'structure-table--dark': dark.isActive,
      }"
    >
      <thead>
        <tr>
          <th />
          <th v-for="column in columns" :key="column.value" class="text-left">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.value">
          <th class="text-left">
            {{ row.label }}
          </th>
          <td v-for="column in columns" :key="column.value" class="structure-table__cell">
            <BuilderStructureCanvas
              :fields="getCell(row.value, column.value)?.children || []"
              :list-key="getCellListKey(row.value, column.value)"
            />
          </td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
</template>

<style scoped>
.structure-table-wrapper {
  max-width: 100%;
  min-width: 0;
}

.structure-table {
  background: transparent;
  border: 0;
  table-layout: fixed;
}

.structure-table--editing {
  background: rgba(225, 232, 238, .82);
  border-radius: 6px;
}

.structure-table--editing.structure-table--dark {
  background: rgba(255, 255, 255, .055);
}

.structure-table__cell {
  box-sizing: border-box;
  max-width: 100%;
  min-width: 8rem;
  overflow: visible;
  padding: 0;
  vertical-align: top;
}

.structure-table--editing .structure-table__cell {
  padding: .5rem;
}

.structure-table__cell :deep(.form-canvas) {
  max-width: 100%;
  min-height: 4.5rem;
  overflow: visible;
  padding-bottom: 0;
  padding-top: 0;
}

.structure-table__cell :deep(.overlay-drop-here) {
  height: 4.5rem;
  min-height: 4.5rem;
}

.structure-table :deep(th),
.structure-table :deep(td) {
  border: 0;
}

.structure-table--editing :deep(th),
.structure-table--editing :deep(td) {
  background: transparent;
}
</style>
