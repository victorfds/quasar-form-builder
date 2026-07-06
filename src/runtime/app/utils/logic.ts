export function contains(input: string | number | any[], value: string | number): boolean {
  if (input === undefined || input === null || value === undefined || value === null) return false
  if (Array.isArray(input)) return input.includes(value)
  if (typeof input === 'string') return input.includes(String(value))
  if (typeof input === 'number') {
    if (typeof value === 'number') return input === value
    return String(input).includes(String(value))
  }
  return false
}

export function startsWith(input: string | number | any[], value: string | number): boolean {
  if (input === undefined || input === null || value === undefined || value === null) return false
  if (Array.isArray(input)) return input.some(item => startsWith(item, value))
  return String(input).startsWith(String(value))
}

export function endsWith(input: string | number | any[], value: string | number): boolean {
  if (input === undefined || input === null || value === undefined || value === null) return false
  if (Array.isArray(input)) return input.some(item => endsWith(item, value))
  return String(input).endsWith(String(value))
}
