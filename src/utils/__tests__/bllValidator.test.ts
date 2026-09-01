import { describe, it, expect } from 'vitest'
import {
  isValidIsoDate,
  derivePeriodFromDate,
  validateIncomeInput,
  validateExpenseInput,
  validateCreditCardInput,
  validateCreditTransactionInput,
  validateCashWithdrawalInput,
  validateBudgetInput,
  validateSavingsGoalInput,
} from '../bllValidator'

describe('BLL Validation Suite', () => {
  describe('Date & Period Validation', () => {
    it('validates ISO dates correctly', () => {
      expect(isValidIsoDate('2026-09-01')).toBe(true)
      expect(isValidIsoDate('2026-02-28')).toBe(true)
      expect(isValidIsoDate('2026-02-31')).toBe(false)
      expect(isValidIsoDate('1/9/2026')).toBe(false)
      expect(isValidIsoDate('invalid')).toBe(false)
      expect(isValidIsoDate('')).toBe(false)
    })

    it('derives period correctly from date', () => {
      expect(derivePeriodFromDate('2026-09-01')).toBe('2026-09')
      expect(derivePeriodFromDate('2026-12-31')).toBe('2026-12')
      expect(derivePeriodFromDate('invalid', '2026-08')).toBe('2026-08')
    })
  })

  describe('Income Validation', () => {
    it('validates a correct income', () => {
      const res = validateIncomeInput({
        description: 'Salario Quincenal',
        amount: 35000,
        date: '2026-09-01',
        type: 'salary',
      })
      expect(res.isValid).toBe(true)
      expect(res.targetPeriod).toBe('2026-09')
      expect(res.data?.amount).toBe(35000)
    })

    it('rejects income with invalid amount or short description', () => {
      expect(validateIncomeInput({ description: 'A', amount: 500, date: '2026-09-01' }).isValid).toBe(false)
      expect(validateIncomeInput({ description: 'Salario', amount: 0, date: '2026-09-01' }).isValid).toBe(false)
      expect(validateIncomeInput({ description: 'Salario', amount: -100, date: '2026-09-01' }).isValid).toBe(false)
      expect(validateIncomeInput({ description: 'Salario', amount: 5000, date: 'invalid' }).isValid).toBe(false)
    })
  })

  describe('Expense Validation', () => {
    it('validates a correct expense and derives period 2026-09', () => {
      const res = validateExpenseInput({
        description: 'Supermercado Mensual',
        amount: 8500.5,
        date: '2026-09-01',
        category: 'food',
        type: 'variable',
        paymentMethod: 'debit_card',
      })
      expect(res.isValid).toBe(true)
      expect(res.targetPeriod).toBe('2026-09')
      expect(res.data?.category).toBe('food')
      expect(res.data?.amount).toBe(8500.5)
    })

    it('rejects invalid expense inputs', () => {
      expect(validateExpenseInput({ description: '', amount: 100, date: '2026-09-01' }).isValid).toBe(false)
      expect(validateExpenseInput({ description: 'Gasolina', amount: -20, date: '2026-09-01' }).isValid).toBe(false)
    })
  })

  describe('Credit Cards & Transactions', () => {
    const mockCards = [
      {
        id: 'card-1',
        name: 'Visa Infinite',
        bank: 'BHD',
        lastFourDigits: '1234',
        creditLimit: 100000,
        cutoffDay: 15,
        paymentDueDay: 5,
        interestRate: 4.5,
        color: 'gold' as const,
      }
    ]

    it('validates credit card creation', () => {
      const res = validateCreditCardInput({
        name: 'Mastercard Black',
        bank: 'Banreservas',
        lastFourDigits: '5678',
        creditLimit: 120000,
        cutoffDay: 20,
        paymentDueDay: 10,
      })
      expect(res.isValid).toBe(true)
      expect(res.data?.lastFourDigits).toBe('5678')
    })

    it('rejects invalid card last 4 digits and cut off dates', () => {
      expect(validateCreditCardInput({ name: 'Visa', bank: 'BHD', lastFourDigits: '12', creditLimit: 50000, cutoffDay: 10, paymentDueDay: 5 }).isValid).toBe(false)
      expect(validateCreditCardInput({ name: 'Visa', bank: 'BHD', lastFourDigits: '1234', creditLimit: 50000, cutoffDay: 35, paymentDueDay: 5 }).isValid).toBe(false)
    })

    it('validates credit transaction', () => {
      const res = validateCreditTransactionInput({
        cardId: 'card-1',
        description: 'Compra Electrónica',
        amount: 15000,
        date: '2026-09-01',
        category: 'entertainment',
        installments: 3,
      }, mockCards)
      expect(res.isValid).toBe(true)
      expect(res.targetPeriod).toBe('2026-09')
    })

    it('rejects transaction for non-existent card', () => {
      const res = validateCreditTransactionInput({
        cardId: 'non-existent-card',
        description: 'Compra',
        amount: 1000,
        date: '2026-09-01',
      }, mockCards)
      expect(res.isValid).toBe(false)
    })
  })

  describe('Cash, Budget & Savings Goals', () => {
    it('validates cash withdrawal', () => {
      const res = validateCashWithdrawalInput({
        amount: 5000,
        reason: 'pocket_money',
        note: 'Cajero Automático',
        date: '2026-09-01',
      })
      expect(res.isValid).toBe(true)
      expect(res.targetPeriod).toBe('2026-09')
    })

    it('validates budget limits', () => {
      const res = validateBudgetInput({
        category: 'food',
        limitAmount: 18000,
      })
      expect(res.isValid).toBe(true)
      expect(res.data?.limitAmount).toBe(18000)
    })

    it('validates savings goals', () => {
      const res = validateSavingsGoalInput({
        name: 'Fondo de Emergencia',
        targetAmount: 200000,
        currentAmount: 50000,
        monthlyContribution: 10000,
      })
      expect(res.isValid).toBe(true)
      expect(res.data?.targetAmount).toBe(200000)
    })
  })
})
