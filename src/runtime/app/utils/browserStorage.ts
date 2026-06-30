export function getBrowserStorageItem(key: string) {
  if (!import.meta.client) return null

  try {
    const value = window.localStorage.getItem(key)
    return value ? normalizeBrowserStorageValue(value) : null
  }
  catch {
    return null
  }
}

function normalizeBrowserStorageValue(value: string) {
  return value.startsWith('__q_strn|') ? value.slice('__q_strn|'.length) : value
}

export function setBrowserStorageItem(key: string, value: string) {
  if (!import.meta.client) return

  try {
    window.localStorage.setItem(key, value)
  }
  catch {
    // Storage can be unavailable in private modes or restricted browsers.
  }
}

export function getBrowserJsonItem<T>(key: string, fallback: T): T {
  const raw = getBrowserStorageItem(key)
  if (!raw) return fallback

  try {
    return JSON.parse(normalizeBrowserStorageValue(raw)) as T
  }
  catch {
    return fallback
  }
}
