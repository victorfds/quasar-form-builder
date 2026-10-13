export type { ExtractedFormAnswer, ExtractedFormData, ExtractedFormItem, QfbFormFieldError } from './types'
export { extractFormData } from './utils/formData'
export type { QfbExtractOptions } from './utils/formData'
export { normalizeQfbConditions, transformQfbExpression, validateQfbConditions } from './utils/schemaExpressions'
export {
  adoptQfbSchema,
  cloneQfbSchemaAsTemplate,
  createQfbId,
  duplicateQfbSchema,
  QfbSchemaError,
  renameQfbField,
  validateQfbSchema,
  walkQfbSchema,
} from './utils/schemaIdentity'
export type { QfbIdentifiedSchema, QfbSchemaDiagnostic, QfbSchemaRecord } from './utils/schemaIdentity'

export { createQfbSchemaError, isQfbSchemaError } from './utils/schemaIdentity'
export { normalizeQfbStructureAliases, walkQfbSchemaStructure } from './utils/schemaStructure'
export type { QfbSchemaPosition, QfbStructureIssue } from './utils/schemaStructure'
