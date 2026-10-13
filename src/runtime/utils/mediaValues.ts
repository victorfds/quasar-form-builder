import type { QfbMediaFieldContext, QfbMediaScope, QfbMediaValue } from '../types/media'
import { baseMimeType } from './mediaPolicy'

const blockedSegments = new Set(['__proto__', 'constructor', 'prototype'])
export function isQfbMediaValue(value: unknown): value is QfbMediaValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  return (
    item.version === 1
    && typeof item.clientId === 'string'
    && Boolean(item.clientId)
    && typeof item.name === 'string'
    && Boolean(item.name)
    && typeof item.mimeType === 'string'
    && Boolean(item.mimeType)
    && typeof item.size === 'number'
    && Number.isFinite(item.size)
    && item.size >= 0
    && (item.documentId === undefined || (typeof item.documentId === 'string' && Boolean(item.documentId)))
    && (item.durationMs === undefined
      || (typeof item.durationMs === 'number' && Number.isFinite(item.durationMs) && item.durationMs >= 0))
  )
}

export function mediaValues(value: unknown): QfbMediaValue[] {
  return (Array.isArray(value) ? value : [value]).filter(isQfbMediaValue)
}

export function copyMediaValue(value: QfbMediaValue): QfbMediaValue {
  return {
    version: 1,
    clientId: value.clientId,
    name: value.name,
    mimeType: baseMimeType(value.mimeType),
    size: value.size,
    ...(value.documentId ? { documentId: value.documentId } : {}),
    ...(value.durationMs !== undefined ? { durationMs: value.durationMs } : {}),
  }
}

export function sameScope(left: QfbMediaScope, right: QfbMediaScope): boolean {
  return left.userKey === right.userKey && left.formId === right.formId && left.responseKey === right.responseKey
}

export function sameField(left: QfbMediaFieldContext, right: QfbMediaFieldContext): boolean {
  return left.fieldId.toLowerCase() === right.fieldId.toLowerCase() && JSON.stringify(left.fieldPath) === JSON.stringify(right.fieldPath)
}

export function getValueAtPath(values: unknown, path: string[]): unknown {
  let value = values
  for (const segment of path) {
    if (blockedSegments.has(segment) || !value || typeof value !== 'object' || !Object.hasOwn(value, segment))
      return undefined
    value = (value as Record<string, unknown>)[segment]
  }
  return value
}

export function setValueAtPath(values: Record<string, unknown>, path: string[], value: unknown): void {
  if (!path.length || path.some(segment => blockedSegments.has(segment)))
    throw new Error('Invalid media field address')
  let target: Record<string, unknown> = values
  path.slice(0, -1).forEach((segment) => {
    if (!target[segment] || typeof target[segment] !== 'object') target[segment] = {}
    target = target[segment] as Record<string, unknown>
  })
  target[path[path.length - 1]!] = value
}

export function cloneMediaJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item) => (isQfbMediaValue(item) ? copyMediaValue(item) : item))) as T
}

export function freezeMediaJson<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeMediaJson)
    Object.freeze(value)
  }
  return value
}

export function collectMediaValues(values: unknown): QfbMediaValue[] {
  if (isQfbMediaValue(values)) return [values]
  if (!values || typeof values !== 'object') return []
  return Object.values(values).flatMap(collectMediaValues)
}
