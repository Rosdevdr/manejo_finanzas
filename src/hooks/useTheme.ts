import { useState, useEffect, useCallback } from 'react'

export type Theme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'aureus_theme'

export function getInitialTheme(): Theme {
  try {
    const storage = typeof window !== 'undefined' ? window.localStorage : (typeof globalThis !== 'undefined' ? globalThis.localStorage : undefined)
    const saved = storage?.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') {
      return saved
    }
  } catch {
    // Ignorar si el almacenamiento local está restringido
  }
  
  // Respetar la preferencia del sistema operativo si no hay elección guardada
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  
  return 'dark'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.setAttribute('data-theme', newTheme)
    if (newTheme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
      root.classList.remove('light')
    }
  }, [])

  useEffect(() => {
    applyTheme(theme)
    try {
      const storage = typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage
      storage?.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignorar errores de almacenamiento local privado
    }
  }, [theme, applyTheme])

  // Escuchar cambios de preferencia del sistema si el usuario no ha forzado una elección
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY)
        if (!saved) {
          setThemeState(e.matches ? 'light' : 'dark')
        }
      } catch {
        // Ignorar
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  }
}
