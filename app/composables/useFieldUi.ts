import type { ColumnsType, FormViewportType } from '~/types'

export interface BuilderField {
  name?: string
  columns?: ColumnsType & Record<string, any>
  align?: 'left' | 'center' | 'right'
  $el?: string
  label?: string
  info?: string
  description?: string
  [key: string]: any
}

function normalizeColumnSpan(value: unknown): number {
  const span = Number(value)
  if (!Number.isFinite(span)) return 12
  return Math.max(1, Math.min(12, Math.round(span)))
}

export function useFieldUi() {
  function getColumnSpan(field: BuilderField, viewport: FormViewportType = 'default'): number {
    if (!field?.columns) return 12
    const cols = field.columns
    const defaultSpan = cols.default?.container ?? cols.container ?? 12
    const smSpan = cols.sm?.container ?? defaultSpan
    const lgSpan = cols.lg?.container ?? smSpan

    if (viewport === 'lg') return normalizeColumnSpan(lgSpan)
    if (viewport === 'sm') return normalizeColumnSpan(smSpan)
    return normalizeColumnSpan(defaultSpan)
  }

  function getSpanClass(field: BuilderField, viewport: FormViewportType): string {
    return `span-${getColumnSpan(field, viewport)}`
  }

  function getGridColumnStyle(field: BuilderField, viewport?: FormViewportType): Record<string, string | number> {
    const defaultSpan = getColumnSpan(field, 'default')
    const smSpan = getColumnSpan(field, 'sm')
    const lgSpan = getColumnSpan(field, 'lg')
    const style: Record<string, string | number> = {
      '--field-column-default': defaultSpan,
      '--field-column-sm': smSpan,
      '--field-column-lg': lgSpan,
    }
    if (viewport) {
      const activeSpan = getColumnSpan(field, viewport)
      style.gridColumn = `span ${activeSpan} / span ${activeSpan}`
    }
    return style
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

  return { getColumnSpan, getSpanClass, getGridColumnStyle, getAlignClass }
}
