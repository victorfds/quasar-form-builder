import type { FormKitSchemaDefinition } from '@formkit/core'
import type { ExtractedFormAnswer, ExtractedFormData, ExtractedFormItem, StructureCell } from '#qfb/types'
import { empty, eq } from '@formkit/utils'
import { isDayAfterTomorrow, isDayBeforeYesterday, isToday, isTomorrow, isYesterday } from '#qfb/utils/dateLogic'
import { contains, endsWith, startsWith } from '#qfb/utils/logic'

const structureTypes = new Set(['q-container', 'q-list-structure', 'q-grid', 'q-table-structure', 'q-tabs', 'q-stepper'])
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

function getFieldName(field: FormKitSchemaDefinition): string {
  return typeof field.name === 'string' ? field.name : ''
}

function getFieldLabel(field: FormKitSchemaDefinition): string {
  const label = typeof field.label === 'string' ? field.label : ''
  const children = typeof field.children === 'string' ? field.children : ''
  return label || children || getFieldName(field)
}

function getFieldType(field: FormKitSchemaDefinition): string {
  if (typeof field.$formkit === 'string') return field.$formkit
  if (typeof field.$el === 'string') return field.$el
  return 'element'
}

function isStructure(field: FormKitSchemaDefinition): boolean {
  return structureTypes.has(String(field.$formkit || ''))
}

function isStaticItem(field: FormKitSchemaDefinition): boolean {
  return Boolean(field.$el) || noAnswerTypes.has(String(field.$formkit || ''))
}

function getChildContextValue(parentValue: unknown, childName: string, childIndex: number): unknown {
  if (isRecord(parentValue) && Object.hasOwn(parentValue, childName)) {
    return parentValue[childName]
  }
  if (Array.isArray(parentValue)) return parentValue[childIndex]
  return undefined
}

function pushFlatItems(item: ExtractedFormItem, flatItems: ExtractedFormItem[]): void {
  flatItems.push(item)
  item.children?.forEach(child => pushFlatItems(child, flatItems))
}

function extractFields(
  fields: FormKitSchemaDefinition[],
  values: unknown,
  path: string[],
  valuesByName: Record<string, unknown>,
  answers: ExtractedFormAnswer[],
): ExtractedFormItem[] {
  return fields.map((field, index) => extractField(field, values, path, index, valuesByName, answers))
}

function extractStructureChildren(
  field: FormKitSchemaDefinition,
  fieldValue: unknown,
  fieldPath: string[],
  valuesByName: Record<string, unknown>,
  answers: ExtractedFormAnswer[],
): ExtractedFormItem[] {
  if (Array.isArray(field.steps)) {
    return field.steps.flatMap((step: any) =>
      extractFields(step.children || [], getNestedValue(fieldValue, [step.name]) ?? fieldValue, [...fieldPath, step.name], valuesByName, answers),
    )
  }

  if (Array.isArray(field.tabs)) {
    return field.tabs.flatMap((tab: any) =>
      extractFields(tab.children || [], getNestedValue(fieldValue, [tab.name]) ?? fieldValue, [...fieldPath, tab.name], valuesByName, answers),
    )
  }

  if (Array.isArray(field.cells)) {
    return (field.cells as StructureCell[]).flatMap(cell =>
      extractFields(cell.children || [], fieldValue, [...fieldPath, cell.name], valuesByName, answers),
    )
  }

  const children = Array.isArray(field.children) ? field.children as FormKitSchemaDefinition[] : []
  return extractFields(children, fieldValue, fieldPath, valuesByName, answers)
}

function extractField(
  field: FormKitSchemaDefinition,
  values: unknown,
  parentPath: string[],
  index: number,
  valuesByName: Record<string, unknown>,
  answers: ExtractedFormAnswer[],
): ExtractedFormItem {
  const name = getFieldName(field)
  const label = getFieldLabel(field)
  const type = getFieldType(field)
  const fieldPath = name ? [...parentPath, name] : [...parentPath, `${type}:${index}`]
  const fieldValue = name ? getChildContextValue(values, name, index) : undefined

  if (isStructure(field)) {
    const children = extractStructureChildren(field, fieldValue ?? values, fieldPath, valuesByName, answers)
    return { kind: 'structure', name, label, type, path: fieldPath, children }
  }

  if (isStaticItem(field)) {
    return { kind: 'static', name, label, type, path: fieldPath, value: fieldValue, displayValue: stringifyDisplayValue(fieldValue) }
  }

  const displayValue = stringifyDisplayValue(fieldValue)
  const item: ExtractedFormItem = { kind: 'field', name, label, type, path: fieldPath, value: fieldValue, displayValue }
  if (name) {
    valuesByName[name] = fieldValue
    answers.push({ name, label, type, path: fieldPath, value: fieldValue, displayValue })
  }
  return item
}

export function extractFormData(formFields: FormKitSchemaDefinition[] = [], values: unknown = {}): ExtractedFormData {
  const valuesByName: Record<string, unknown> = {}
  const answers: ExtractedFormAnswer[] = []
  const items = extractFields(formFields, values, [], valuesByName, answers)
  const flatItems: ExtractedFormItem[] = []
  items.forEach(item => pushFlatItems(item, flatItems))
  return { items, flatItems, answers, valuesByName }
}

export function createFormSchemaData(formFields: FormKitSchemaDefinition[] = [], values: unknown = {}): Record<string, unknown> {
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
