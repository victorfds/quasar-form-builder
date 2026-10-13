import type { FormKitAttributeValue, FormKitSchemaCondition, FormKitSchemaProps } from '@formkit/core'
import type { QfbConditionalRule } from './conditions'
import type { MatrixColumnConfig, MatrixColumnType, MatrixOption, MatrixRowConfig, MatrixRowsMode, MatrixSize, MatrixViewMode } from './matrix'

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

export interface ColumnsType {
  container?: number | null
  default?: { container: number } | null
  sm?: { container: number } | null
  lg?: { container: number } | null
}

export interface StructureCell {
  fieldId?: string
  name: string
  label?: string
  row?: string
  column?: string
  children?: QfbSchemaField[]
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
