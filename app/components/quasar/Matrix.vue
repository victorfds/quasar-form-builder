<script setup lang="ts">
import type { FormKitFrameworkContext } from '@formkit/core'

interface MatrixOption {
  label: string
  value: string
}

type MatrixValue = Record<string, Record<string, string>>

const props = defineProps<{
  context: FormKitFrameworkContext & {
    rows?: MatrixOption[]
    columnsConfig?: MatrixOption[]
    table?: boolean
    attrs: {
      rows?: MatrixOption[]
      columnsConfig?: MatrixOption[]
      description?: string
      table?: boolean
    }
  }
}>()

const rows = computed(() => {
  const contextRows = props.context.attrs.rows || props.context.rows
  return contextRows?.length ? contextRows : [{ label: 'Linha 1', value: 'row_1' }]
})
const columns = computed(() => {
  const contextColumns = props.context.attrs.columnsConfig || props.context.columnsConfig
  return contextColumns?.length ? contextColumns : [{ label: 'Coluna 1', value: 'column_1' }]
})
const modelValue = computed<MatrixValue>(() => (props.context.value && typeof props.context.value === 'object' ? props.context.value as MatrixValue : {}))

function getCellValue(row: string, column: string) {
  return modelValue.value[row]?.[column] || ''
}

function updateCell(row: string, column: string, value: string | number | null) {
  props.context?.node.input({
    ...modelValue.value,
    [row]: {
      ...modelValue.value[row],
      [column]: value,
    },
  })
}
</script>

<template>
  <q-field
    borderless
    :model-value="modelValue"
    :label="context.label"
    :hint="context.attrs.description"
    stack-label
    hide-bottom-space
  >
    <template #control>
      <q-markup-table dense flat bordered class="matrix-field full-width">
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
            <td v-for="column in columns" :key="column.value">
              <q-input
                :model-value="getCellValue(row.value, column.value)"
                dense
                borderless
                hide-bottom-space
                @update:model-value="(val) => updateCell(row.value, column.value, val)"
              />
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </template>
  </q-field>
</template>

<style scoped>
.matrix-field {
  min-width: 100%;
}
</style>
