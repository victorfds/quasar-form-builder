import type { FormKitSchemaDefinition } from '@formkit/core'
import type { ConditionOperatorOption, ConditionOperatorValue, ConditionValueInputMode } from '#qfb/types'
import { allConditionOperators } from '#qfb/constants'

type ConditionField = FormKitSchemaDefinition & Record<string, any>

const operatorByValue = new Map<ConditionOperatorValue, ConditionOperatorOption>(
  allConditionOperators.map(operator => [operator.value, operator]),
)

const emptyStateOperatorValues = ['empty', 'notEmpty'] as const
const booleanOperatorValues = ['isTrue', 'isFalse'] as const
const textOperatorValues = ['empty', 'notEmpty', 'equals', 'notEquals', 'contains', 'startsWith', 'endsWith'] as const
const numericOperatorValues = ['empty', 'notEmpty', 'equals', 'notEquals', 'greaterThan', 'greaterOrEqualsThan', 'lessThan', 'lessOrEqualsThan'] as const
const singleChoiceOperatorValues = ['empty', 'notEmpty', 'equals', 'notEquals'] as const
const multipleChoiceOperatorValues = ['empty', 'notEmpty', 'contains'] as const
const dateOperatorValues = ['empty', 'notEmpty', 'isToday', 'isTomorrow', 'isYesterday', 'isDayAfterTomorrow', 'isDayBeforeYesterday'] as const
const timeOperatorValues = ['empty', 'notEmpty', 'equals', 'notEquals'] as const

const noValueOperatorValues = new Set<ConditionOperatorValue>([
  ...emptyStateOperatorValues,
  ...booleanOperatorValues,
  'isToday',
  'isTomorrow',
  'isYesterday',
  'isDayAfterTomorrow',
  'isDayBeforeYesterday',
])

const textInputTypes = new Set(['text', 'textarea', 'email', 'tel', 'password', 'url', 'hidden'])
const structureFormKitTypes = new Set(['q-container', 'q-list-structure', 'q-grid', 'q-table-structure', 'q-tabs', 'q-stepper'])
const staticFormKitTypes = new Set(['q-btn', 'q-separator'])

function pickOperators(values: readonly ConditionOperatorValue[]): ConditionOperatorOption[] {
  return values.map(value => operatorByValue.get(value)).filter(Boolean) as ConditionOperatorOption[]
}

function getFieldFormKitType(field?: ConditionField | null): string {
  return String(field?.$formkit || '')
}

function getFieldInputType(field?: ConditionField | null): string {
  return String(field?.inputType || '')
}

function isMultipleChoiceField(field: ConditionField): boolean {
  const formKitType = getFieldFormKitType(field)

  if (formKitType === 'q-select') return field.multiple === true || getFieldInputType(field) === 'multiselect' || getFieldInputType(field) === 'tags'
  if (formKitType === 'q-option-group') return field.groupType === 'checkbox'
  if (formKitType === 'q-btn-toggle') return field.multiple === true

  return false
}

function isStaticOrStructureField(field: ConditionField): boolean {
  const formKitType = getFieldFormKitType(field)
  return Boolean(field.$el) || field.ignore === true || staticFormKitTypes.has(formKitType) || structureFormKitTypes.has(formKitType)
}

function hasConditionOptions(field?: ConditionField | null): boolean {
  return Array.isArray(field?.options) && field.options.length > 0
}

export function getAllConditionOperators(): ConditionOperatorOption[] {
  return allConditionOperators
}

export function needsConditionValue(operator?: string): boolean {
  return Boolean(operator) && !noValueOperatorValues.has(operator as ConditionOperatorValue)
}

export function getConditionOperatorsForField(field?: ConditionField | null): ConditionOperatorOption[] {
  if (!field?.name || field.name === 'slots') return []
  if (isStaticOrStructureField(field)) return []

  const formKitType = getFieldFormKitType(field)
  const inputType = getFieldInputType(field)

  if (formKitType === 'q-signature') return pickOperators(emptyStateOperatorValues)
  if (formKitType === 'q-file') return pickOperators(emptyStateOperatorValues)
  if (formKitType === 'q-matrix') return pickOperators(emptyStateOperatorValues)
  if (formKitType === 'q-range') return pickOperators(emptyStateOperatorValues)
  if (formKitType === 'q-editor') return pickOperators(textOperatorValues)

  if (formKitType === 'q-checkbox' || formKitType === 'q-toggle') return pickOperators(booleanOperatorValues)

  if (formKitType === 'q-select' || formKitType === 'q-option-group' || formKitType === 'q-btn-toggle') {
    return isMultipleChoiceField(field)
      ? pickOperators(multipleChoiceOperatorValues)
      : pickOperators(singleChoiceOperatorValues)
  }

  if (formKitType === 'q-date' || formKitType === 'q-datetime') return pickOperators(dateOperatorValues)
  if (formKitType === 'q-date-multiple' || formKitType === 'q-date-range') return pickOperators(emptyStateOperatorValues)
  if (formKitType === 'q-time') return pickOperators(timeOperatorValues)
  if (formKitType === 'q-slider') return pickOperators(numericOperatorValues)

  if (formKitType === 'q-input') {
    if (inputType === 'number') return pickOperators(numericOperatorValues)
    if (inputType === 'file' || inputType === 'image' || inputType === 'gallery') return pickOperators(emptyStateOperatorValues)
    if (!inputType || textInputTypes.has(inputType)) return pickOperators(textOperatorValues)
  }

  return pickOperators(emptyStateOperatorValues)
}

export function isConditionTargetField(field?: ConditionField | null): boolean {
  return getConditionOperatorsForField(field).length > 0
}

export function isConditionOperatorAllowedForField(field: ConditionField | undefined | null, operator?: string): boolean {
  if (!operator) return false
  return getConditionOperatorsForField(field).some(option => option.value === operator)
}

export function getConditionValueInputMode(field: ConditionField | undefined | null, operator?: string): ConditionValueInputMode {
  if (!field || !needsConditionValue(operator)) return 'none'

  if (hasConditionOptions(field)) {
    if (operator === 'contains') return 'options-single'
    if (operator === 'equals' || operator === 'notEquals') return 'options-multiple'
  }

  if (operator === 'equals' || operator === 'notEquals') return 'tags'

  return 'text'
}
