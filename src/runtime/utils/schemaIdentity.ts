import { v4 as uuidv4 } from 'uuid'
import { rewriteQfbConditions, validateQfbConditions } from './schemaExpressions'
import { normalizeQfbStructureAliases, walkQfbSchemaStructure } from './schemaStructure'

export type QfbSchemaRecord = Record<string, any>
export type QfbIdentifiedSchema<T extends readonly unknown[]> = Array<T[number] & QfbSchemaRecord>
export interface QfbSchemaDiagnostic {
  code: string
  message: string
  path: string[]
  fieldId?: string
}
export interface QfbSchemaError extends Error { diagnostics: QfbSchemaDiagnostic[] }
interface SchemaErrorConstructor { new (diagnostics: QfbSchemaDiagnostic[]): QfbSchemaError, prototype: QfbSchemaError }
/** Compatibility constructor for 0.2.x consumers; prefer createQfbSchemaError. */
// The type and compatibility constructor intentionally share the public name.
// eslint-disable-next-line ts/no-redeclare
export const QfbSchemaError = function (diagnostics: QfbSchemaDiagnostic[]): QfbSchemaError {
  const error = Object.assign(new Error(diagnostics.map(item => item.message).join('; ')), { name: 'QfbSchemaError', diagnostics })
  Object.setPrototypeOf(error, QfbSchemaError.prototype)
  return error
} as unknown as SchemaErrorConstructor
QfbSchemaError.prototype = Object.create(Error.prototype, { constructor: { value: QfbSchemaError, writable: true, configurable: true } })

export function createQfbSchemaError(diagnostics: QfbSchemaDiagnostic[]): QfbSchemaError {
  return new QfbSchemaError(diagnostics)
}
export function isQfbSchemaError(value: unknown): value is QfbSchemaError {
  return value instanceof Error && value.name === 'QfbSchemaError' && 'diagnostics' in value
}

export function createQfbId(): string {
  return uuidv4()
}

function cloneSchema<T extends readonly unknown[]>(value: T): QfbIdentifiedSchema<T> {
  const normalized = normalizeQfbStructureAliases(value)
  const ambiguous = normalized.issues.filter(issue => issue.code === 'AMBIGUOUS_SCHEMA_CHILDREN')
  if (ambiguous.length) throw createQfbSchemaError(ambiguous.map(issue => ({ code: issue.code, message: 'Ambiguous schema children', path: issue.schemaPath, fieldId: issue.fieldId })))
  return normalized.schema as QfbIdentifiedSchema<T>
}

export function walkQfbSchema(fields: readonly unknown[], visit: (field: QfbSchemaRecord, path: string[]) => void, path: string[] = []): void {
  walkQfbSchemaStructure(fields, (field, position) => visit(field, [...path, ...position.schemaPath]))
}

export function validateQfbSchema(fields: readonly unknown[], requireIds = true): QfbSchemaDiagnostic[] {
  const diagnostics: QfbSchemaDiagnostic[] = []
  const ids = new Set<string>()
  const names = new Set<string>()
  walkQfbSchema(fields, (field, path) => {
    if (field.name || field.$formkit) {
      if (!field.fieldId && requireIds)
        diagnostics.push({ code: 'missing-id', message: `Missing fieldId: ${field.name || path.join('.')}`, path })
      if (field.fieldId) {
        if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(field.fieldId))
          diagnostics.push({ code: 'invalid-id', message: `Invalid fieldId: ${field.name}`, path })
        if (ids.has(String(field.fieldId).toLowerCase()))
          diagnostics.push({ code: 'duplicate-id', message: `Duplicate field identity: ${field.name || path.join('.')}`, path })
        ids.add(String(field.fieldId).toLowerCase())
      }
    }
    if ((field.$formkit || field.$el) && field.name) {
      if (['__proto__', 'constructor', 'prototype', '*'].includes(field.name))
        diagnostics.push({ code: 'invalid-name', message: `Reserved field name: ${field.name}`, path })
      if (names.has(field.name))
        diagnostics.push({ code: 'duplicate-name', message: `Duplicate field name: ${field.name}`, path })
      names.add(field.name)
    }
  })
  const issues: import('./schemaStructure').QfbStructureIssue[] = []
  const collectorPaths = new Set<string>()
  walkQfbSchemaStructure(fields, (field, position) => {
    if (position.role === 'layout') return
    const key = JSON.stringify(position.valuePath)
    if (collectorPaths.has(key)) diagnostics.push({ code: 'AMBIGUOUS_FIELD_PATH', message: 'Multiple definitions collect the same value address', path: position.schemaPath, fieldId: field.fieldId })
    collectorPaths.add(key)
  }, issues)
  diagnostics.push(...issues.filter(issue => issue.code === 'AMBIGUOUS_SCHEMA_CHILDREN').map(issue => ({ code: issue.code, message: 'Ambiguous schema children', path: issue.schemaPath, fieldId: issue.fieldId })))
  return diagnostics
}

