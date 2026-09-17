import { useEffect, useCallback } from 'react'

export type Theme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'aureus_theme'

export function getInitialTheme(): Theme {
  return 'dark'
}

export function useTheme() {
  const theme: Theme = 'dark'

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.setAttribute('data-theme', 'dark')
    root.classList.add('dark')
    root.classList.remove('light')
    try {
      const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage
      storage?.setItem(THEME_STORAGE_KEY, 'dark')
    } catch {
      // Ignorar errores de almacenamiento local
    }
  }, [])

  const toggleTheme = useCallback(() => {}, [])
  const setTheme = useCallback((_newTheme: Theme) => {}, [])

  return {
    theme,
    isDark: true,
    toggleTheme,
    setTheme,
  }
}
