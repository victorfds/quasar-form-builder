import type { LogicField } from '#qfb/types'
import { contains } from './logic'

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

export function reverseOperatorValue(symbol?: string): string {
  const reverseOperatorMap: Record<string, string> = {
    '$empty': 'empty',
    '!$empty': 'notEmpty',
    '==': 'equals',
    '!=': 'notEquals',
    '>': 'greaterThan',
    '>=': 'greaterOrEqualsThan',
    '<': 'lessThan',
    '<=': 'lessOrEqualsThan',
    '$contains': 'contains',
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

export function processSingleCondition(condition: LogicField, orData: string[]): string {
  const { name, operator, value, values } = condition

  if (['$empty', '!$empty'].includes(operator)) {
    return `${operator}($${name})${orData.length ? ' || ' : ''}${orData.join(' || ')}`
  }

  if (['$contains'].includes(operator)) {
    return `${operator}($${name},${formatConditionLiteral(value)})${orData.length ? ' || ' : ''}${orData.join(' || ')}`
  }

  // Handle generic function-like operators (e.g., $isToday, $isTomorrow, etc.)
  if (operator.startsWith('$')) {
    return `${operator}($${name})${orData.length ? ' || ' : ''}${orData.join(' || ')}`
  }

  if (['== true', '== false'].includes(operator)) {
    return `$${name} ${operator}${orData.length ? ' || ' : ''}${orData.join(' || ')}`
  }

  if (['==', '!='].includes(operator)) {
    const valuesInString = values.map((val: any) => `$${name} ${operator} ${formatConditionLiteral(val)}`).join(' || ')
    return `${valuesInString}${orData.length ? ' || ' : ''}${orData.join(' || ')}`
  }

  return `$${name} ${operator} ${formatConditionLiteral(value)}${orData.length ? ' || ' : ''}${orData.join(' || ')}`
}

export function processConditions(conditions: LogicField[]): string[] {
  return conditions.map((orCondition) => {
    const { name, operator, value, values } = orCondition

    if (['$empty', '!$empty'].includes(operator)) {
      return `${operator}($${name})`
    }

    if (['$contains'].includes(operator)) {
      return `${operator}($${name},${formatConditionLiteral(value)})`
    }

    // Generic function-like operator
    if (operator.startsWith('$')) {
      return `${operator}($${name})`
    }

    if (['== true', '== false'].includes(operator)) {
      return `$${name} ${operator}`
    }

    if (['==', '!='].includes(operator)) {
      return values.map((val: any) => `$${name} ${operator} ${formatConditionLiteral(val)}`).join(' || ')
    }

    return `$${name} ${operator} ${formatConditionLiteral(value)}`
  })
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
    const orData = condition.or ? processConditions(condition.or) : []
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

  // Split by "&&" to separate main conditions
  const mainConditions = logicString.split(' && ')

  mainConditions.forEach((mainConditionString) => {
    // Split by "||" to handle "or" conditions
    const orConditionsStrings = mainConditionString.split(' || ')
    const mainCondition = parseCondition(orConditionsStrings.shift()!) // First is the main condition

    if (orConditionsStrings.length) {
      const grouped = groupConditions(orConditionsStrings)
      mainCondition.or = grouped.map(parseCondition)
    }

    if (!orConditionsStrings.length) {
      mainCondition.or = []
    }

    logicFields.push(mainCondition)
  })

  return logicFields
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
    if (!isPlainRecord(current) || !Object.prototype.hasOwnProperty.call(current, segment)) {
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

  if (Object.prototype.hasOwnProperty.call(source, targetKey)) {
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

  if (Object.prototype.hasOwnProperty.call(source, fieldName)) {
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
  // Match function-like operators: $empty(name), !$empty(name), $contains(name,value), $isToday(name), ...
  const functionMatch = conditionString.match(/^(!?\$[a-z]\w*)\((.*?)\)$/i)
  if (functionMatch) {
    const operator = reverseOperatorValue(functionMatch[1])

    // For $contains, we have 2 parameters: name and value
    if (operator === 'contains') {
      const [name = '', value = ''] = (functionMatch[2] || '').split(',').map(item => item.trim())

      return {
        operator,
        name: name?.replace('$', ''),
        value,
        values: [],
      }
    }

    // Generic 1-argument function operators (date ops, $empty, etc.)
    return {
      operator,
      name: functionMatch[2]?.replace('$', '') || '',
      value: '',
      values: [],
    }
  }

  const trueOrFalseMatch = conditionString.match(/^\$(.*?)\s(==)\s(true|false)$/)
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
  const equalityMatch = conditionString.match(/^\$(.*?)\s(==|!=)\s(.+)$/)
  if (equalityMatch) {
    const [_, name, operator, valuesString] = equalityMatch
    const values = valuesString?.split(' || ').map(val => val.trim()) || []
    return {
      name: name?.replace('$', '') || '',
      operator: reverseOperatorValue(operator),
      value: '',
      values,
    }
  }

  // Match comparison operators (>, >=, <, <=)
  const comparisonMatch = conditionString.match(/^\$(.*?)\s(>=|<=|>|<)\s(.+)$/)
  if (comparisonMatch) {
    return {
      name: comparisonMatch[1]?.replace('$', '') || '',
      operator: reverseOperatorValue(comparisonMatch[2]),
      value: comparisonMatch[3]?.trim() || '',
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
      return `${mainCondition} ou ${orConditions}`
    }

    return mainCondition
  }

  // Map all logic fields into a readable format
  return parsedLogic.map(formatLogicField).join(' e ')
}

function groupConditions(values: string[]): string[] {
  // Group conditions using reduce
  const grouped = values.reduce<Record<string, string[]>>((acc, condition) => {
    // Match for "key == value" or "key != value"
    const match = condition.match(/(.+?)(==|!=)\s*(.+)/)
    if (match) {
      const keyOperator = match[1] + match[2].trim() // Extract "key ==" or "key !="
      const value = match[3].trim() // Extract value
      return {
        ...acc,
        [keyOperator]: [...(acc[keyOperator] || []), value],
      }
    }
    return acc
  }, {})

  // Map grouped conditions into formatted strings
  const groupedConditions = Object.entries(grouped).map(
    ([keyOperator, values]) => `${keyOperator} ${values.join(', ')}`,
  )

  // Filter unique conditions (not grouped)
  const uniqueConditions = values.filter(
    condition => !condition.match(/(.+?)(==|!=)\s*(.+)/),
  )

  // Combine grouped and unique conditions
  return [...groupedConditions, ...uniqueConditions]
}
