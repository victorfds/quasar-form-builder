import type { LogicField } from '~/types'

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
    contains: '$contains'
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
    '$contains': 'contains'
  }

  if (!symbol) return ''

  return reverseOperatorMap[symbol] ?? ''
}

export function processSingleCondition(condition: LogicField, orData: string[]): string {
  const { name, operator, value, values } = condition

  if (['$empty', '!$empty'].includes(operator)) {
    return `${operator}($${name})${orData.length ? ' || ' : ''}${orData.join(' || ')}`
  }

  if (['$contains'].includes(operator)) {
    return `${operator}($${name},${value})${orData.length ? ' || ' : ''}${orData.join(' || ')}`
  }

  if (['==', '!='].includes(operator)) {
    const valuesInString = values.map((val: any) => `$${name} ${operator} ${val}`).join(' || ')
    return `${valuesInString}${orData.length ? ' || ' : ''}${orData.join(' || ')}`
  }

  return `$${name} ${operator} ${value}${orData.length ? ' || ' : ''}${orData.join(' || ')}`
}

export function processConditions(conditions: LogicField[]): string[] {
  return conditions.map(orCondition => {
    const { name, operator, value, values } = orCondition

    if (['$empty', '!$empty'].includes(operator)) {
      return `${operator}($${name})`
    }

    if (['$contains'].includes(operator)) {
      return `${operator}($${name},${value})`
    }

    if (['==', '!='].includes(operator)) {
      return values.map((val: any) => `$${name} ${operator} ${val}`).join(' || ')
    }

    return `$${name} ${operator} ${value}`
  })
}

export function saveLogic(elementStates: { logicFields: LogicField[] }, property: 'if' | 'disable' | 'validation' = 'if', updatePropFn: Function) {
  if (!elementStates.logicFields.length) return

  // Transform conditions and nested "or" fields
  const transformedConditions = elementStates.logicFields.map(logicField => ({
    ...logicField,
    operator: transformOperatorValue(logicField.operator),
    or: logicField.or?.map(orField => ({
      ...orField,
      operator: transformOperatorValue(orField.operator)
    })).filter(transformed => (transformed.name && transformed.operator) || (transformed.value || transformed.values.length))
  })).filter(transformed => (transformed.name && transformed.operator) || (transformed.value || transformed.values.length))

  const data: string[] = []

  transformedConditions.forEach(condition => {
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

  // Saving condition
  updatePropFn('if', data.join(' && '))
}

export function parseLogic(logicString?: string): LogicField[] {
  if (!logicString) return [{ name: '', operator: '', value: '', values: [], or: [] }]

  const logicFields: LogicField[] = []

  // Split by "&&" to separate main conditions
  const mainConditions = logicString.split(' && ')

  mainConditions.forEach(mainConditionString => {
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

export function parseCondition(conditionString: string): LogicField {
  // Match operators like $empty(name), !$empty(name), $contains(name, value)
  const functionMatch = conditionString.match(/^(!?\$empty|\$contains)\((.*?)\)$/)
  if (functionMatch) {
    const operator = reverseOperatorValue(functionMatch[1])

    // For $contains, we have 2 parameters: name and value
    if (operator === 'contains') {
      const [name = '', value = ''] = functionMatch[2]?.split(',').map(item => item.trim())!

      return {
        operator: operator,
        name: name?.replace('$', ''),
        value: value,
        values: []
      }
    }

    return {
      operator: operator,
      name: functionMatch[2]?.replace('$', '') || '',
      value: '',
      values: []
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
      values
    }
  }

  // Match comparison operators (>, >=, <, <=)
  const comparisonMatch = conditionString.match(/^\$(.*?)\s(>|>=|<|<=)\s(.+)$/)
  if (comparisonMatch) {
    return {
      name: comparisonMatch[1]?.replace('$', '') || '',
      operator: reverseOperatorValue(comparisonMatch[2]),
      value: comparisonMatch[3]?.trim() || '',
      values: []
    }
  }

  throw new Error(`Invalid condition format: ${conditionString}`)
}

export function generateHumanReadableText(parsedLogic: LogicField[], operators: {
  value: string;
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
    ([keyOperator, values]) => `${keyOperator} ${values.join(", ")}`
  )

  // Filter unique conditions (not grouped)
  const uniqueConditions = values.filter(
    condition => !condition.match(/(.+?)(==|!=)\s*(.+)/)
  )

  // Combine grouped and unique conditions
  return [...groupedConditions, ...uniqueConditions]
}
