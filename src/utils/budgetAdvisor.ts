// src/utils/budgetAdvisor.ts
import type {
  Expense,
  Income,
  ExpenseCategory,
  CategoryBudgetStatus,
  Rule503020Breakdown,
  SavingsGoal,
} from '../types/finance'

export const NEEDS_CATEGORIES: ExpenseCategory[] = ['housing', 'food', 'transport', 'utilities', 'health']
export const WANTS_CATEGORIES: ExpenseCategory[] = ['entertainment', 'education', 'other']
export const DEBT_CATEGORIES: ExpenseCategory[] = ['debt']

export const DEFAULT_CATEGORY_PERCENTAGES: Record<ExpenseCategory, number> = {
  housing: 0.25,       // 25% del ingreso
  food: 0.15,          // 15%
  transport: 0.08,     // 8%
  utilities: 0.07,     // 7%
  health: 0.05,        // 5%
  entertainment: 0.08, // 8%
  education: 0.05,     // 5%
  debt: 0.10,          // 10%
  other: 0.05,         // 5%
}

/**
 * Calcula el gasto total acumulado en una categoría específica durante un período.
 */
export function calculateCategorySpending(
  category: ExpenseCategory,
  expenses: Expense[],
  currentPeriod: string
): number {
  return expenses
    .filter(e => e.period === currentPeriod && e.category === category)
    .reduce((sum, e) => sum + e.amount, 0)
}

/**
 * Evalúa el estado y consumo de un presupuesto por categoría (Verde, Ámbar, Rojo).
 */
export function calculateCategoryBudgetStatus(
  category: ExpenseCategory,
  limit: number,
  expenses: Expense[],
  currentPeriod: string
): CategoryBudgetStatus {
  const spent = calculateCategorySpending(category, expenses, currentPeriod)
  const remaining = Math.max(0, limit - spent)
  const percentUsed = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 100 : 0)

  let status: 'safe' | 'warning' | 'danger' | 'exceeded' = 'safe'
  if (limit > 0 && spent > limit) {
    status = 'exceeded'
  } else if (percentUsed >= 90) {
    status = 'danger'
  } else if (percentUsed >= 70) {
    status = 'warning'
  }

  return {
    category,
    spent,
    limit,
    remaining,
    percentUsed: Math.round(percentUsed * 10) / 10,
    status,
  }
}

/**
 * Auto-sugiere presupuestos inteligentes basados en el historial real de gastos o en el ingreso total.
 */
export function suggestCategoryBudgetsFromHistory(
  expenses: Expense[],
  incomes: Income[],
  currentPeriod: string
): Record<ExpenseCategory, number> {
  const allCategories: ExpenseCategory[] = [
    'housing', 'food', 'transport', 'utilities',
    'health', 'entertainment', 'education', 'debt', 'other'
  ]

  const periodIncome = incomes
    .filter(i => i.period === currentPeriod)
    .reduce((sum, i) => sum + i.amount, 0)

  const result: Partial<Record<ExpenseCategory, number>> = {}

  for (const cat of allCategories) {
    const catExpenses = expenses.filter(e => e.category === cat)
    if (catExpenses.length > 0) {
      // Calcular promedio por período con movimientos
      const catPeriods = Array.from(new Set(catExpenses.map(e => e.period)))
      const totalCatSpent = catExpenses.reduce((s, e) => s + e.amount, 0)
      const avgSpent = catPeriods.length > 0 ? totalCatSpent / catPeriods.length : 0

      // Sugerir un límite con un 5% de holgura redondeado a la centena más cercana
      const suggested = Math.ceil((avgSpent * 1.05) / 100) * 100
      result[cat] = Math.max(500, suggested)
    } else if (periodIncome > 0) {
      // Si no hay historial en la categoría pero hay ingreso, sugerir según distribución prudente
      const ratio = DEFAULT_CATEGORY_PERCENTAGES[cat] || 0.05
      const suggested = Math.ceil((periodIncome * ratio) / 100) * 100
      result[cat] = Math.max(500, suggested)
    } else {
      result[cat] = 0
    }
  }

  return result as Record<ExpenseCategory, number>
}

/**
 * Evalúa el cumplimiento de la Regla Financiera 50/30/20.
 */
export function evaluate503020Rule(
  incomes: Income[],
  expenses: Expense[],
  balance: number,
  currentPeriod: string
): Rule503020Breakdown {
  const periodIncomes = incomes.filter(i => i.period === currentPeriod)
  const periodExpenses = expenses.filter(e => e.period === currentPeriod)

  const income = periodIncomes.reduce((sum, i) => sum + i.amount, 0)

  const needsSpent = periodExpenses
    .filter(e => NEEDS_CATEGORIES.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0)

  const wantsSpent = periodExpenses
    .filter(e => WANTS_CATEGORIES.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0)

  const debtSpent = periodExpenses
    .filter(e => DEBT_CATEGORIES.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0)

  const netSavings = Math.max(0, balance)
  const savingsSpent = netSavings + debtSpent

  const needsTarget = income * 0.50
  const wantsTarget = income * 0.30
  const savingsTarget = income * 0.20

  const needsPercent = income > 0 ? (needsSpent / income) * 100 : 0
  const wantsPercent = income > 0 ? (wantsSpent / income) * 100 : 0
  const savingsPercent = income > 0 ? (savingsSpent / income) * 100 : 0

  return {
    income,
    needsSpent,
    needsTarget,
    needsPercent: Math.round(needsPercent * 10) / 10,
    wantsSpent,
    wantsTarget,
    wantsPercent: Math.round(wantsPercent * 10) / 10,
    savingsSpent,
    savingsTarget,
    savingsPercent: Math.round(savingsPercent * 10) / 10,
  }
}

/**
 * Proyecta la fecha estimada de cumplimiento de una meta de ahorro.
 */
export function calculateSavingsGoalProjection(
  goal: SavingsGoal,
  availableMonthlySavings: number = 0
): {
  monthsRemaining: number
  projectedCompletionDate: string
  percentCompleted: number
} {
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount)
  const percentCompleted = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : (goal.currentAmount >= goal.targetAmount ? 100 : 0)

  if (remainingAmount === 0 || goal.isCompleted) {
    return {
      monthsRemaining: 0,
      projectedCompletionDate: '¡Meta alcanzada!',
      percentCompleted: 100,
    }
  }

  const effectiveContribution = goal.monthlyContribution && goal.monthlyContribution > 0
    ? goal.monthlyContribution
    : (availableMonthlySavings > 0 ? availableMonthlySavings : 0)

  if (effectiveContribution <= 0) {
    return {
      monthsRemaining: Infinity,
      projectedCompletionDate: 'Sin aportes mensuales definidos',
      percentCompleted,
    }
  }

  const monthsRemaining = Math.ceil(remainingAmount / effectiveContribution)

  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthsRemaining, 1)
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const projectedCompletionDate = `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`

  return {
    monthsRemaining,
    projectedCompletionDate,
    percentCompleted,
  }
}
