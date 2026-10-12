import { v4 as uuidv4 } from 'uuid'
import { rewriteQfbConditions, validateQfbConditions } from './expressions'

export type QfbSchemaRecord = Record<string, any>
export type QfbIdentifiedSchema<T extends readonly unknown[]> = Array<T[number] & QfbSchemaRecord>
export interface QfbSchemaDiagnostic {
  code: string
  message: string
  path: string[]
  fieldId?: string
}
export class QfbSchemaError extends Error {
  constructor(public diagnostics: QfbSchemaDiagnostic[]) {
    super(diagnostics.map(item => item.message).join('; '))
    this.name = 'QfbSchemaError'
  }
}

export function createQfbId(): string {
  return uuidv4()
}

function cloneSchema<T extends readonly unknown[]>(value: T): QfbIdentifiedSchema<T> {
  return JSON.parse(JSON.stringify(value)) as QfbIdentifiedSchema<T>
}

export function walkQfbSchema(
  fields: readonly unknown[],
  visit: (field: QfbSchemaRecord, path: string[]) => void,
  path: string[] = [],
): void {
  fields.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return
    const field = item as QfbSchemaRecord
    const location = [...path, String(index)]
    visit(field, location)
    for (const key of ['children', 'steps', 'tabs', 'cells']) {
      if (Array.isArray(field[key])) walkQfbSchema(field[key], visit, [...location, key])
    }
    if (!Array.isArray(field.children) && Array.isArray(field.structureChildren)) {
      walkQfbSchema(field.structureChildren, visit, [...location, 'structureChildren'])
    }
  })
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
        if (ids.has(field.fieldId))
          diagnostics.push({ code: 'duplicate-id', message: `Duplicate field identity: ${field.name || path.join('.')}`, path })
        ids.add(field.fieldId)
      }
    }
    if ((field.$formkit || field.$el) && field.name) {
      if (['__proto__', 'constructor', 'prototype'].includes(field.name))
        diagnostics.push({ code: 'invalid-name', message: `Reserved field name: ${field.name}`, path })
      if (names.has(field.name))
        diagnostics.push({ code: 'duplicate-name', message: `Duplicate field name: ${field.name}`, path })
      names.add(field.name)
    }
  })
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
  if (errors.length) throw new QfbSchemaError(errors)
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
    if (field.fieldId === fieldId) target = field
  })
  if (!target) throw new QfbSchemaError([{ code: 'missing-field', message: 'Field identity was not found', path: [] }])
  const oldName = target.name
  target.name = newName
  rewriteQfbConditions(copy, { [oldName]: newName }, fields)
  const errors = [...validateQfbSchema(copy), ...validateQfbConditions(copy)]
  if (errors.length) throw new QfbSchemaError(errors)
  return copy as QfbIdentifiedSchema<T>
}
