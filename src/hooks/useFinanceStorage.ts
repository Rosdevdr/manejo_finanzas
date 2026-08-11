import { useState, useEffect } from 'react'
import type { Income, Expense, CashWithdrawal } from '../types/finance'

const KEYS = {
  incomes:  'aureus_incomes',
  expenses: 'aureus_expenses',
  cash:     'aureus_cash',
} as const

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // storage quota exceeded — fail silently
  }
}

const DEFAULT_INCOMES: Income[] = [
  { id: 'inc-1', description: 'Sueldo Principal (Software Engineer)', amount: 85000, type: 'salary',     date: '2026-08-01', period: '2026-08' },
  { id: 'inc-2', description: 'Consultoría Web Freelance',            amount: 22500, type: 'freelance',  date: '2026-08-08', period: '2026-08' },
  { id: 'inc-3', description: 'Dividendos Fondos Indexados',          amount: 4500,  type: 'investment', date: '2026-08-10', period: '2026-08' },
]

const DEFAULT_EXPENSES: Expense[] = [
  { id: 'exp-1', description: 'Alquiler Apartamento',            amount: 28000, category: 'housing',       type: 'fixed',    paymentMethod: 'bank_transfer', date: '2026-08-02', period: '2026-08' },
  { id: 'exp-2', description: 'Supermercado & Despensa',         amount: 14500, category: 'food',          type: 'variable', paymentMethod: 'debit_card',    date: '2026-08-04', period: '2026-08' },
  { id: 'exp-3', description: 'Servicios (Luz, Agua, Internet)', amount: 3200,  category: 'utilities',     type: 'fixed',    paymentMethod: 'bank_transfer', date: '2026-08-05', period: '2026-08' },
  { id: 'exp-4', description: 'Transporte / Gasolina',           amount: 6000,  category: 'transport',     type: 'variable', paymentMethod: 'credit_card',   date: '2026-08-06', period: '2026-08' },
  { id: 'exp-5', description: 'Cena Restaurante & Salidas',      amount: 3800,  category: 'entertainment', type: 'variable', paymentMethod: 'credit_card',   date: '2026-08-07', period: '2026-08' },
  { id: 'exp-6', description: 'Farmacia & Medicamentos',         amount: 1900,  category: 'health',        type: 'variable', paymentMethod: 'cash',          date: '2026-08-09', period: '2026-08' },
]

const DEFAULT_CASH: CashWithdrawal[] = [
  { id: 'cash-1', amount: 10000, reason: 'pocket_money', note: 'Cajero Plaza Central', date: '2026-08-03', period: '2026-08' },
]

export function useFinanceStorage() {
  const [incomes,  setIncomesState]  = useState<Income[]>(()  => load(KEYS.incomes,  DEFAULT_INCOMES))
  const [expenses, setExpensesState] = useState<Expense[]>(() => load(KEYS.expenses, DEFAULT_EXPENSES))
  const [cash,     setCashState]     = useState<CashWithdrawal[]>(() => load(KEYS.cash, DEFAULT_CASH))

  // Persist on every change
  useEffect(() => { save(KEYS.incomes,  incomes)  }, [incomes])
  useEffect(() => { save(KEYS.expenses, expenses) }, [expenses])
  useEffect(() => { save(KEYS.cash,     cash)     }, [cash])

  // --- Income actions ---
  const addIncome = (d: Omit<Income, 'id'>) =>
    setIncomesState(prev => [{ ...d, id: `inc-${Date.now()}` }, ...prev])

  const updateIncome = (updated: Income) =>
    setIncomesState(prev => prev.map(i => i.id === updated.id ? updated : i))

  const deleteIncome = (id: string) =>
    setIncomesState(prev => prev.filter(i => i.id !== id))

  // --- Expense actions ---
  const addExpense = (d: Omit<Expense, 'id'>) =>
    setExpensesState(prev => [{ ...d, id: `exp-${Date.now()}` }, ...prev])

  const updateExpense = (updated: Expense) =>
    setExpensesState(prev => prev.map(e => e.id === updated.id ? updated : e))

  const deleteExpense = (id: string) =>
    setExpensesState(prev => prev.filter(e => e.id !== id))

  // --- Cash actions ---
  const addWithdrawal = (d: Omit<CashWithdrawal, 'id'>) =>
    setCashState(prev => [{ ...d, id: `cash-${Date.now()}` }, ...prev])

  const deleteWithdrawal = (id: string) =>
    setCashState(prev => prev.filter(c => c.id !== id))

  return {
    incomes, expenses, cash,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense,
    addWithdrawal, deleteWithdrawal,
  }
}
