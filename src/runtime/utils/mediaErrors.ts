import type { QfbMediaErrorCode, QfbMediaErrorDescription, QfbMediaFieldContext } from '../types/media'

export interface QfbMediaError extends Error {
  readonly description: QfbMediaErrorDescription
}
interface MediaErrorConstructor {
  new (code: QfbMediaErrorCode, message: string, field?: QfbMediaFieldContext, clientId?: string, recoverable?: boolean): QfbMediaError
  prototype: QfbMediaError
}
/** Compatibility constructor for 0.2.x consumers; prefer createQfbMediaError. */
// The type and compatibility constructor intentionally share the public name.
// eslint-disable-next-line ts/no-redeclare
export const QfbMediaError = function (code: QfbMediaErrorCode, message: string, field?: QfbMediaFieldContext, clientId?: string, recoverable = true): QfbMediaError {
  const error = Object.assign(new Error(message), { name: 'QfbMediaError', description: { code, message, field, clientId, recoverable } })
  Object.setPrototypeOf(error, QfbMediaError.prototype)
  return error
} as unknown as MediaErrorConstructor
QfbMediaError.prototype = Object.create(Error.prototype, { constructor: { value: QfbMediaError, writable: true, configurable: true } })

export function createQfbMediaError(code: QfbMediaErrorCode, message: string, field?: QfbMediaFieldContext, clientId?: string, recoverable = true): QfbMediaError {
  return new QfbMediaError(code, message, field, clientId, recoverable)
}
export function isQfbMediaError(value: unknown): value is QfbMediaError {
  return value instanceof Error && value.name === 'QfbMediaError' && 'description' in value
}

export function describeMediaError(
  error: unknown,
  field?: QfbMediaFieldContext,
  clientId?: string,
): QfbMediaErrorDescription {
  if (error instanceof QfbMediaError) {
    return {
      ...error.description,
      field: error.description.field || field,
      clientId: error.description.clientId || clientId,
    }
  }
  return {
    code: 'transport',
    message: error instanceof Error ? error.message : 'Falha na operação de mídia',
    recoverable: true,
    field,
    clientId,
  }
}
