import { describe, it, expect } from 'vitest'
import { generateCSVContent, type ReportData } from '../exportReports'

describe('Security Invariants and Input Defenses', () => {
  describe('CSV / Formula Injection (CWE-1236)', () => {
    it('neutralizes hostile formula prefixes in CSV export descriptions', () => {
      const mockData: ReportData = {
        period: '2026-09',
        incomes: [],
        expenses: [
          {
            id: 'exp-1',
            description: '=cmd|"/C calc"!A0',
            amount: 1500,
            category: 'other',
            type: 'variable',
            paymentMethod: 'debit_card',
            date: '2026-09-08',
            period: '2026-09',
          },
          {
            id: 'exp-2',
            description: '+2+3*calc',
            amount: 200,
            category: 'food',
            type: 'variable',
            paymentMethod: 'cash',
            date: '2026-09-08',
            period: '2026-09',
          },
          {
            id: 'exp-3',
            description: '@SUM(1+1)*cmd',
            amount: 300,
            category: 'utilities',
            type: 'fixed',
            paymentMethod: 'bank_transfer',
            date: '2026-09-08',
            period: '2026-09',
          },
        ],
        cashWithdrawals: [],
        creditTransactions: [],
        creditCards: [],
        categoryBudgets: [],
        savingsGoals: [],
      }

      const csv = generateCSVContent(mockData)

      // Must prepend single quote to neutralize execution in Excel/Calc
      expect(csv).toContain("\"'=cmd|\"\"/C calc\"\"!A0\"")
      expect(csv).toContain("\"'+2+3*calc\"")
      expect(csv).toContain("\"'@SUM(1+1)*cmd\"")
    })
  })

  describe('Financial Input Numeric Invariants', () => {
    const isValidFinancialAmount = (val: unknown): boolean => {
      if (typeof val === 'number') {
        return Number.isFinite(val) && !isNaN(val) && val > 0 && val <= 100_000_000
      }
      if (typeof val === 'string') {
        const parsed = parseFloat(val)
        return Number.isFinite(parsed) && !isNaN(parsed) && parsed > 0 && parsed <= 100_000_000
      }
      return false
    }

    it('rejects malicious or invalid numeric inputs', () => {
      expect(isValidFinancialAmount(NaN)).toBe(false)
      expect(isValidFinancialAmount(Infinity)).toBe(false)
      expect(isValidFinancialAmount(-Infinity)).toBe(false)
      expect(isValidFinancialAmount(-500)).toBe(false)
      expect(isValidFinancialAmount(0)).toBe(false)
      expect(isValidFinancialAmount('NaN')).toBe(false)
      expect(isValidFinancialAmount('-100')).toBe(false)
      expect(isValidFinancialAmount('Infinity')).toBe(false)
      expect(isValidFinancialAmount(999_999_999_999)).toBe(false) // excessive overflow
    })

    it('accepts legitimate transaction amounts', () => {
      expect(isValidFinancialAmount(26000)).toBe(true)
      expect(isValidFinancialAmount('26000')).toBe(true)
      expect(isValidFinancialAmount(103.29)).toBe(true)
      expect(isValidFinancialAmount('1500.00')).toBe(true)
    })
  })
})
