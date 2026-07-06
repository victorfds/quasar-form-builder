import type { ConditionOperatorOption } from '#qfb/types'

export const operators: ConditionOperatorOption[] = [
  { value: 'empty', label: 'está vazio' },
  { value: 'notEmpty', label: 'não está vazio' },
  { value: 'equals', label: 'é igual a' },
  { value: 'notEquals', label: 'é diferente de' },
  { value: 'greaterThan', label: '> do que' },
  { value: 'greaterOrEqualsThan', label: '>= do que' },
  { value: 'lessThan', label: '< do que' },
  { value: 'lessOrEqualsThan', label: '<= do que' },
  { value: 'startsWith', label: 'começa com' },
  { value: 'endsWith', label: 'termina com' },
  { value: 'contains', label: 'contém' },
]

export const checkboxOperators: ConditionOperatorOption[] = [
  { value: 'isTrue', label: 'é verdadeiro' },
  { value: 'isFalse', label: 'é falso' },
]

export const dateOperators: ConditionOperatorOption[] = [
  { value: 'empty', label: 'está vazio' },
  { value: 'notEmpty', label: 'não está vazio' },
  { value: 'isToday', label: 'é hoje' },
  { value: 'isTomorrow', label: 'é amanhã' },
  { value: 'isYesterday', label: 'é ontem' },
  { value: 'isDayAfterTomorrow', label: 'é depois de amanhã' },
  { value: 'isDayBeforeYesterday', label: 'é anteontem' },
]

export const allConditionOperators: ConditionOperatorOption[] = Array.from(
  new Map(
    [...operators, ...checkboxOperators, ...dateOperators]
      .map(operator => [operator.value, operator]),
  ).values(),
)

export const fieldTypes: Record<string, { label: string, value: string }[]> = {
  'q-input': [
    { label: 'texto', value: 'text' },
    { label: 'área de texto', value: 'textarea' },
    { label: 'número', value: 'number' },
    { label: 'e-mail', value: 'email' },
    { label: 'senha', value: 'password' },
    { label: 'URL', value: 'url' },
    { label: 'telefone', value: 'tel' },
    { label: 'oculto', value: 'hidden' },
  ],
  'q-select': [
    { label: 'seleção única', value: 'select' },
    { label: 'seleção múltipla', value: 'multiselect' },
    { label: 'tags', value: 'tags' },
  ],
  'q-slider': [
    { label: 'horizontal', value: 'slider' },
    { label: 'vertical', value: 'vertical-slider' },
  ],
  'q-range': [
    { label: 'intervalo', value: 'range' },
  ],
  'q-file': [
    { label: 'arquivo', value: 'file' },
    { label: 'imagem', value: 'image' },
    { label: 'galeria', value: 'gallery' },
  ],
  'q-matrix': [
    { label: 'matriz', value: 'matrix' },
    { label: 'tabela', value: 'matrix-table' },
  ],
}

export const htmlTypes = [
  { label: 'H1', value: 'h1' },
  { label: 'H2', value: 'h2' },
  { label: 'H3', value: 'h3' },
  { label: 'H4', value: 'h4' },
  { label: 'parágrafo', value: 'p' },
  { label: 'citação em bloco', value: 'blockquote' },
  { label: 'imagem', value: 'img' },
  { label: 'link', value: 'a' },
  { label: 'HTML estático', value: 'div' },
]
