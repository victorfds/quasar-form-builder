import type { FormKitSchemaNode } from '@formkit/core'

export function nameExists(name: string, array: Array<{ name: string } & Record<string, any>>) { return array.some(el => el.name === name) }

export function generateUniqueName(
  name: string,
  formFields: Array<FormKitSchemaNode>,
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
