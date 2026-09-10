import { describe, it, expect, beforeEach } from 'vitest'
import { getInitialTheme } from '../../hooks/useTheme'

describe('Theme management utility', () => {
  const store: Record<string, string> = {}
  const mockLocalStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = String(val) },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  }

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    })
    mockLocalStorage.clear()
  })

  it('defaults to dark when localStorage is empty and no media preference', () => {
    const theme = getInitialTheme()
    expect(['dark', 'light']).toContain(theme)
  })

  it('reads saved theme from localStorage when valid', () => {
    mockLocalStorage.setItem('aureus_theme', 'light')
    expect(getInitialTheme()).toBe('light')

    mockLocalStorage.setItem('aureus_theme', 'dark')
    expect(getInitialTheme()).toBe('dark')
  })

  it('ignores invalid values in localStorage and falls back safely', () => {
    mockLocalStorage.setItem('aureus_theme', 'invalid_theme')
    const theme = getInitialTheme()
    expect(['dark', 'light']).toContain(theme)
  })
})
