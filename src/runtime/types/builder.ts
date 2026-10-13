import type { QfbSchemaField } from './schema'

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
  schema: QfbSchemaField
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

export interface BuilderSelectionChangeDetail {
  fieldId?: string | null
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

export type ActiveFieldType = QfbSchemaField | null

export type FormViewportType = 'default' | 'sm' | 'lg'

export type BuilderDragPlacement = 'top' | 'bottom' | 'left' | 'right' | 'inside'

export type BuilderFieldListKey
  = | 'root'
    | `step:${string}`
    | `children:${string}`
    | `tab:${string}:${string}`
    | `cell:${string}:${string}`
