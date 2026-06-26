import type { ColumnsType, FormViewportType } from '~/types'

interface HasColumns { columns?: ColumnsType & Record<string, any> }
interface HasAlign { align?: 'left' | 'center' | 'right' }

export function useFieldLayout() {
  const fieldUi = useFieldUi()
  const getContainerSpan = (field: HasColumns, viewport: FormViewportType = 'default') => fieldUi.getColumnSpan(field, viewport)
  const getGridColumnStyle = (field: HasColumns, viewport?: FormViewportType) => fieldUi.getGridColumnStyle(field, viewport)
  const getAlignClass = (field: HasAlign) => fieldUi.getAlignClass(field)

  return { getContainerSpan, getGridColumnStyle, getAlignClass }
}
