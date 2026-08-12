import { describe, it, expect } from 'vitest'
import { formatCurrency, getTodayDateString } from '../formatters'

describe('formatters', () => {
  it('formats positive currency correctly in RD$', () => {
    const formatted = formatCurrency(85000)
    expect(formatted).toContain('85,000')
    expect(formatted).toContain('RD$')
  })

  it('formats decimal numbers with two digits', () => {
    const formatted = formatCurrency(1250.5)
    expect(formatted).toContain('1,250.50')
  })

  it('formats zero correctly', () => {
    const formatted = formatCurrency(0)
    expect(formatted).toContain('0.00')
  })

  it('generates a valid YYYY-MM-DD date string for today', () => {
    const today = getTodayDateString()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
