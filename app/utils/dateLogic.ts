function toStartOfDay(d: Date): Date {
  const nd = new Date(d)
  nd.setHours(0, 0, 0, 0)
  return nd
}

function parseDateString(s: string): Date | null {
  if (!s) return null
  // Remove time part if present
  const [datePart] = s.split(' ')
  // y-m-d or y/m/d
  let m = datePart.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})$/)
  if (m) {
    const [, y, mo, d] = m
    const dt = new Date(Number(y), Number(mo) - 1, Number(d))
    return isNaN(dt.getTime()) ? null : toStartOfDay(dt)
  }
  // d/m/y or d-m-y
  m = datePart.match(/^(\d{2})[-\/]?(\d{2})[-\/]?(\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    const dt = new Date(Number(y), Number(mo) - 1, Number(d))
    return isNaN(dt.getTime()) ? null : toStartOfDay(dt)
  }
  // Try native Date (ISO)
  const dt = new Date(datePart)
  return isNaN(dt.getTime()) ? null : toStartOfDay(dt)
}

function normalizeToDates(value: any): { dates: Date[]; range?: { from: Date | null, to: Date | null } } {
  if (value == null || value === '') return { dates: [] }
  if (Array.isArray(value)) {
    const dates = value.map(v => typeof v === 'string' ? parseDateString(v) : null).filter(Boolean) as Date[]
    return { dates }
  }
  if (typeof value === 'object' && ('from' in value || 'to' in value)) {
    const from = parseDateString((value as any).from)
    const to = parseDateString((value as any).to)
    return { dates: [], range: { from, to } }
  }
  if (typeof value === 'string') {
    const d = parseDateString(value)
    return { dates: d ? [d] : [] }
  }
  return { dates: [] }
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getOffsetDay(offset: number): Date {
  const d = toStartOfDay(new Date())
  d.setDate(d.getDate() + offset)
  return d
}

function includesTarget(value: any, target: Date): boolean {
  const { dates, range } = normalizeToDates(value)
  if (dates.length) return dates.some(d => sameDay(d, target))
  if (range) {
    const { from, to } = range
    if (!from && !to) return false
    if (from && to) return (from <= target && target <= to)
    if (from && !to) return sameDay(from, target)
    if (!from && to) return sameDay(to, target)
  }
  return false
}

export function isToday(value: any): boolean {
  return includesTarget(value, getOffsetDay(0))
}

export function isTomorrow(value: any): boolean {
  return includesTarget(value, getOffsetDay(1))
}

export function isYesterday(value: any): boolean {
  return includesTarget(value, getOffsetDay(-1))
}

export function isDayAfterTomorrow(value: any): boolean {
  return includesTarget(value, getOffsetDay(2))
}

export function isDayBeforeYesterday(value: any): boolean {
  return includesTarget(value, getOffsetDay(-2))
}

