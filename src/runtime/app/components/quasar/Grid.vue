<script setup lang="ts">
import type { BuilderFieldListKey, StructureCell } from '#qfb/types'
import type { FormKitFrameworkContext, FormKitSchemaDefinition } from '@formkit/core'
import { builderModeKey } from '#qfb/constants/injectionKeys'

interface GridOption {
  label: string
  value: string
}

const props = defineProps<{
  context: FormKitFrameworkContext & {
    children?: FormKitSchemaDefinition[]
    structureChildren?: FormKitSchemaDefinition[]
    columnsCount?: number
    rowsCount?: number
    cells?: StructureCell[]
    attrs: {
      structureChildren?: FormKitSchemaDefinition[]
      children?: FormKitSchemaDefinition[]
      columnsCount?: number
      rowsCount?: number
      cells?: StructureCell[]
      description?: string
    }
  }
}>()

const { dark } = useQuasar()
const formStore = useFormStore()
const builderMode = inject(builderModeKey, false)
const isEditing = computed(() => Boolean(builderMode && formStore.formSettings.previewMode === 'editing'))
const columnsCount = computed(() => Math.max(1, Math.min(4, Number(props.context.attrs.columnsCount || props.context.columnsCount || 2))))
const rowsCount = computed(() => Math.max(1, Math.min(8, Number(props.context.attrs.rowsCount || props.context.rowsCount || 1))))
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columnsCount.value}, minmax(0, 1fr))`,
}))

const rows = computed<GridOption[]>(() =>
  Array.from({ length: rowsCount.value }, (_, index) => ({
    label: `Linha ${index + 1}`,
    value: `row_${index + 1}`,
  })),
)
const columns = computed<GridOption[]>(() =>
  Array.from({ length: columnsCount.value }, (_, index) => ({
    label: `Coluna ${index + 1}`,
    value: `column_${index + 1}`,
  })),
)
const gridCells = computed(() => {
  const legacyChildren = firstFilledArray<FormKitSchemaDefinition>(
    props.context.structureChildren,
    props.context.attrs.structureChildren,
    props.context.children,
    props.context.attrs.children,
  )
  const existingCells = firstFilledArray<StructureCell>(props.context.cells, props.context.attrs.cells)

  return rows.value.flatMap((row, rowIndex) =>
    columns.value.map((column, columnIndex) => {
      const name = `${row.value}__${column.value}`
      const existingCell = existingCells.find(cell => cell.name === name)
      return {
        name,
        label: `${row.label} / ${column.label}`,
        row: row.value,
        column: column.value,
        rowIndex,
        columnIndex,
        children: existingCell?.children || (rowIndex === 0 && columnIndex === 0 ? legacyChildren : []),
      }
    }),
  )
})

function getCellListKey(cellName: string): BuilderFieldListKey {
  return `cell:${props.context.node.name}:${cellName}`
}
</script>

<template>
  <div
    class="structure-grid"
    :class="{
      'structure-grid--editing': isEditing,
      'structure-grid--dark': dark.isActive,
    }"
    :style="gridStyle"
  >
    <div
      v-for="cell in gridCells"
      :key="cell.name"
      class="structure-grid__cell"
      :class="{
        'structure-grid__cell--last-row': cell.rowIndex === rowsCount - 1,
        'structure-grid__cell--last-column': cell.columnIndex === columnsCount - 1,
      }"
    >
      <BuilderStructureCanvas
        :fields="cell.children"
        :list-key="getCellListKey(cell.name)"
        :empty-text="cell.label"
      />
    </div>
  </div>
</template>

<style scoped>
.structure-grid {
  border: 0;
  box-sizing: border-box;
  display: grid;
  gap: 0;
  overflow: visible;
  width: 100%;
}

.structure-grid--editing {
  background: rgba(225, 232, 238, .82);
  border-radius: 6px;
  gap: .75rem;
  padding: .75rem;
}

.structure-grid--editing.structure-grid--dark {
  background: rgba(255, 255, 255, .055);
}

.structure-grid__cell {
  box-sizing: border-box;
  min-width: 0;
  overflow: visible;
  padding: 0;
}

.structure-grid--editing > .structure-grid__cell {
  background: rgba(255, 255, 255, .56);
  border-radius: 6px;
  padding: .5rem;
}

.structure-grid--editing.structure-grid--dark > .structure-grid__cell {
  background: rgba(255, 255, 255, .055);
}

.structure-grid__cell :deep(.form-canvas) {
  min-height: 5rem;
  max-width: 100%;
  overflow: visible;
  padding-bottom: 0;
  padding-top: 0;
}

.structure-grid__cell :deep(.overlay-drop-here) {
  height: 5rem;
  min-height: 5rem;
}

@media (max-width: 599px) {
  .structure-grid {
    grid-template-columns: 1fr !important;
  }

  .structure-grid__cell {
    min-height: 5rem;
  }
}
</style>
