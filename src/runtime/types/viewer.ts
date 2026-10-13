import type { FormKitNode } from '@formkit/core'

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

export interface QfbFormFieldError {
  fieldPath: string[]
  messages: string[]
}
