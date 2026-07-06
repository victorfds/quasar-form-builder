import type { ConditionOperatorValue, LogicField } from '#qfb/types'
import { contains, endsWith, startsWith } from './logic'

const valueFunctionOperators = new Set(['$contains', '$startsWith', '$endsWith'])
const multiValueOperators = new Set(['==', '!='])

type ProcessableLogicField = Omit<LogicField, 'operator' | 'or'> & {
  operator: string
  or?: ProcessableLogicField[] | null
}

export function transformOperatorValue(operatorValue: string): string {
  const operatorMap: Record<string, string> = {
    empty: '$empty',
    notEmpty: '!$empty',
    equals: '==',
    notEquals: '!=',
    greaterThan: '>',
    greaterOrEqualsThan: '>=',
    lessThan: '<',
    lessOrEqualsThan: '<=',
    contains: '$contains',
    startsWith: '$startsWith',
    endsWith: '$endsWith',
    // Date-specific operators (function-like)
    isToday: '$isToday',
    isTomorrow: '$isTomorrow',
    isYesterday: '$isYesterday',
    isDayAfterTomorrow: '$isDayAfterTomorrow',
    isDayBeforeYesterday: '$isDayBeforeYesterday',
    isTrue: '== true',
    isFalse: '== false',
  }

  return operatorMap[operatorValue] ?? ''
}

export function reverseOperatorValue(symbol?: string): ConditionOperatorValue | '' {
  const reverseOperatorMap: Record<string, ConditionOperatorValue> = {
    '$empty': 'empty',
    '!$empty': 'notEmpty',
    '==': 'equals',
    '!=': 'notEquals',
    '>': 'greaterThan',
    '>=': 'greaterOrEqualsThan',
    '<': 'lessThan',
    '<=': 'lessOrEqualsThan',
    '$contains': 'contains',
    '$startsWith': 'startsWith',
    '$endsWith': 'endsWith',
    // Date-specific operators (function-like)
    '$isToday': 'isToday',
    '$isTomorrow': 'isTomorrow',
    '$isYesterday': 'isYesterday',
    '$isDayAfterTomorrow': 'isDayAfterTomorrow',
    '$isDayBeforeYesterday': 'isDayBeforeYesterday',
    '== true': 'isTrue',
    '== false': 'isFalse',
  }

  if (!symbol) return ''

  return reverseOperatorMap[symbol] ?? ''
}

function formatConditionLiteral(raw: unknown) {
  if (raw === null || raw === undefined) return 'null'
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw)

  const value = String(raw).trim()
  if (!value) return '""'
  if (value.startsWith('$')) return value
  if (value === 'true' || value === 'false' || value === 'null') return value
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return value
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) return value

  return JSON.stringify(value)
}

function appendPendingValue(values: unknown[] = [], value: unknown): unknown[] {
  const pendingValue = typeof value === 'string' ? value.trim() : value
  if (pendingValue === '' || pendingValue === null || pendingValue === undefined) return values
  if (values.includes(pendingValue)) return values
  return [...values, pendingValue]
}

function getConditionValues(condition: Pick<ProcessableLogicField, 'value' | 'values'>): unknown[] {
  return appendPendingValue(condition.values || [], condition.value)
}

function joinOrConditions(conditions: string[]): string {
  const validConditions = conditions.filter(Boolean)
  if (validConditions.length > 1) return `(${validConditions.join(' || ')})`
  return validConditions[0] || ''
}

function getConditionExpressions(condition: ProcessableLogicField): string[] {
  const { name, operator, value } = condition

  if (['$empty', '!$empty'].includes(operator)) {
    return [`${operator}($${name})`]
  }

  if (valueFunctionOperators.has(operator)) {
    return [`${operator}($${name},${formatConditionLiteral(value)})`]
  }

  // Handle generic function-like operators (e.g., $isToday, $isTomorrow, etc.)
  if (operator.startsWith('$')) {
    return [`${operator}($${name})`]
  }

  if (['== true', '== false'].includes(operator)) {
    return [`$${name} ${operator}`]
  }

  if (multiValueOperators.has(operator)) {
    return getConditionValues(condition).map((val: any) => `$${name} ${operator} ${formatConditionLiteral(val)}`)
  }

  return [`$${name} ${operator} ${formatConditionLiteral(value)}`]
}

export function processSingleCondition(condition: ProcessableLogicField, orData: string[]): string {
  return joinOrConditions([...getConditionExpressions(condition), ...orData])
}

export function processConditions(conditions: ProcessableLogicField[]): string[] {
  return conditions.flatMap(orCondition => getConditionExpressions(orCondition))
}

