import { describe, it, expect } from 'vitest'
import { FINANCIAL_TIPS_BANK, getRandomDailyTip } from '../financialTips'

describe('financialTips', () => {
  it('contains curated financial tips in bank', () => {
    expect(FINANCIAL_TIPS_BANK.length).toBeGreaterThanOrEqual(5)
    expect(FINANCIAL_TIPS_BANK[0]).toHaveProperty('title')
    expect(FINANCIAL_TIPS_BANK[0]).toHaveProperty('content')
  })

  it('generates a valid daily tip for a period', () => {
    const tip = getRandomDailyTip('2026-08')
    expect(tip).toBeDefined()
    expect(tip.title).toBeTruthy()
    expect(tip.content).toBeTruthy()
  })
})
