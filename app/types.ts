export interface ElementType {
  type: string
  inputType?: string
  label?: string
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

export interface ColumnsType { container?: number | null, default?: { container: number } | null, sm?: { container: number } | null, lg?: { container: number } | null }

export type FormViewportType = 'default' | 'sm' | 'lg'
