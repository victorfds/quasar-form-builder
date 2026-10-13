import type { QfbSchemaField } from '../../types'
import { fieldTypes } from '#qfb/constants'
import { createQfbSchemaError } from '../../utils/schemaIdentity'
import { normalizeQfbStructureAliases } from '../../utils/schemaStructure'

export * from './conditionOperators'

export function nameExists(name: string, array: Array<QfbSchemaField>) {
  return array.some(el => el.name === name)
}

export function generateUniqueName(
  name: string,
  formFields: Array<QfbSchemaField>,
): string {
  const formLength = formFields.length

  return Array.from({ length: formLength + 1 }, (_, counter) => counter)
    .map(counter => (counter === 0 ? name : `${name}_${counter}`))
    .find(uniqueName => !nameExists(uniqueName, formFields)) || name
}

export function isEmptyObject(value: any): boolean {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.keys(value).length === 0
  )
}

export function firstFilledArray<T>(...values: unknown[]): T[] {
  const arrays = values.filter(Array.isArray) as T[][]
  return arrays.find(value => value.length > 0) || arrays[0] || []
}

export function withStructureChildrenForRender<T extends QfbSchemaField>(field: T): T {
  if (!field || typeof field !== 'object') return field

  const normalized = normalizeQfbStructureAliases([field])
  const ambiguous = normalized.issues.filter(issue => issue.code === 'AMBIGUOUS_SCHEMA_CHILDREN')
  if (ambiguous.length) throw createQfbSchemaError(ambiguous.map(issue => ({ code: issue.code, message: 'Ambiguous schema children', path: issue.schemaPath })))
  const clone: any = normalized.schema[0]
  const normalizeChildren = (children?: unknown) => Array.isArray(children)
    ? children.map(child => withStructureChildrenForRender(child as QfbSchemaField))
    : []

  if (Array.isArray(clone.children)) {
    clone.children = normalizeChildren(clone.children)
    if (['q-container', 'q-list-structure', 'q-grid'].includes(String(clone.$formkit || ''))) {
      clone.structureChildren = clone.children
    }
  }

  if (Array.isArray(clone.tabs)) {
    clone.tabs = clone.tabs.map((tab: any) => ({
      ...tab,
      children: normalizeChildren(tab.children),
    }))
  }

  if (Array.isArray(clone.steps)) {
    clone.steps = clone.steps.map((step: any) => ({
      ...step,
      children: normalizeChildren(step.children),
    }))
  }

  if (Array.isArray(clone.cells)) {
    clone.cells = clone.cells.map((cell: any) => ({
      ...cell,
      children: normalizeChildren(cell.children),
    }))
  }

  return clone
}

export function withStructureChildrenListForRender<T extends QfbSchemaField>(fields: T[]): T[] {
  return fields.map(field => withStructureChildrenForRender(field))
}

export function hasOnlyOneKeyWithName(obj: Record<string, any>, keyName: string): boolean {
  const keys = Object.keys(obj)
  return keys.length === 1 && keys[0] === keyName
}

export function getTypesBasedOnFieldType(fieldType?: string): { label: string, value: string }[] {
  if (!fieldType) return []

  return fieldTypes[fieldType] || []
}

export function getLengthLimitsFromValidation(
  validation: string | { if: string, then: string, else?: string } | undefined,
  startsWith: string,
): { min?: number | string, max?: number | string, exact?: number | string } {
  if (!validation) return { min: '', max: '', exact: '' }

  // Determine the validation rule to use based on the type of validation
  const validationRule = typeof validation === 'string'
    ? validation
    : validation.then

  // Find the specific rule that starts with the given prefix
  const rule = validationRule.split('|').find(rule => rule.startsWith(`${startsWith}:`))

  // If the rule is found, process it
  if (rule) {
    const extracted = rule.replace(`${startsWith}:`, '')

    if (startsWith !== 'length' && startsWith !== 'between') return { [startsWith]: extracted }

    // For length rules, extract the min and max values
    const [min, max] = extracted.split(',').map(Number)

    // If min and max are the same, return as exact length
    if (min === max) {
      return { min: '', max: '', exact: min }
    }

    // Otherwise, return the min and max values
    return { min, max, exact: '' }
  }

  // Return empty values if no matching rule is found
  return { min: '', max: '', exact: '' }
}