type LogicUpdateProp = (property: 'if' | 'disable' | 'validation' | 'readonly', value: unknown) => void

export function saveLogic(elementStates: { logicFields: LogicField[] }, property: 'if' | 'disable' | 'validation' | 'readonly' = 'if', updatePropFn: LogicUpdateProp) {
  if (!elementStates.logicFields.length) return

  // Transform conditions and nested "or" fields
  const transformedConditions = elementStates.logicFields.map(logicField => ({
    ...logicField,
    operator: transformOperatorValue(logicField.operator),
    or: logicField.or?.map(orField => ({
      ...orField,
      operator: transformOperatorValue(orField.operator),
    })).filter(transformed => (transformed.name && transformed.operator) || (transformed.value || transformed.values.length)),
  })).filter(transformed => (transformed.name && transformed.operator) || (transformed.value || transformed.values.length))

  const data: string[] = []

  transformedConditions.forEach((condition) => {
    const orData = condition.or ? processConditions(condition.or).filter(Boolean) : []
    const conditionString = processSingleCondition(condition, orData)

    if (conditionString) {
      data.push(conditionString)
    }
  })

  if (property === 'validation') {
    // Saving condition
    updatePropFn('validation', { if: data.join(' && ') })
    return
  }

  if (property === 'disable') {
    // Saving condition
    updatePropFn('disable', { if: data.join(' && '), then: true, else: false })
    return
  }

  if (property === 'readonly') {
    updatePropFn('readonly', { if: data.join(' && '), then: true, else: false })
    return
  }

  // Saving condition
  updatePropFn('if', data.join(' && '))
}

export function parseLogic(logicString?: string): LogicField[] {
  if (!logicString) return [{ name: '', operator: '', value: '', values: [], or: [] }]

  const logicFields: LogicField[] = []

  // Split by top-level "&&" to separate main conditions without breaking grouped ORs or function arguments.
  const mainConditions = splitTopLevelLogic(logicString, '&&')

  mainConditions.forEach((mainConditionString) => {
    const conditionGroup = stripWrappingParentheses(mainConditionString)
    // Split by top-level "||" to handle grouped "or" conditions.
    const orConditionsStrings = splitTopLevelLogic(conditionGroup, '||')
    const mainCondition = parseCondition(orConditionsStrings.shift()!) // First is the main condition

    if (orConditionsStrings.length) {
      mainCondition.or = orConditionsStrings.map(parseCondition)
    }

    if (!orConditionsStrings.length) {
      mainCondition.or = []
    }

    logicFields.push(mainCondition)
  })

  return logicFields
}

function splitTopLevelLogic(logicString: string, operator: '&&' | '||'): string[] {
  const parts: string[] = []
  let current = ''
  let quote: '"' | '\'' | null = null
  let escaped = false
  let depth = 0

  for (let index = 0; index < logicString.length; index++) {
    const char = logicString[index]

    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (quote && char === '\\') {
      current += char
      escaped = true
      continue
    }

    if (quote) {
      current += char
      if (char === quote) quote = null
      continue
    }

    if (char === '"' || char === '\'') {
      quote = char
      current += char
      continue
    }

    if (char === '(') {
      depth++
      current += char
      continue
    }

    if (char === ')') {
      depth = Math.max(0, depth - 1)
      current += char
      continue
    }

    if (depth === 0 && logicString.slice(index, index + operator.length) === operator) {
      parts.push(current.trim())
      current = ''
      index += operator.length - 1
      continue
    }

    current += char
  }

  parts.push(current.trim())
  return parts.filter(Boolean)
}