export function adoptQfbSchema<T extends readonly unknown[]>(
  fields: T,
  options: { idFactory?: () => string } = {},
): { fields: QfbIdentifiedSchema<T>, changed: boolean } {
  const copy = cloneSchema(fields)
  let changed = false
  walkQfbSchema(copy, (field) => {
    if ((field.name || field.$formkit) && !field.fieldId) {
      field.fieldId = (options.idFactory || createQfbId)()
      changed = true
    }
  })
  const errors = validateQfbSchema(copy)
  if (errors.length) throw createQfbSchemaError(errors)
  return { fields: copy as QfbIdentifiedSchema<T>, changed }
}

export function cloneQfbSchemaAsTemplate<T extends readonly unknown[]>(fields: T): QfbIdentifiedSchema<T> {
  const copy = cloneSchema(fields)
  walkQfbSchema(copy, (field) => {
    if (field.name || field.$formkit) field.fieldId = createQfbId()
  })
  return copy as QfbIdentifiedSchema<T>
}

export function duplicateQfbSchema<T extends readonly unknown[]>(
  fields: T,
  usedNames: Iterable<string> = [],
): { fields: QfbIdentifiedSchema<T>, nameMap: Record<string, string>, fieldIdMap: Record<string, string> } {
  const copy = cloneSchema(fields)
  const used = new Set(usedNames)
  const nameMap: Record<string, string> = {}
  const fieldIdMap: Record<string, string> = {}
  walkQfbSchema(copy, (field) => {
    if (!field.name && !field.$formkit) return
    const previousId = field.fieldId
    field.fieldId = createQfbId()
    if (previousId) fieldIdMap[previousId] = field.fieldId
    if ((field.$formkit || field.$el) && field.name) {
      const original = field.name
      const base = original.replace(/_\d+$/, '')
      let next = used.has(original) ? base : original
      let suffix = 1
      while (used.has(next)) next = `${base}_${suffix++}`
      used.add(next)
      field.name = next
      nameMap[original] = next
    }
  })
  rewriteQfbConditions(copy, nameMap, fields)
  return { fields: copy as QfbIdentifiedSchema<T>, nameMap, fieldIdMap }
}

export function renameQfbField<T extends readonly unknown[]>(
  fields: T,
  fieldId: string,
  newName: string,
): QfbIdentifiedSchema<T> {
  const copy = cloneSchema(fields)
  let target: QfbSchemaRecord | undefined
  walkQfbSchema(copy, (field) => {
    if (String(field.fieldId).toLowerCase() === fieldId.toLowerCase()) target = field
  })
  if (!target) throw createQfbSchemaError([{ code: 'missing-field', message: 'Field identity was not found', path: [] }])
  const oldName = target.name
  target.name = newName
  rewriteQfbConditions(copy, { [oldName]: newName }, fields)
  const errors = [...validateQfbSchema(copy), ...validateQfbConditions(copy)]
  if (errors.length) throw createQfbSchemaError(errors)
  return copy as QfbIdentifiedSchema<T>
}
