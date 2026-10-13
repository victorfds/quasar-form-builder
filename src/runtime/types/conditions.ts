export interface QfbConditionalRule<T> {
  if: string
  then: T
  else?: T
}

export type ConditionOperatorValue
  = | 'empty'
    | 'notEmpty'
    | 'equals'
    | 'notEquals'
    | 'greaterThan'
    | 'greaterOrEqualsThan'
    | 'lessThan'
    | 'lessOrEqualsThan'
    | 'startsWith'
    | 'endsWith'
    | 'contains'
    | 'isTrue'
    | 'isFalse'
    | 'isToday'
    | 'isTomorrow'
    | 'isYesterday'
    | 'isDayAfterTomorrow'
    | 'isDayBeforeYesterday'

export interface ConditionOperatorOption {
  value: ConditionOperatorValue
  label: string
}

export type ConditionValueInputMode = 'none' | 'text' | 'tags' | 'options-single' | 'options-multiple'

export interface LogicField {
  name: string
  operator: ConditionOperatorValue | ''
  value: string
  values: string[]
  or?: LogicField[] | null
}
