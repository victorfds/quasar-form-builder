import { useQuasar } from 'quasar'
import { computed } from 'vue'

export type ThemeMode = 'light' | 'dark'

function normalizeTheme(value: unknown): ThemeMode {
  return value === 'dark' ? 'dark' : 'light'
}

export function useThemeMode() {
  const { dark } = useQuasar()
  const { themeCookieName } = getFormBuilderStorageConfig()
  const themeCookie = useCookie<ThemeMode>(themeCookieName, {
    default: () => 'light',
    path: '/',
    sameSite: 'lax',
    watch: 'shallow',
  })

  const theme = computed<ThemeMode>(() => normalizeTheme(themeCookie.value))
  const isDark = computed(() => theme.value === 'dark')

  function applyTheme(value: ThemeMode) {
    dark.set(value === 'dark')
  }

  function setTheme(value: ThemeMode) {
    const nextTheme = normalizeTheme(value)
    themeCookie.value = nextTheme
    applyTheme(nextTheme)
  }

  function toggleTheme(value: boolean) {
    setTheme(value ? 'dark' : 'light')
  }

  if (themeCookie.value !== theme.value) {
    themeCookie.value = theme.value
  }

  applyTheme(theme.value)

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  }
}
