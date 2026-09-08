import { describe, it, expect } from 'vitest'
import { easeOutCubic, interpolateCount } from '../countUp'

describe('CountUp mathematics', () => {
  it('eases out with cubic progression', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    // At half-time, cubic ease out is already at ~87.5% (fast start, gentle stop)
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 2)
  })

  it('interpolates values correctly across progress', () => {
    expect(interpolateCount(100, 200, 0)).toBe(100)
    expect(interpolateCount(100, 200, 1)).toBe(200)
    expect(interpolateCount(100, 200, 0.5)).toBeCloseTo(187.5, 1)
  })

  it('handles negative or descending balances smoothly', () => {
    expect(interpolateCount(200, 100, 0)).toBe(200)
    expect(interpolateCount(200, 100, 1)).toBe(100)
    expect(interpolateCount(200, 100, 0.5)).toBeCloseTo(112.5, 1)
  })

  it('returns target immediately when start equals end', () => {
    expect(interpolateCount(500, 500, 0.3)).toBe(500)
  })
})
