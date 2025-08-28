import type { ColumnsType } from '~/types'

export type BuilderField = {
  name?: string
  columns?: ColumnsType & Record<string, any>
  align?: 'left' | 'center' | 'right'
  $el?: string
  label?: string
  info?: string
  description?: string
  [key: string]: any
}

export function useFieldUi() {
  function getSpanClass(field: BuilderField, viewport: 'default' | 'sm' | 'lg'): string {
    if (!field?.columns) return 'span-12'
    const cols = field.columns
    const value = viewport === 'default'
      ? (cols as any).container || cols.default?.container || 12
      : cols?.[viewport]?.container || 12
    return `span-${value}`
  }

  function getAlignClass(field: BuilderField): string {
    if (!field?.align) return ''
    const map: Record<'right' | 'center' | 'left', string> = {
      right: 'flex justify-end',
      center: 'flex justify-center',
      left: 'flex justify-start',
    }
    return map[field.align] || ''
  }

  return { getSpanClass, getAlignClass }
}

