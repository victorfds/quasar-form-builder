import type { MatrixColumnType, MatrixSize, MatrixViewMode } from '#qfb/types'

export const matrixColumnTypeOptions: Array<{ label: string, value: MatrixColumnType }> = [
  { label: 'Padrão', value: 'default' },
  { label: 'Texto', value: 'text' },
  { label: 'Área de texto', value: 'textarea' },
  { label: 'Número', value: 'number' },
  { label: 'E-mail', value: 'email' },
  { label: 'Senha', value: 'password' },
  { label: 'URL', value: 'url' },
  { label: 'Telefone', value: 'tel' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Checkbox em blocos', value: 'checkbox-blocks' },
  { label: 'Grupo de checkboxes', value: 'checkbox-group' },
  { label: 'Checkbox em abas', value: 'checkbox-tabs' },
  { label: 'Radio', value: 'radio' },
  { label: 'Selecionar', value: 'select' },
  { label: 'Multi seleção', value: 'multiselect' },
  { label: 'Tags', value: 'tags' },
  { label: 'Data', value: 'date' },
  { label: 'Data e hora', value: 'date-time' },
  { label: 'Hora', value: 'time' },
  { label: 'Slider', value: 'slider' },
  { label: 'Intervalo', value: 'range' },
  { label: 'Toggle', value: 'toggle' },
]

export const matrixViewOptions: Array<{ label: string, value: MatrixViewMode }> = [
  { label: 'Padrão', value: 'default' },
  { label: 'Tabela', value: 'table' },
]

export const matrixSizeOptions: Array<{ label: string, value: MatrixSize }> = [
  { label: 'Padrão', value: 'default' },
  { label: 'Pequeno', value: 'sm' },
  { label: 'Médio', value: 'md' },
  { label: 'Grande', value: 'lg' },
]

export function getEffectiveMatrixColumnType(type: MatrixColumnType | undefined, defaultColumnType: MatrixColumnType | undefined): MatrixColumnType {
  const inheritedType = !defaultColumnType || defaultColumnType === 'default' ? 'text' : defaultColumnType
  return !type || type === 'default' ? inheritedType : type
}

export function matrixColumnTypeUsesOptions(type: MatrixColumnType | undefined): boolean {
  return ['checkbox-blocks', 'checkbox-group', 'checkbox-tabs', 'radio', 'select', 'multiselect', 'tags'].includes(type || 'text')
}
