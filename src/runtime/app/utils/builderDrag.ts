import type { FormKitSchemaDefinition, FormKitSchemaNode } from '@formkit/core'

const rootOnlyStructureTypes = new Set(['q-stepper', 'q-tabs'])
const builderDraggingClass = 'qfb-builder-dragging'

export const builderDragMime = {
  fieldName: 'application/x-builder-field',
  fieldType: 'application/x-builder-field-type',
  rootOnly: 'application/x-builder-root-only',
} as const

export function getBuilderSchemaType(schema?: FormKitSchemaDefinition | FormKitSchemaNode | Record<string, unknown> | null) {
  return typeof schema?.$formkit === 'string' ? schema.$formkit : ''
}

export function isRootOnlyBuilderType(type?: string | null) {
  return rootOnlyStructureTypes.has(String(type || ''))
}

export function markBuilderDragType(dataTransfer: DataTransfer | null | undefined, schema?: FormKitSchemaDefinition | FormKitSchemaNode | Record<string, unknown> | null) {
  markBuilderDragActive()

  if (!dataTransfer) return

  const type = getBuilderSchemaType(schema)
  if (!type) return

  dataTransfer.setData(builderDragMime.fieldType, type)

  if (isRootOnlyBuilderType(type)) {
    dataTransfer.setData(builderDragMime.rootOnly, 'true')
  }
}

export function markBuilderDragActive() {
  if (typeof document === 'undefined') return
  document.body.classList.add(builderDraggingClass)
}

export function clearBuilderDragActive() {
  if (typeof document === 'undefined') return
  document.body.classList.remove(builderDraggingClass)
}

export function getBuilderDragFormKitType(dataTransfer: DataTransfer | null | undefined) {
  if (!dataTransfer) return ''

  const markedType = dataTransfer.getData(builderDragMime.fieldType)
  if (markedType) return markedType

  const schemaData = dataTransfer.getData('text')
  if (!schemaData) return ''

  try {
    const schema = JSON.parse(schemaData)
    return getBuilderSchemaType(schema)
  }
  catch {
    return ''
  }
}

export function hasRootOnlyBuilderDrag(dataTransfer: DataTransfer | null | undefined) {
  if (!dataTransfer) return false

  const types = Array.from(dataTransfer.types || [])
  if (types.includes(builderDragMime.rootOnly)) return true

  return isRootOnlyBuilderType(getBuilderDragFormKitType(dataTransfer))
}
