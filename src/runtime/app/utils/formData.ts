import type { ExtractedFormAnswer, ExtractedFormData, ExtractedFormItem, QfbSchemaField, StructureCell } from '../types'
import { empty, eq } from '@formkit/utils'
import { isDayAfterTomorrow, isDayBeforeYesterday, isToday, isTomorrow, isYesterday } from './dateLogic'
import { contains, endsWith, startsWith } from './logic'

const structureTypes = new Set(['group', 'list', 'form', 'q-container', 'q-list-structure', 'q-grid', 'q-table-structure', 'q-tabs', 'q-stepper'])
const noAnswerTypes = new Set(['q-btn', 'q-separator'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringifyDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(stringifyDisplayValue).filter(Boolean).join(', ')
  return JSON.stringify(value)
}

function getNestedValue(source: unknown, path: string[]): unknown {
  if (!path.length) return source
  let current: unknown = source
  for (const segment of path) {
    if (!isRecord(current) && !Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function assignValueAliases(target: Record<string, unknown>, value: unknown, path: string[] = []): void {
  if (typeof value === 'function') return

  if (path.length && !isRecord(value) && !Array.isArray(value)) {
    target[path.join('.')] = value
    target[path.at(-1)!] ??= value
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assignValueAliases(target, item, [...path, String(index)]))
    return
  }

  if (!isRecord(value)) return

  Object.entries(value).forEach(([key, child]) => {
    if (typeof child === 'function') return
    assignValueAliases(target, child, [...path, key])
  })
}

function getFieldName(field: Record<string, any>): string {
  return typeof field.name === 'string' ? field.name : ''
}

function getFieldLabel(field: Record<string, any>): string {
  const label = typeof field.label === 'string' ? field.label : ''
  const children = typeof field.children === 'string' ? field.children : ''
  return label || children || getFieldName(field)
}

function getFieldType(field: Record<string, any>): string {
  if (typeof field.$formkit === 'string') return field.$formkit
  if (typeof field.$el === 'string') return field.$el
  return 'element'
}

function isStructure(field: Record<string, any>): boolean {
  return structureTypes.has(String(field.$formkit || ''))
}

function isStaticItem(field: Record<string, any>): boolean {
  return Boolean(field.$el) || noAnswerTypes.has(String(field.$formkit || ''))
}

function pushFlatItems(item: ExtractedFormItem, flatItems: ExtractedFormItem[]): void {
  flatItems.push(item)
  item.children?.forEach(child => pushFlatItems(child, flatItems))
}

function extractFields(
  fields: QfbSchemaField[],
  values: unknown,
  path: string[],
  valuesByName: Record<string, unknown>,
  answers: ExtractedFormAnswer[],
  valuePath: string[] = [],
  rootValues: unknown = values,
  contexts: Map<string, string[]> = new Map(),
): ExtractedFormItem[] {
  return fields.map((field, index) => extractField(field, values, path, index, valuesByName, answers, valuePath, rootValues, contexts))
}

function extractStructureChildren(
  field: Record<string, any>,
  fieldValue: unknown,
  fieldPath: string[],
  valuesByName: Record<string, unknown>,
  answers: ExtractedFormAnswer[],
  valuePath: string[],
  rootValues: unknown,
  contexts: Map<string, string[]>,
): ExtractedFormItem[] {
  if (Array.isArray(field.steps)) {
    return field.steps.flatMap((step: any) =>
      extractFields(step.children || [], getNestedValue(fieldValue, [step.name]), [...fieldPath, step.name], valuesByName, answers, [...valuePath, step.name], rootValues, contexts),
    )
  }

  if (Array.isArray(field.tabs)) {
    return field.tabs.flatMap((tab: any) =>
      extractFields(tab.children || [], fieldValue, [...fieldPath, tab.name], valuesByName, answers, valuePath, rootValues, contexts),
    )
  }

  if (Array.isArray(field.cells)) {
    return (field.cells as StructureCell[]).flatMap(cell =>
      extractFields(cell.children || [], fieldValue, [...fieldPath, cell.name], valuesByName, answers, valuePath, rootValues, contexts),
    )
  }

  const children = Array.isArray(field.children) ? field.children as QfbSchemaField[] : Array.isArray(field.structureChildren) ? field.structureChildren as QfbSchemaField[] : []
  return extractFields(children, fieldValue, fieldPath, valuesByName, answers, valuePath, rootValues, contexts)
}

function extractField(
  definition: QfbSchemaField,
  values: unknown,
  parentPath: string[],
  index: number,
  valuesByName: Record<string, unknown>,
  answers: ExtractedFormAnswer[],
  parentValuePath: string[],
  rootValues: unknown,
  contexts: Map<string, string[]>,
): ExtractedFormItem {
  const field = definition && typeof definition === 'object' && !Array.isArray(definition) ? definition as Record<string, any> : { $el: 'span', children: String(definition ?? '') }
  const name = getFieldName(field)
  const label = getFieldLabel(field)
  const type = getFieldType(field)
  const fieldPath = name ? [...parentPath, name] : [...parentPath, `${type}:${index}`]
  const valuePath = contexts.get(String(field.fieldId || '')) || (name ? [...parentValuePath, Array.isArray(values) ? String(index) : name] : parentValuePath)
  const fieldValue = name ? getNestedValue(rootValues, valuePath) : undefined
  const metadata = { fieldId: typeof field.fieldId === 'string' ? field.fieldId : undefined, fieldPath: valuePath }

  if (isStructure(field)) {
    const children = extractStructureChildren(field, fieldValue, fieldPath, valuesByName, answers, valuePath, rootValues, contexts)
    return { kind: 'structure', name, label, type, path: fieldPath, children, ...metadata }
  }

  if (isStaticItem(field)) {
    const children = Array.isArray(field.children) ? extractFields(field.children as QfbSchemaField[], values, fieldPath, valuesByName, answers, parentValuePath, rootValues, contexts) : undefined
    return { kind: 'static', name, label, type, path: fieldPath, value: fieldValue, displayValue: stringifyDisplayValue(fieldValue), children, ...metadata, fieldPath: parentValuePath }
  }

  const displayValue = stringifyDisplayValue(fieldValue)
  const item: ExtractedFormItem = { kind: 'field', name, label, type, path: fieldPath, value: fieldValue, displayValue, ...metadata }
  if (name) {
    valuesByName[name] = fieldValue
    answers.push({ name, label, type, path: fieldPath, value: fieldValue, displayValue, ...metadata })
  }
  return item
}

export interface QfbExtractOptions { fieldContexts?: Array<{ fieldId: string, fieldPath: string[] }> }

export function extractFormData(formFields: QfbSchemaField[] = [], values: unknown = {}, options: QfbExtractOptions = {}): ExtractedFormData {
  const valuesByName: Record<string, unknown> = {}
  const answers: ExtractedFormAnswer[] = []
  const contexts = new Map(options.fieldContexts?.map(field => [field.fieldId, field.fieldPath]))
  const items = extractFields(formFields, values, [], valuesByName, answers, [], values, contexts)
  const flatItems: ExtractedFormItem[] = []
  items.forEach(item => pushFlatItems(item, flatItems))
  return { items, flatItems, answers, valuesByName }
}

export function createFormSchemaData(formFields: QfbSchemaField[] = [], values: unknown = {}): Record<string, unknown> {
  const valueAliases: Record<string, unknown> = {}
  assignValueAliases(valueAliases, values)
  const extracted = extractFormData(formFields, values)

  return {
    ...(isRecord(values) ? values : {}),
    ...valueAliases,
    ...extracted.valuesByName,
    empty,
    eq,
    contains,
    startsWith,
    endsWith,
    isToday,
    isTomorrow,
    isYesterday,
    isDayAfterTomorrow,
    isDayBeforeYesterday,
  }
}
