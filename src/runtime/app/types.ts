import type { FormKitAttributeValue, FormKitNode, FormKitSchemaCondition, FormKitSchemaProps } from '@formkit/core'

export interface QfbConditionalRule<T> {
  if: string
  then: T
  else?: T
}

export interface QfbSchemaMetadata extends Omit<FormKitSchemaProps, 'children'> {
  [property: string]: unknown
  'fieldId'?: string
  'name'?: string
  'label'?: string
  '$formkit'?: string
  '$el'?: string | null
  '$cmp'?: string
  'inputType'?: string
  'children'?: string | QfbSchemaField[] | FormKitSchemaCondition
  'structureChildren'?: QfbSchemaField[]
  'columns'?: ColumnsType
  'align'?: 'left' | 'center' | 'right'
  'info'?: string
  'help'?: string
  'description'?: string
  'placeholder'?: string
  'attrs'?: Record<string, FormKitAttributeValue>
  'validation'?: string | QfbConditionalRule<string>
  'disable'?: boolean | string | QfbConditionalRule<boolean>
  'disabled'?: boolean | string | QfbConditionalRule<boolean>
  'readonly'?: boolean | string | QfbConditionalRule<boolean>
  'steps'?: QfbSchemaSection[]
  'tabs'?: QfbSchemaSection[]
  'cells'?: StructureCell[]
  'options'?: MatrixOption[]
  'defaultColumnType'?: MatrixColumnType
  'defaultColumnOptions'?: MatrixOption[]
  'table'?: boolean
  'rowsMode'?: MatrixRowsMode
  'initialRows'?: number
  'minRows'?: number
  'maxRows'?: number
  'canAddRows'?: boolean
  'canRemoveRows'?: boolean
  'addButtonText'?: string
  'matrixView'?: MatrixViewMode
  'minColumnWidth'?: number
  'maxColumnWidth'?: number
  'cellGap'?: number
  'horizontalPadding'?: boolean
  'hideRowLabels'?: boolean
  'allowMultilineRows'?: boolean
  'stickyRowLabels'?: boolean
  'hideColumnLabels'?: boolean
  'allowMultilineColumns'?: boolean
  'stickyColumnHeaders'?: boolean
  'matrixSize'?: MatrixSize
  'maxValues'?: number
  'inputDebounce'?: number
  'useChips'?: boolean
  'rows'?: MatrixRowConfig[]
  'columnsConfig'?: MatrixColumnConfig[]
  'rowsCount'?: number
  'columnsCount'?: number
  'nested'?: boolean
  'groupType'?: string
  'optionStyle'?: string
  'multiple'?: boolean
  'mediaKind'?: 'file' | 'image' | 'video' | 'audio'
  'gallery'?: boolean
  'capture'?: 'user' | 'environment'
  'accept'?: string
  'maxFileSize'?: number
  'maxTotalSize'?: number
  'maxFiles'?: number
  'maxDurationSeconds'?: number
  'preferredMimeTypes'?: string[]
  'min'?: number | string
  'max'?: number | string
  'step'?: number
  'size'?: string | number
  'dense'?: boolean
  'full'?: boolean
  'type'?: string
  'color'?: string
  'buttonLabel'?: string
  'clearable'?: boolean
  'counter'?: boolean
  'loading'?: boolean
  'stackLabel'?: boolean
  'autogrow'?: boolean
  'prefix'?: string
  'suffix'?: string
  'debounce'?: number
  'mask'?: string
  'fill-mask'?: boolean | string
  'reverse-fill-mask'?: boolean
  'unmasked-value'?: boolean
  'reverseFillMask'?: boolean
  'unmaskedValue'?: boolean
  'filled'?: boolean
  'outlined'?: boolean
  'standout'?: boolean | string
  'borderless'?: boolean
  'rounded'?: boolean
  'square'?: boolean
  'dark'?: boolean
  'format24h'?: boolean
  'withSeconds'?: boolean
  'nowBtn'?: boolean
  'emitImmediately'?: boolean
  'defaultYearMonth'?: string
  'disabledDates'?: string[]
  'vertical'?: boolean
  'inset'?: boolean
  'spaced'?: boolean | string
  'leftLabel'?: boolean
  'trueValue'?: unknown
  'falseValue'?: unknown
  'indeterminateValue'?: unknown
  'hasCondition'?: boolean
}

export interface QfbSchemaSection {
  fieldId?: string
  name: string
  label?: string
  if?: string
  children?: QfbSchemaField[]
  showPrevious?: boolean
  prevLabel?: string
  nextLabel?: string
  validation?: string | QfbConditionalRule<string>
  disable?: boolean | QfbConditionalRule<boolean>
  readonly?: boolean | QfbConditionalRule<boolean>
}

/** An individual editable object node, not FormKit's complete definition/array. */
export type QfbSchemaField = QfbSchemaMetadata & (
  { $formkit: string } | { $el: string | null } | { $cmp: string, props?: Record<string, unknown> }
)

export function isQfbConditionalRule(value: unknown): value is QfbConditionalRule<unknown> {
  return Boolean(value && typeof value === 'object' && 'if' in value)
}

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

export interface StructureCell {
  fieldId?: string
  name: string
  label?: string
  row?: string
  column?: string
  children?: QfbSchemaField[]
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

export type ConditionOperatorValue
  = | 'empty'
    | 'notEmpty'
    | 'equals'
    | 'notEquals'
    | 'greaterThan'
    | 'greaterOrEqualsThan'
    | 'lessThan'
    | 'lessOrEqualsThan'
    | 'startsWith'
    | 'endsWith'
    | 'contains'
    | 'isTrue'
    | 'isFalse'
    | 'isToday'
    | 'isTomorrow'
    | 'isYesterday'
    | 'isDayAfterTomorrow'
    | 'isDayBeforeYesterday'

export interface ConditionOperatorOption {
  value: ConditionOperatorValue
  label: string
}

export type ConditionValueInputMode = 'none' | 'text' | 'tags' | 'options-single' | 'options-multiple'

export interface LogicField {
  name: string
  operator: ConditionOperatorValue | ''
  value: string
  values: string[]
  or?: LogicField[] | null
}

export type ExtractedFormItemKind = 'field' | 'static' | 'structure'

export interface ExtractedFormItem {
  fieldId?: string
  fieldPath?: string[]
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
  fieldId?: string
  fieldPath: string[]
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
    | 'q-audio-recorder'
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
