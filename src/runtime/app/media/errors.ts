import type { QfbMediaErrorCode, QfbMediaErrorDescription, QfbMediaFieldContext } from './types'

export class QfbMediaError extends Error {
  readonly description: QfbMediaErrorDescription
  constructor(
    code: QfbMediaErrorCode,
    message: string,
    field?: QfbMediaFieldContext,
    clientId?: string,
    recoverable = true,
  ) {
    super(message)
    this.name = 'QfbMediaError'
    this.description = { code, message, field, clientId, recoverable }
  }
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
