import { describe, it, expect } from 'vitest'
import { convertFromDOP, convertToDOP, formatMultiCurrency } from '../currencyConverter'

describe('currencyConverter', () => {
  it('converts DOP to USD correctly', () => {
    const dopAmount = 6025
    const usd = convertFromDOP(dopAmount, 'USD')
    expect(usd).toBe(100)
  })

  it('converts USD to DOP correctly', () => {
    const usdAmount = 100
    const dop = convertToDOP(usdAmount, 'USD')
    expect(dop).toBe(6025)
  })

  it('formats multi-currency strings', () => {
    const formattedDOP = formatMultiCurrency(6025, 'DOP')
    expect(formattedDOP).toContain('RD$')

    const formattedUSD = formatMultiCurrency(6025, 'USD')
    expect(formattedUSD).toContain('$ 100.00 (USD)')
  })
})
