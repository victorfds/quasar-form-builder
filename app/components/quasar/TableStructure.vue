<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'
import type { BuilderFieldListKey, StructureCell } from '~/types'

interface MatrixOption {
  label: string
  value: string
}

const props = defineProps<{
  context: FormKitFrameworkContext & {
    rows?: MatrixOption[]
    columnsConfig?: MatrixOption[]
    cells?: StructureCell[]
    attrs: {
      rows?: MatrixOption[]
      columnsConfig?: MatrixOption[]
      cells?: StructureCell[]
      description?: string
    }
  }
}>()

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
</script>

<template>
  <q-markup-table dense flat bordered class="structure-table full-width">
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
            empty-text="Solte aqui"
          />
        </td>
      </tr>
    </tbody>
  </q-markup-table>
</template>

<style scoped>
.structure-table {
  border: 1px solid var(--line-color, #d7dde2);
  table-layout: fixed;
}

.structure-table__cell {
  min-width: 8rem;
  padding: 0.35rem;
  vertical-align: top;
}

.structure-table__cell :deep(.form-canvas) {
  min-height: 4.5rem;
  padding-bottom: 0;
  padding-top: 0;
}

.structure-table__cell :deep(.overlay-drop-here) {
  height: 4.5rem;
  min-height: 4.5rem;
}
</style>
