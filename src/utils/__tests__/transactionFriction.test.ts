import { describe, it, expect, vi } from 'vitest'
import { triggerHaptic } from '../haptics'

describe('Transaction Friction and Positive Security Checks', () => {
  const HIGH_RISK_THRESHOLD = 25000

  it('correctly identifies transactions that require intentional friction (> 25000 or = 25000)', () => {
    const isHighRisk = (amount: number) => amount >= HIGH_RISK_THRESHOLD

    expect(isHighRisk(500)).toBe(false)
    expect(isHighRisk(24999.99)).toBe(false)
    expect(isHighRisk(25000)).toBe(true)
    expect(isHighRisk(26000)).toBe(true)
    expect(isHighRisk(100000)).toBe(true)
  })

  it('triggers seal haptic vibration pattern during transaction completion', () => {
    const nav = (typeof window !== 'undefined' ? window.navigator : navigator) as unknown as { vibrate?: unknown }
    const vibrateMock = vi.fn()
    Object.defineProperty(nav, 'vibrate', {
      value: vibrateMock,
      configurable: true,
      writable: true,
    })

    triggerHaptic('seal')
    expect(vibrateMock).toHaveBeenCalledWith([20, 20, 30, 20, 80])
  })

  it('respects delay ceremony timing (350ms micro-transition, 1250ms seal animation)', () => {
    vi.useFakeTimers()
    let step = 0
    const onConfirmMock = vi.fn()

    // Step 0 -> Step 1 (350ms)
    setTimeout(() => {
      step = 1
    }, 350)

    expect(step).toBe(0)
    vi.advanceTimersByTime(350)
    expect(step).toBe(1)

    // Step 1 -> Step 2 (Authorize clicked, seal animates for 1250ms)
    step = 2
    setTimeout(() => {
      onConfirmMock()
    }, 1250)

    expect(onConfirmMock).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1200)
    expect(onConfirmMock).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(onConfirmMock).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
