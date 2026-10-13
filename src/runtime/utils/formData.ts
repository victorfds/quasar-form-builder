import type { ExtractedFormAnswer, ExtractedFormData, ExtractedFormItem, QfbSchemaField } from '../types'
import { empty, eq } from '@formkit/utils'
import { isDayAfterTomorrow, isDayBeforeYesterday, isToday, isTomorrow, isYesterday } from './dateLogic'
import { contains, endsWith, startsWith } from './logic'
import { walkQfbSchemaStructure } from './schemaStructure'

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

export interface QfbExtractOptions { fieldContexts?: Array<{ fieldId: string, fieldPath: string[] }> }

function expandValuePaths(template: string[], values: unknown, prefix: string[] = []): string[][] {
  if (!template.length) return [prefix]
  const [segment, ...remaining] = template
  if (segment === '*') {
    const list = getNestedValue(values, prefix)
    return Array.isArray(list) ? list.flatMap((_, index) => expandValuePaths(remaining, values, [...prefix, String(index)])) : []
  }
  return expandValuePaths(remaining, values, [...prefix, segment!])
}

export function extractFormData(formFields: QfbSchemaField[] = [], values: unknown = {}, options: QfbExtractOptions = {}): ExtractedFormData {
  const valuesByName: Record<string, unknown> = {}
  const answers: ExtractedFormAnswer[] = []
  const items: ExtractedFormItem[] = []
  const flatItems: ExtractedFormItem[] = []
  const contexts = new Map<string, string[][]>()
  for (const context of options.fieldContexts || []) {
    const key = context.fieldId.toLowerCase()
    const paths = contexts.get(key) || []
    if (!paths.some(path => JSON.stringify(path) === JSON.stringify(context.fieldPath))) paths.push(context.fieldPath)
    contexts.set(key, paths)
  }
  const ancestry: Array<{ schemaPath: string[], item: ExtractedFormItem }> = []
  walkQfbSchemaStructure(formFields, (field, position) => {
    const name = getFieldName(field)
    const label = getFieldLabel(field)
    const type = getFieldType(field)
    const fieldId = typeof field.fieldId === 'string' ? field.fieldId : undefined
    const concrete = position.role === 'input' && fieldId ? contexts.get(fieldId.toLowerCase()) : undefined
    const paths = concrete || expandValuePaths(position.valuePath, values)
    for (const valuePath of paths) {
      const parent = ancestry.filter(candidate => candidate.schemaPath.length < position.schemaPath.length
        && candidate.schemaPath.every((part, index) => part === position.schemaPath[index])
        && (candidate.item.fieldPath || []).every((part, index) => part === valuePath[index])).at(-1)
      const visualPath = [...(parent?.item.path || []), name || `${type}:${position.schemaPath.at(-1)}`]
      const value = name || position.role === 'input' ? getNestedValue(values, valuePath) : undefined
      const displayValue = stringifyDisplayValue(value)
      const kind = position.role === 'group' || position.role === 'list' ? 'structure' : position.role === 'input' ? 'field' : 'static'
      const item: ExtractedFormItem = { kind, name, label, type, path: visualPath, fieldId, fieldPath: valuePath, value, displayValue }
      if (kind !== 'field') item.children = []
      if (parent?.item.children) parent.item.children.push(item)
      else items.push(item)
      flatItems.push(item)
      ancestry.push({ schemaPath: position.schemaPath, item })
      if (kind === 'field' && name) {
        valuesByName[name] = value
        answers.push({ name, label, type, path: visualPath, value, displayValue, fieldId, fieldPath: valuePath })
      }
    }
  })
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
