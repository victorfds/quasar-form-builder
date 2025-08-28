import type { ColumnsType } from '~/types'

type HasColumns = { columns?: ColumnsType & Record<string, any> }
type HasAlign = { align?: 'left' | 'center' | 'right' }

export function useFieldLayout() {
  function getContainerSpan(field: HasColumns): number {
    if (!field?.columns) return 12
    const columns = field.columns
    return (
      (columns as any).container
      || columns.default?.container
      || 12
    ) as number
  }

  function getAlignClass(field: HasAlign): string {
    if (!field?.align) return ''
    const map: Record<'right' | 'center' | 'left', string> = {
      right: 'flex justify-end',
      center: 'flex justify-center',
      left: 'flex justify-start',
    }
    return map[field.align] || ''
  }

  return { getContainerSpan, getAlignClass }
}

