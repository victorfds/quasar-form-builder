import type { Expression } from 'jsep'
import type { QfbSchemaField } from '../types'
import type { QfbSchemaDiagnostic } from './schemaIdentity'
import { compile } from '@formkit/core'
import jsep from 'jsep'
import { extractFormData } from './formData'
import { walkQfbSchema } from './schemaIdentity'

const helpers = new Set([
  'empty',
  'eq',
  'contains',
  'startsWith',
  'endsWith',
  'isToday',
  'isTomorrow',
  'isYesterday',
  'isDayAfterTomorrow',
  'isDayBeforeYesterday',
  'get',
])
const binaryOperators = new Set(['&&', '||', '==', '!=', '===', '!==', '>', '>=', '<', '<=', '+', '-', '*', '/', '%'])

function printExpression(
  node: Expression,
  map: Record<string, string>,
  references: Set<string>,
  callee = false,
  domainPaths: string[][] = [],
): string {
  const item = node as Expression & Record<string, any>
  switch (item.type) {
    case 'Literal':
      return item.raw ?? JSON.stringify(item.value)
    case 'Identifier': {
      if (!item.name.startsWith('$')) throw new Error(`Unsupported expression identifier: ${item.name}`)
      const name = item.name.slice(1)
      if (!callee) references.add(name)
      else if (!helpers.has(name)) throw new Error(`Unsupported condition function: ${name}`)
      return `$${callee ? name : map[name] || name}`
    }
    case 'MemberExpression': {
      if (item.computed) throw new Error('Computed condition references are not supported')
      const parts: string[] = []
      let member = item
      while (member.type === 'MemberExpression' && !member.computed) {
        parts.unshift(member.property.name)
        member = member.object
      }
      if (member.type === 'Identifier' && member.name.startsWith('$')) {
        parts.unshift(member.name.slice(1))
        references.add(parts[0]!)
        const declared = domainPaths
          .filter(path => path.length <= parts.length && path.every((segment, index) => segment === parts[index]))
          .sort((a, b) => b.length - a.length)[0]
        declared?.forEach(name => references.add(name))
        return `$${parts.map((segment, index) => (index === 0 || (declared && index < declared.length) ? map[segment] || segment : segment)).join('.')}`
      }
      const object = printExpression(item.object, map, references, false, domainPaths)
      return `${object}.${item.property.name}`
    }
    case 'CallExpression':
      return `${printExpression(item.callee, map, references, true, domainPaths)}(${item.arguments.map((arg: Expression) => printExpression(arg, map, references, false, domainPaths)).join(',')})`
    case 'UnaryExpression': {
      const argument = printExpression(item.argument, map, references, false, domainPaths)
      if (item.operator === '!') return `(${argument} == false)`
      if (item.operator === '-' && item.argument.type === 'Literal') return `-${argument}`
      throw new Error(`Unsupported condition operator: ${item.operator}`)
    }
    case 'BinaryExpression':
      if (!binaryOperators.has(item.operator)) throw new Error(`Unsupported condition operator: ${item.operator}`)
      return `(${printExpression(item.left, map, references, false, domainPaths)} ${item.operator} ${printExpression(item.right, map, references, false, domainPaths)})`
    default:
      throw new Error(`Unsupported condition expression: ${item.type}`)
  }
}

export function transformQfbExpression(
  expression: string,
  map: Record<string, string> = {},
  domainPaths: string[][] = [],
): { expression: string, references: string[] } {
  const references = new Set<string>()
  const transformed = printExpression(jsep(expression.replace(/^\$:\s*/, '')), map, references, false, domainPaths)
  compile(transformed)
  return { expression: transformed, references: [...references] }
}

function eachCondition(
  value: unknown,
  visit: (record: Record<string, any>, key: string, path: string[], owner?: Record<string, any>, property?: string) => void,
  path: string[] = [],
): void {
  function inspect(record: Record<string, any>, location: string[]) {
    if (typeof record.if === 'string' && record.if.trim()) visit(record, 'if', [...location, 'if'])
    for (const property of ['validation', 'disable', 'disabled', 'readonly']) {
      const rule = record[property]
      if (rule && typeof rule === 'object' && typeof rule.if === 'string' && rule.if.trim())
        visit(rule, 'if', [...location, property, 'if'], record, property)
    }
    if (record.attrs && typeof record.attrs === 'object') {
      for (const property of ['validation', 'disable', 'disabled', 'readonly']) {
        const rule = record.attrs[property]
        if (rule && typeof rule === 'object' && typeof rule.if === 'string' && rule.if.trim())
          visit(rule, 'if', [...location, 'attrs', property, 'if'], record.attrs, property)
      }
    }
  }
  walkQfbSchema(
    Array.isArray(value) ? value : [value],
    (record, location) => {
      inspect(record, location)
      for (const property of ['rows', 'columnsConfig']) {
        if (Array.isArray(record[property])) {
          record[property].forEach((item: unknown, index: number) => {
            if (item && typeof item === 'object')
              inspect(item as Record<string, any>, [...location, property, String(index)])
          })
        }
      }
    },
    path,
  )
}

export function rewriteQfbConditions(
  fields: unknown,
  map: Record<string, string>,
  sourceFields: readonly unknown[] = Array.isArray(fields) ? fields : [],
): void {
  const paths = extractFormData(sourceFields as QfbSchemaField[])
    .flatItems
    .map(item => item.fieldPath || [])
    .filter(path => path.length)
  eachCondition(fields, (record, key) => {
    record[key] = transformQfbExpression(record[key], map, paths).expression
  })
}

export function removeQfbConditionsReferencing(fields: QfbSchemaField[], name: string): void {
  const paths = extractFormData(fields).flatItems.map(item => item.fieldPath || []).filter(path => path.length)
  eachCondition(fields, (record, key, _path, owner, property) => {
    // Invalid expressions remain visible as diagnostics; never guess from text substrings.
    let references: string[]
    try {
      references = transformQfbExpression(record[key], {}, paths).references
    }
    catch {
      return
    }
    if (!references.includes(name)) return
    if (owner && property) {
      if ('else' in record) owner[property] = record.else
      else delete owner[property]
    }
    else if (key === 'if' && 'then' in record) {
      record.if = '$: false'
    }
    else {
      delete record[key]
    }
  })
}

export function normalizeQfbConditions<T>(schema: T): T {
  function cloneRuntimeValue<V>(value: V): V {
    if (Array.isArray(value)) return value.map(cloneRuntimeValue) as V
    if (value && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value))) {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cloneRuntimeValue(child)])) as V
    }
    return value
  }
  const copy = cloneRuntimeValue(schema)
  eachCondition(copy, (record, key) => {
    // Normalize legacy negation only; otherwise keep the original FormKit expression grammar.
    if (record[key].includes('!$empty(')) record[key] = transformQfbExpression(record[key]).expression
  })
  return copy
}

export function validateQfbConditions(fields: unknown): QfbSchemaDiagnostic[] {
  const names = new Set<string>()
  walkQfbSchema(Array.isArray(fields) ? fields : [fields], (record) => {
    if (record.name) names.add(record.name)
  })
  const errors: QfbSchemaDiagnostic[] = []
  eachCondition(fields, (record, key, path) => {
    try {
      const { references } = transformQfbExpression(record[key])
      for (const name of references) {
        if (!names.has(name)) throw new Error(`Unresolved condition field: ${name}`)
      }
    }
    catch (error) {
      errors.push({ code: 'invalid-condition', message: error instanceof Error ? error.message : String(error), path })
    }
  })
  return errors
}
