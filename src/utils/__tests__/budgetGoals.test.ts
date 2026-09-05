import { describe, it, expect } from 'vitest'
import {
  calculateCategorySpending,
  calculateCategoryBudgetStatus,
  suggestCategoryBudgetsFromHistory,
  evaluate503020Rule,
  calculateSavingsGoalProjection,
} from '../budgetAdvisor'
import type { Expense, Income, SavingsGoal } from '../../types/finance'

describe('budgetAdvisor & Savings Goals Calculations', () => {
  const mockExpenses: Expense[] = [
    {
      id: 'e1',
      period: '2026-08',
      description: 'Alquiler',
      amount: 25000,
      category: 'housing',
      type: 'fixed',
      paymentMethod: 'bank_transfer',
      date: '2026-08-01',
    },
    {
      id: 'e2',
      period: '2026-08',
      description: 'Supermercado',
      amount: 12000,
      category: 'food',
      type: 'variable',
      paymentMethod: 'debit_card',
      date: '2026-08-05',
    },
    {
      id: 'e3',
      period: '2026-08',
      description: 'Cine y Salidas',
      amount: 4500,
      category: 'entertainment',
      type: 'variable',
      paymentMethod: 'credit_card',
      date: '2026-08-10',
    },
    {
      id: 'e4',
      period: '2026-08',
      description: 'Préstamo Personal',
      amount: 8000,
      category: 'debt',
      type: 'fixed',
      paymentMethod: 'bank_transfer',
      date: '2026-08-12',
    },
  ]

  const mockIncomes: Income[] = [
    {
      id: 'i1',
      period: '2026-08',
      description: 'Salario Software Engineer',
      amount: 80000,
      type: 'salary',
      date: '2026-08-01',
    },
  ]

  it('calculates category spending accurately for a period', () => {
    const foodSpent = calculateCategorySpending('food', mockExpenses, '2026-08')
    const transportSpent = calculateCategorySpending('transport', mockExpenses, '2026-08')

    expect(foodSpent).toBe(12000)
    expect(transportSpent).toBe(0)
  })

  it('determines budget consumption status correctly (safe, warning, danger, exceeded)', () => {
    // Safe (< 70%)
    const safeStatus = calculateCategoryBudgetStatus('food', 20000, mockExpenses, '2026-08')
    expect(safeStatus.percentUsed).toBe(60)
    expect(safeStatus.status).toBe('safe')
    expect(safeStatus.remaining).toBe(8000)

    // Warning (70% - 89%)
    const warningStatus = calculateCategoryBudgetStatus('food', 16000, mockExpenses, '2026-08')
    expect(warningStatus.percentUsed).toBe(75)
    expect(warningStatus.status).toBe('warning')

    // Danger (90% - 100%)
    const dangerStatus = calculateCategoryBudgetStatus('food', 13000, mockExpenses, '2026-08')
    expect(dangerStatus.percentUsed).toBe(92.3)
    expect(dangerStatus.status).toBe('danger')

    // Exceeded (> 100%)
    const exceededStatus = calculateCategoryBudgetStatus('food', 10000, mockExpenses, '2026-08')
    expect(exceededStatus.percentUsed).toBe(120)
    expect(exceededStatus.status).toBe('exceeded')
    expect(exceededStatus.remaining).toBe(0)
  })

  it('generates intelligent auto-suggestions based on real spending history', () => {
    const suggestions = suggestCategoryBudgetsFromHistory(mockExpenses, mockIncomes, '2026-08')

    // Category with real history: 12000 * 1.05 = 12600
    expect(suggestions.food).toBeGreaterThanOrEqual(12000)
    expect(suggestions.housing).toBeGreaterThanOrEqual(25000)

    // Category without history but with income (e.g. transport ~ 8% of 80000 = 6400)
    expect(suggestions.transport).toBe(6400)
  })

  it('evaluates the 50/30/20 financial rule properly', () => {
    const balance = 80000 - 49500 // 30500
    const rule = evaluate503020Rule(mockIncomes, mockExpenses, balance, '2026-08')

    expect(rule.income).toBe(80000)
    // Needs: Housing (25000) + Food (12000) = 37000 (46.3% vs 50% target)
    expect(rule.needsSpent).toBe(37000)
    expect(rule.needsTarget).toBe(40000)
    expect(rule.needsPercent).toBe(46.3)

    // Wants: Entertainment (4500) = 4500 (5.6% vs 30% target)
    expect(rule.wantsSpent).toBe(4500)
    expect(rule.wantsTarget).toBe(24000)
    expect(rule.wantsPercent).toBe(5.6)

    // Savings: Balance (30500) + Debt (8000) = 38500
    expect(rule.savingsSpent).toBe(38500)
    expect(rule.savingsTarget).toBe(16000)
    expect(rule.savingsPercent).toBe(48.1)
  })

  it('calculates savings goal projections and completion ETA accurately', () => {
    const activeGoal: SavingsGoal = {
      id: 'g1',
      name: 'Fondo de Emergencia',
      targetAmount: 100000,
      currentAmount: 40000,
      monthlyContribution: 10000,
      category: 'emergency',
    }

    const projection = calculateSavingsGoalProjection(activeGoal, 5000)
    expect(projection.percentCompleted).toBe(40)
    expect(projection.monthsRemaining).toBe(6) // (100000 - 40000) / 10000 = 6 months
    expect(projection.projectedCompletionDate).toBeTruthy()

    const completedGoal: SavingsGoal = {
      id: 'g2',
      name: 'Laptop M3',
      targetAmount: 50000,
      currentAmount: 50000,
      category: 'tech',
      isCompleted: true,
    }

    const completedProj = calculateSavingsGoalProjection(completedGoal, 5000)
    expect(completedProj.percentCompleted).toBe(100)
    expect(completedProj.monthsRemaining).toBe(0)
    expect(completedProj.projectedCompletionDate).toBe('¡Meta alcanzada!')
  })
})
