import { describe, it, expect } from 'vitest'
import {
  getDaysUntilCutoff,
  getDaysUntilPayment,
  evaluateCardHealth,
  getConsolidatedCreditSummary,
} from '../creditAdvisor'
import type { CreditCard, CreditCardTransaction } from '../../types/finance'

const mockCard: CreditCard = {
  id: 'card-1',
  name: 'Visa Signature',
  bank: 'Banco BHD',
  lastFourDigits: '4821',
  creditLimit: 100000,
  cutoffDay: 15,
  paymentDueDay: 5,
  interestRate: 4.5,
  color: 'gold',
}

const mockTransactions: CreditCardTransaction[] = [
  {
    id: 'tx-1',
    cardId: 'card-1',
    period: '2026-08',
    description: 'Supermercado',
    amount: 15000,
    category: 'food',
    date: '2026-08-16',
    installments: 1,
    currentInstallment: 1,
    isPaid: false,
  },
  {
    id: 'tx-2',
    cardId: 'card-1',
    period: '2026-08',
    description: 'Vuelo',
    amount: 10000,
    category: 'transport',
    date: '2026-08-17',
    installments: 1,
    currentInstallment: 1,
    isPaid: false,
  },
]

describe('Credit Advisor and Card Health Engine', () => {
  it('calculates days until cutoff correctly', () => {
    const refDate = new Date(2026, 7, 10) // 10 de Agosto (Corte es el 15)
    const days = getDaysUntilCutoff(15, refDate)
    expect(days).toBe(5)
  })

  it('calculates days until payment due correctly when in next month', () => {
    const refDate = new Date(2026, 7, 20) // 20 de Agosto (Pago es el 5 de Septiembre)
    // Agosto tiene 31 días. Del 20 al 31 = 11 días. + 5 días en Septiembre = 16 días
    const days = getDaysUntilPayment(5, refDate)
    expect(days).toBe(16)
  })

  it('evaluates optimal card health (<30% utilization)', () => {
    const refDate = new Date(2026, 7, 18)
    const health = evaluateCardHealth(mockCard, mockTransactions, refDate)

    expect(health.totalDebt).toBe(25000)
    expect(health.availableCredit).toBe(75000)
    expect(health.utilizationRate).toBe(25)
    expect(health.statusLevel).toBe('optimal')
  })

  it('evaluates warning card health when utilization exceeds 50%', () => {
    const highTransactions: CreditCardTransaction[] = [
      {
        id: 'tx-high',
        cardId: 'card-1',
        period: '2026-08',
        description: 'Laptop',
        amount: 60000,
        category: 'other',
        date: '2026-08-01',
        installments: 1,
        currentInstallment: 1,
        isPaid: false,
      },
    ]

    const health = evaluateCardHealth(mockCard, highTransactions, new Date(2026, 7, 10))
    expect(health.utilizationRate).toBe(60)
    expect(health.statusLevel).toBe('warning')
  })

  it('calculates consolidated summary across multiple cards', () => {
    const summary = getConsolidatedCreditSummary([mockCard], mockTransactions)
    expect(summary.totalLimit).toBe(100000)
    expect(summary.totalDebt).toBe(25000)
    expect(summary.availableCredit).toBe(75000)
    expect(summary.utilizationRate).toBe(25)
  })
})
