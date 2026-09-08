import { describe, it, expect, vi, beforeEach } from 'vitest'
import { triggerHaptic } from '../haptics'

describe('triggerHaptic utility', () => {
  const getNav = () => (typeof window !== 'undefined' ? window.navigator : navigator) as unknown as { vibrate?: unknown }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('does not throw when vibrate is not supported', () => {
    const nav = getNav()
    const origVibrate = nav.vibrate
    try {
      delete nav.vibrate
      expect(() => triggerHaptic('light')).not.toThrow()
      expect(() => triggerHaptic('success')).not.toThrow()
    } finally {
      if (origVibrate !== undefined) {
        nav.vibrate = origVibrate
      }
    }
  })

  it('calls navigator.vibrate with correct pattern when supported', () => {
    const nav = getNav()
    const vibrateMock = vi.fn()
    Object.defineProperty(nav, 'vibrate', {
      value: vibrateMock,
      configurable: true,
      writable: true,
    })

    triggerHaptic('light')
    expect(vibrateMock).toHaveBeenCalledWith(15)

    triggerHaptic('success')
    expect(vibrateMock).toHaveBeenCalledWith([40, 30, 50])

    triggerHaptic('warning')
    expect(vibrateMock).toHaveBeenCalledWith([60, 50, 60])

    triggerHaptic('error')
    expect(vibrateMock).toHaveBeenCalledWith([100, 40, 100, 40, 120])

    triggerHaptic('seal')
    expect(vibrateMock).toHaveBeenCalledWith([20, 20, 30, 20, 80])
  })

  it('catches and suppresses any vibration exceptions', () => {
    const nav = getNav()
    const vibrateMock = vi.fn().mockImplementation(() => {
      throw new Error('NotAllowedError: user gesture required')
    })
    Object.defineProperty(nav, 'vibrate', {
      value: vibrateMock,
      configurable: true,
      writable: true,
    })

    expect(() => triggerHaptic('success')).not.toThrow()
  })
})
