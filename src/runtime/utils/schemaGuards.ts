import type { QfbConditionalRule } from '../types/conditions'

export function isQfbConditionalRule(value: unknown): value is QfbConditionalRule<unknown> {
  return Boolean(value && typeof value === 'object' && 'if' in value)
}
