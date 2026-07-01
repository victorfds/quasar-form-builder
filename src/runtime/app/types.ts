import type { FormKitNode, FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'

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

export type BuilderClassValue = string | string[] | Record<string, boolean>

export interface FormBuilderLayoutConfig {
  showHeader?: boolean
  showThemeToggle?: boolean
  showFloatingControls?: boolean
  showLeftDrawer?: boolean
  showRightDrawer?: boolean
}

export interface FormBuilderLabelsConfig {
  edit?: string
  preview?: string
  undo?: string
  redo?: string
  openLeftDrawer?: string
  closeLeftDrawer?: string
  openRightDrawer?: string
  closeRightDrawer?: string
  clearForm?: string
}

export interface FormBuilderShellUiConfig {
  layout?: BuilderClassValue
  header?: BuilderClassValue
  headerTitle?: BuilderClassValue
  page?: BuilderClassValue
  floatingControls?: BuilderClassValue
}

export interface FormBuilderAppConfig {
  title?: string
  layout?: FormBuilderLayoutConfig
  labels?: FormBuilderLabelsConfig
  ui?: FormBuilderShellUiConfig
}

export type FormViewerValues = Record<string, unknown>

export interface FormViewerValuesUpdatePayload<TValues = FormViewerValues> {
  values: TValues
  previousValues: TValues
  changedFields: string[]
  timestamp: number
}

export interface FormViewerFieldChangePayload<TValues = FormViewerValues> {
  name: string
  value: unknown
  previousValue: unknown
  values: TValues
  timestamp: number
}

export interface FormViewerReadyPayload<TValues = FormViewerValues> {
  values: TValues
  fieldsCount: number
  timestamp: number
}

export interface FormViewerSubmitInvalidPayload<TValues = FormViewerValues> {
  values: TValues
  node: FormKitNode
  timestamp: number
}

export interface BuilderSelectionChangeDetail {
  fieldName?: string | null
  stepName?: string | null
  tabsFieldName?: string | null
  tabName?: string | null
}

export interface BuilderPreviewModeChangeDetail {
  mode: FormSettingsType['previewMode']
}

export interface BuilderEventMap {
  'builder:selection-change': CustomEvent<BuilderSelectionChangeDetail>
  'builder:preview-mode-change': CustomEvent<BuilderPreviewModeChangeDetail>
  'builder:focus-step-label': CustomEvent<void>
  'builder:focus-tab-label': CustomEvent<void>
}

declare global {
  interface WindowEventMap extends BuilderEventMap {}
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

export type MatrixColumnType
  = | 'default'
    | 'text'
    | 'textarea'
    | 'number'
    | 'email'
    | 'password'
    | 'url'
    | 'tel'
    | 'checkbox'
    | 'checkbox-blocks'
    | 'checkbox-group'
    | 'checkbox-tabs'
    | 'radio'
    | 'select'
    | 'multiselect'
    | 'tags'
    | 'date'
    | 'date-time'
    | 'time'
    | 'slider'
    | 'range'
    | 'toggle'

export interface MatrixOption {
  label: string
  value: string
}

export interface MatrixColumnConfig extends MatrixOption {
  type?: MatrixColumnType
  width?: string | number
  options?: MatrixOption[]
  if?: string
}

export interface MatrixConfig {
  defaultColumnType?: MatrixColumnType
  defaultColumnOptions?: MatrixOption[]
}

export interface MatrixRowConfig extends MatrixOption {
  if?: string
}

export type MatrixRowsMode = 'static' | 'dynamic'
export type MatrixViewMode = 'default' | 'table'
export type MatrixSize = 'default' | 'sm' | 'md' | 'lg'
export type MatrixValue = Record<string, Record<string, unknown>> | Array<Record<string, unknown>>

export interface LogicField {
  name: string
  operator: string
  value: string
  values: string[]
  or?: LogicField[] | null
}

export type ExtractedFormItemKind = 'field' | 'static' | 'structure'

export interface ExtractedFormItem {
  kind: ExtractedFormItemKind
  name?: string
  label?: string
  type?: string
  path: string[]
  value?: unknown
  displayValue?: string
  children?: ExtractedFormItem[]
}

export interface ExtractedFormAnswer {
  name: string
  label: string
  type?: string
  path: string[]
  value: unknown
  displayValue: string
}

export interface ExtractedFormData {
  items: ExtractedFormItem[]
  flatItems: ExtractedFormItem[]
  answers: ExtractedFormAnswer[]
  valuesByName: Record<string, unknown>
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
    | 'q-separator'
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
