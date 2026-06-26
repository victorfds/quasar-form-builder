import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'

export interface ElementType {
  type: string
  inputType?: string
  label?: string
  description?: string
  rules?: string[]
  autocomplete?: string
  allowIncomplete?: boolean
  unmask?: boolean
  placeholder?: string
  floating?: boolean
  text?: string
  items?: Array<{ value: number | string, label: string, description?: string }>
  view?: string
  search?: boolean
  native?: boolean
  closeOnSelect?: boolean
  time?: boolean
  date?: boolean
  mode?: string
  default?: number | string | number[] | File | File[]
  orientation?: string
  accept?: string
  file?: { rules?: string[] }
}

export type BuilderCatalogCategory = 'fields' | 'statics' | 'structures'

export interface BuilderCatalogItem {
  name: string
  icon: string
  title: string
  description: string
  category: BuilderCatalogCategory
  schema: FormKitSchemaDefinition
}

export interface ColumnsType {
  container?: number | null
  default?: { container: number } | null
  sm?: { container: number } | null
  lg?: { container: number } | null
}

export interface FormSettingsType {
  formName?: string
  preview: { width?: string | number | null, isFullWidth: boolean }
  previewMode: 'editing' | 'previewing'
  columns: FormViewportType
}

export type ActiveFieldType = FormKitSchemaNode & { columns: ColumnsType } | null

export type FormViewportType = 'default' | 'sm' | 'lg'

export type BuilderDragPlacement = 'top' | 'bottom' | 'left' | 'right' | 'inside'

export type BuilderFieldListKey
  = | 'root'
    | `step:${string}`
    | `children:${string}`
    | `tab:${string}:${string}`
    | `cell:${string}:${string}`

export interface StructureCell {
  name: string
  label?: string
  row?: string
  column?: string
  children?: FormKitSchemaDefinition[]
}

export interface LogicField {
  name: string
  operator: string
  value: string
  values: string[]
  or?: LogicField[] | null
}

export type ComponentsTypes
  = | 'q-input'
    | 'q-select'
    | 'q-option-group'
    | 'q-btn-toggle'
    | 'q-checkbox'
    | 'q-toggle'
    | 'q-slider'
    | 'q-range'
    | 'q-file'
    | 'q-date'
    | 'q-date-multiple'
    | 'q-date-range'
    | 'q-datetime'
    | 'q-time'
    | 'q-editor'
    | 'q-signature'
    | 'q-matrix'
    | 'q-container'
    | 'q-tabs'
    | 'q-grid'
    | 'q-table-structure'
    | 'q-list-structure'
    | 'q-stepper'
    | undefined
