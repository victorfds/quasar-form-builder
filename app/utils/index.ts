import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'
import { fieldTypes } from "~/constants"
import { ComponentsTypes } from "~/types"

export function nameExists(name: string, array: Array<FormKitSchemaDefinition>) {
  return array.some(el => el.name === name)
}

export function generateUniqueName(
  name: string,
  formFields: Array<FormKitSchemaDefinition>,
): string {
  const formLength = formFields.length

  return [...new Array(formLength + 1).keys()]
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

export function hasOnlyOneKeyWithName(obj: Record<string, any>, keyName: string): boolean {
  const keys = Object.keys(obj)
  return keys.length === 1 && keys[0] === keyName
}

export function contains(input: string | number | any[], value: string | number): boolean {
  if (input === undefined || input === null || value === undefined || value === null) return false

  // Handle arrays
  if (Array.isArray(input)) {
    return input.includes(value)
  }

  // Handle strings
  if (typeof input === 'string') {
    return input.includes(String(value)) // Check if the string representation of `value` is in `input`
  }

  // Handle numbers
  if (typeof input === 'number') {
    if (typeof value === 'number') {
      return input === value // Exact match
    }
    return String(input).includes(String(value)) // Check if `value` as a string is part of `input`
  }

  return false
}

export function getTypesBasedOnFieldType(fieldType: ComponentsTypes): { label: string, value: string }[] {
  if (!fieldType) return []

  return fieldTypes[fieldType] || []
}

export function getLengthLimitsFromValidation(
  validationString: string,
  startsWith: string
): { min?: number | string, max?: number | string, exact?: number | string } {
  if (!validationString) return { min: '', max: '', exact: '' }

  const rule = validationString.split("|").find((rule) => rule.startsWith(`${startsWith}:`))

  if (rule) {
    const [min, max] = rule.replace(`${startsWith}:`, "").split(",").map(Number)
    if (min === max) {
      return { min: '', max: '', exact: `${min}:${max}` }
    }
    return { min, max, exact: '' }
  }

  return { min: '', max: '', exact: '' }
}
