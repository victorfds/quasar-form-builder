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