function hasWrappingParentheses(value: string): boolean {
  if (!value.startsWith('(') || !value.endsWith(')')) return false

  let quote: '"' | '\'' | null = null
  let escaped = false
  let depth = 0

  for (let index = 0; index < value.length; index++) {
    const char = value[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (quote && char === '\\') {
      escaped = true
      continue
    }

    if (quote) {
      if (char === quote) quote = null
      continue
    }

    if (char === '"' || char === '\'') {
      quote = char
      continue
    }

    if (char === '(') depth++
    if (char === ')') depth--

    if (depth === 0 && index < value.length - 1) return false
  }

  return depth === 0
}

function stripWrappingParentheses(value: string): string {
  let trimmed = value.trim()

  while (hasWrappingParentheses(trimmed)) {
    trimmed = trimmed.slice(1, -1).trim()
  }

  return trimmed
}

function normalizeLiteral(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const unquoted = trimmed.replace(/^['"]|['"]$/g, '')
  if (unquoted === 'true') return true
  if (unquoted === 'false') return false
  const asNumber = Number(unquoted)
  if (!Number.isNaN(asNumber) && unquoted !== '') return asNumber
  return unquoted
}

function formatParsedLiteral(raw: string): string {
  const normalized = normalizeLiteral(raw)
  if (normalized === null || normalized === undefined) return ''
  return String(normalized)
}

function splitFunctionArguments(raw: string): string[] {
  const args: string[] = []
  let current = ''
  let quote: '"' | '\'' | null = null
  let escaped = false

  for (const char of raw) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\') {
      current += char
      escaped = true
      continue
    }

    if (quote) {
      current += char
      if (char === quote) quote = null
      continue
    }

    if (char === '"' || char === '\'') {
      quote = char
      current += char
      continue
    }

    if (char === ',') {
      args.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  args.push(current.trim())
  return args
}

function normalizeConditionValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  return normalizeLiteral(value)
}

function conditionValueEquals(value: unknown, expected: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(item => conditionValueEquals(item, expected))
  }
  return normalizeConditionValue(value) === expected
}

function isEmptyConditionValue(value: any, source: Record<string, any>) {
  if (typeof source.empty === 'function') return source.empty(value)
  if (Array.isArray(value)) return value.length === 0
  return value === '' || value === null || value === undefined
}

function isPlainRecord(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  return Object.prototype.toString.call(value) === '[object Object]'
}

function getPathValue(source: unknown, path: string) {
  if (!path) return { found: false, value: undefined }
  const segments = path.split('.').filter(Boolean)
  let current: any = source

  for (const segment of segments) {
    if (!isPlainRecord(current) || !Object.hasOwn(current, segment)) {
      return { found: false, value: undefined }
    }
    const next = current[segment]
    if (typeof next === 'function') return { found: false, value: undefined }
    current = next
  }

  return { found: true, value: current }
}

function findNestedValue(source: unknown, targetKey: string, visited = new WeakSet<object>()) {
  if (Array.isArray(source)) {
    for (const item of source) {
      if (isPlainRecord(item) || Array.isArray(item)) {
        const result = findNestedValue(item, targetKey, visited)
        if (result.found) return result
      }
    }
    return { found: false, value: undefined }
  }

  if (!isPlainRecord(source)) return { found: false, value: undefined }
  if (visited.has(source)) return { found: false, value: undefined }
  visited.add(source)

  if (Object.hasOwn(source, targetKey)) {
    const direct = source[targetKey]
    if (typeof direct !== 'function') return { found: true, value: direct }
  }

  for (const key of Object.keys(source)) {
    const value = source[key]
    if (typeof value === 'function') continue
    if (isPlainRecord(value) || Array.isArray(value)) {
      const result = findNestedValue(value, targetKey, visited)
      if (result.found) return result
    }
  }

  return { found: false, value: undefined }
}

function getConditionValue(source: Record<string, any>, fieldName: string) {
  if (!fieldName) return undefined

  if (fieldName.includes('.')) {
    const pathResult = getPathValue(source, fieldName)
    if (pathResult.found) return pathResult.value
  }

  if (Object.hasOwn(source, fieldName)) {
    const direct = source[fieldName]
    if (typeof direct !== 'function') return direct
  }

  const nestedResult = findNestedValue(source, fieldName)
  return nestedResult.found ? nestedResult.value : undefined
}

function evaluateSingleLogicCondition(condition: LogicField, source: Record<string, any>) {
  const value = getConditionValue(source, condition.name)
  const normalizedValue = normalizeConditionValue(value)
  const operator = condition.operator

  if (operator === 'empty') return isEmptyConditionValue(value, source)
  if (operator === 'notEmpty') return !isEmptyConditionValue(value, source)
  if (operator === 'isTrue') return normalizedValue === true
  if (operator === 'isFalse') return normalizedValue === false

  if (operator === 'contains') {
    const containsFn = typeof source.contains === 'function' ? source.contains : contains
    return containsFn(value, normalizeLiteral(condition.value))
  }

  if (operator === 'startsWith') {
    const startsWithFn = typeof source.startsWith === 'function' ? source.startsWith : startsWith
    return startsWithFn(value, normalizeLiteral(condition.value))
  }

  if (operator === 'endsWith') {
    const endsWithFn = typeof source.endsWith === 'function' ? source.endsWith : endsWith
    return endsWithFn(value, normalizeLiteral(condition.value))
  }

  if (operator.startsWith('is')) {
    const fn = source[operator]
    if (typeof fn === 'function') return fn(value)
  }

  const normalizeValues = (list: string[]) => list.map(item => normalizeLiteral(item))
  if (operator === 'equals') {
    if (condition.values?.length) return normalizeValues(condition.values).some(target => conditionValueEquals(value, target))
    return conditionValueEquals(value, normalizeLiteral(condition.value))
  }

  if (operator === 'notEquals') {
    if (condition.values?.length) return normalizeValues(condition.values).every(target => !conditionValueEquals(value, target))
    return !conditionValueEquals(value, normalizeLiteral(condition.value))
  }

  const left = Number(value)
  const right = Number(normalizeLiteral(condition.value))
  if (Number.isNaN(left) || Number.isNaN(right)) return false

  if (operator === 'greaterThan') return left > right
  if (operator === 'greaterOrEqualsThan') return left >= right
  if (operator === 'lessThan') return left < right
  if (operator === 'lessOrEqualsThan') return left <= right

  return true
}

export function evaluateLogicString(logicString: string | undefined, source: Record<string, any>) {
  if (!logicString) return true
  const parsed = parseLogic(logicString).filter(entry => entry.name && entry.operator)
  if (!parsed.length) return true
  return parsed.every((entry) => {
    const orFields = [entry].concat(entry.or || []).filter(orEntry => orEntry.name && orEntry.operator)
    if (!orFields.length) return true
    return orFields.some(orEntry => evaluateSingleLogicCondition(orEntry, source))
  })
}

export function parseCondition(conditionString: string): LogicField {
  const normalizedCondition = stripWrappingParentheses(conditionString)

  // Match function-like operators: $empty(name), !$empty(name), $contains(name,value), $isToday(name), ...
  const functionMatch = normalizedCondition.match(/^(!?\$[a-z]\w*)\((.*?)\)$/i)
  if (functionMatch) {
    const operator = reverseOperatorValue(functionMatch[1])
    const args = splitFunctionArguments(functionMatch[2] || '')

    // Text match functions have 2 parameters: name and value.
    if (operator === 'contains' || operator === 'startsWith' || operator === 'endsWith') {
      const [name = '', value = ''] = args

      return {
        operator,
        name: name?.replace('$', ''),
        value: formatParsedLiteral(value),
        values: [],
      }
    }

    // Generic 1-argument function operators (date ops, $empty, etc.)
    return {
      operator,
      name: args[0]?.replace('$', '') || '',
      value: '',
      values: [],
    }
  }

  const trueOrFalseMatch = normalizedCondition.match(/^\$(.*?)\s(==)\s(true|false)$/)
  if (trueOrFalseMatch) {
    const [_, name, operator, value] = trueOrFalseMatch
    return {
      name: name?.replace('$', '') || '',
      operator: reverseOperatorValue(`${operator} ${value}`),
      value: '',
      values: [],
    }
  }

  // Match equality operators (== or !=) with multiple values
  const equalityMatch = normalizedCondition.match(/^\$(.*?)\s(==|!=)\s(.+)$/)
  if (equalityMatch) {
    const [_, name, operator, valuesString] = equalityMatch
    const values = valuesString?.split(' || ').map(val => val.trim()) || []
    return {
      name: name?.replace('$', '') || '',
      operator: reverseOperatorValue(operator),
      value: '',
      values: values.map(formatParsedLiteral),
    }
  }

  // Match comparison operators (>, >=, <, <=)
  const comparisonMatch = normalizedCondition.match(/^\$(.*?)\s(>=|<=|>|<)\s(.+)$/)
  if (comparisonMatch) {
    return {
      name: comparisonMatch[1]?.replace('$', '') || '',
      operator: reverseOperatorValue(comparisonMatch[2]),
      value: formatParsedLiteral(comparisonMatch[3]?.trim() || ''),
      values: [],
    }
  }

  throw new Error(`Invalid condition format: ${conditionString}`)
}

export function generateHumanReadableText(parsedLogic: LogicField[], operators: {
  value: string
  label: string
}[]): string {
  // Helper to map operator values to human-readable labels
  const getOperatorLabel = (operator: string): string => {
    const foundOperator = operators.find(op => op.value === operator)
    return foundOperator ? foundOperator.label : operator
  }

  // Helper to format a single condition
  const formatCondition = (condition: LogicField): string => {
    const { name, operator, value, values } = condition
    const label = getOperatorLabel(operator)

    if (values.length) {
      return `${name} ${label} [${values.join(', ')}]`
    }

    if (value) {
      return `${name} ${label} ${value}`
    }

    return `${name} ${label}`
  }

  // Helper to process main and "or" conditions
  const formatLogicField = (field: LogicField): string => {
    const mainCondition = formatCondition(field)

    if (field.or && field.or.length) {
      const orConditions = field.or.map(formatCondition).join(' ou ')
      return `(${mainCondition} ou ${orConditions})`
    }

    return mainCondition
  }

  // Map all logic fields into a readable format
  return parsedLogic.map(formatLogicField).join(' e ')
}
