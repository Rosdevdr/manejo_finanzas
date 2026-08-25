import { describe, it, expect } from 'vitest'
import { generateAiFinancialResponse } from '../aiAdvisorEngine'
import type { Income, Expense } from '../../types/finance'

describe('aiAdvisorEngine', () => {
  const sampleIncomes: Income[] = [
    { id: 'inc-1', description: 'Sueldo', amount: 100000, type: 'salary', date: '2026-08-01', period: '2026-08' },
  ]

  const sampleExpenses: Expense[] = [
    { id: 'exp-1', description: 'Renta', amount: 30000, category: 'housing', type: 'fixed', paymentMethod: 'bank_transfer', date: '2026-08-02', period: '2026-08' },
    { id: 'exp-2', description: 'Comida', amount: 20000, category: 'food', type: 'variable', paymentMethod: 'debit_card', date: '2026-08-05', period: '2026-08' },
  ]

  const emptySnapshot = {
    currentPeriod: '2026-08',
    incomes: sampleIncomes,
    expenses: sampleExpenses,
    cashWithdrawals: [],
    creditCards: [],
    creditTransactions: [],
    categoryBudgets: [],
    savingsGoals: [],
  }

  it('generates spending capacity response', () => {
    const res = generateAiFinancialResponse('¿Cuánto dinero puedo gastar este mes?', emptySnapshot)
    expect(res).toContain('Margen de Gasto Disponible')
    expect(res).toContain('Ingresos Totales')
    expect(res).toContain('RD$100,000.00')
  })

  it('generates savings recommendations', () => {
    const res = generateAiFinancialResponse('¿Cuánto debería ahorrar?', emptySnapshot)
    expect(res).toContain('Estrategia de Ahorro')
    expect(res).toContain('RD$20,000.00') // 20% de 100,000
  })

  it('generates debt diagnosis response', () => {
    const res = generateAiFinancialResponse('¿Cómo liquido mis deudas de tarjeta de crédito?', emptySnapshot)
    expect(res).toContain('Diagnóstico y Plan de Deudas')
  })

  it('generates 50/30/20 rule diagnostics', () => {
    const res = generateAiFinancialResponse('Diagnóstico de la regla 50/30/20', emptySnapshot)
    expect(res).toContain('Regla Financiera 50 / 30 / 20')
  })

  it('generates cash flow forecasting response', () => {
    const res = generateAiFinancialResponse('Pronóstico de flujo de caja a 30 días', emptySnapshot)
    expect(res).toContain('Cash Flow Forecasting')
    expect(res).toContain('Proyección a 30 días')
  })

  it('generates saas metrics response (MRR, ARR, Churn)', () => {
    const res = generateAiFinancialResponse('Métricas recurrentes MRR y suscripciones', emptySnapshot)
    expect(res).toContain('MRR / ARR / Churn')
    expect(res).toContain('MRR Equivalente')
  })

  it('generates contract negotiation response', () => {
    const res = generateAiFinancialResponse('Estrategia de negociación de contratos', emptySnapshot)
    expect(res).toContain('Negociación de Contratos')
  })

  it('generates overall health assessment', () => {
    const res = generateAiFinancialResponse('Analiza mi salud financiera general', emptySnapshot)
    expect(res).toContain('Score de Salud Financiera')
  })
})
