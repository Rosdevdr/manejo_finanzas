import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Income, Expense, CashWithdrawal, IncomeType, ExpenseCategory, ExpenseType, PaymentMethod, CashReason } from '../types/finance'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const KEYS = {
  incomes:  'aureus_incomes',
  expenses: 'aureus_expenses',
  cash:     'aureus_cash',
} as const

function loadLocal<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function saveLocal<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // quota exceeded — fail silently
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

export function useFinanceStorage(user?: User | null) {
  const [incomes,  setIncomesState]  = useState<Income[]>(()  => loadLocal(KEYS.incomes,  DEFAULT_INCOMES))
  const [expenses, setExpensesState] = useState<Expense[]>(() => loadLocal(KEYS.expenses, DEFAULT_EXPENSES))
  const [cash,     setCashState]     = useState<CashWithdrawal[]>(() => loadLocal(KEYS.cash, DEFAULT_CASH))

  // Sincronización inicial y Realtime con Supabase cuando el usuario está logueado
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !user) {
      return
    }

    const userId = user.id
    let isMounted = true

    async function loadData() {
      if (!supabase) return
      try {
        const [incRes, expRes, cashRes] = await Promise.all([
          supabase.from('incomes').select('*').eq('user_id', userId).order('date', { ascending: false }),
          supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
          supabase.from('cash_withdrawals').select('*').eq('user_id', userId).order('date', { ascending: false }),
        ])

        if (!isMounted) return

        if (incRes.data) {
          setIncomesState(incRes.data.map(row => ({
            id: row.id,
            period: row.period,
            description: row.description,
            amount: Number(row.amount),
            type: row.type as IncomeType,
            date: row.date,
          })))
        }

        if (expRes.data) {
          setExpensesState(expRes.data.map(row => ({
            id: row.id,
            period: row.period,
            description: row.description,
            amount: Number(row.amount),
            category: row.category as ExpenseCategory,
            type: row.type as ExpenseType,
            paymentMethod: row.payment_method as PaymentMethod,
            date: row.date,
          })))
        }

        if (cashRes.data) {
          setCashState(cashRes.data.map(row => ({
            id: row.id,
            period: row.period,
            amount: Number(row.amount),
            reason: row.reason as CashReason,
            note: row.note ?? undefined,
            date: row.date,
          })))
        }
      } catch {
        // Usar estado local si hay fallo de conexión
      }
    }

    loadData()

    // Suscripción Realtime vía WebSockets (IRT)
    const channel = supabase
      .channel(`realtime-finance-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomes', filter: `user_id=eq.${userId}` }, () => {
        loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${userId}` }, () => {
        loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_withdrawals', filter: `user_id=eq.${userId}` }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      isMounted = false
      if (supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  // Persistir en LocalStorage como fallback local cuando no está conectado
  useEffect(() => {
    if (!user) {
      saveLocal(KEYS.incomes,  incomes)
      saveLocal(KEYS.expenses, expenses)
      saveLocal(KEYS.cash,     cash)
    }
  }, [incomes, expenses, cash, user])

  // --- Acciones de Ingresos ---
  const addIncome = async (d: Omit<Income, 'id'>) => {
    const newId = `inc-${Date.now()}`
    const item: Income = { ...d, id: newId }
    setIncomesState(prev => [item, ...prev])

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('incomes').insert({
        id: newId,
        user_id: user.id,
        period: d.period,
        description: d.description,
        amount: d.amount,
        type: d.type,
        date: d.date,
      })
    }
  }

  const updateIncome = async (updated: Income) => {
    setIncomesState(prev => prev.map(i => i.id === updated.id ? updated : i))

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('incomes').update({
        description: updated.description,
        amount: updated.amount,
        type: updated.type,
        date: updated.date,
        period: updated.period,
      }).eq('id', updated.id)
    }
  }

  const deleteIncome = async (id: string) => {
    setIncomesState(prev => prev.filter(i => i.id !== id))

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('incomes').delete().eq('id', id)
    }
  }

  // --- Acciones de Gastos ---
  const addExpense = async (d: Omit<Expense, 'id'>) => {
    const newId = `exp-${Date.now()}`
    const item: Expense = { ...d, id: newId }
    setExpensesState(prev => [item, ...prev])

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('expenses').insert({
        id: newId,
        user_id: user.id,
        period: d.period,
        description: d.description,
        amount: d.amount,
        category: d.category,
        type: d.type,
        payment_method: d.paymentMethod,
        date: d.date,
      })
    }
  }

  const updateExpense = async (updated: Expense) => {
    setExpensesState(prev => prev.map(e => e.id === updated.id ? updated : e))

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('expenses').update({
        description: updated.description,
        amount: updated.amount,
        category: updated.category,
        type: updated.type,
        payment_method: updated.paymentMethod,
        date: updated.date,
        period: updated.period,
      }).eq('id', updated.id)
    }
  }

  const deleteExpense = async (id: string) => {
    setExpensesState(prev => prev.filter(e => e.id !== id))

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('expenses').delete().eq('id', id)
    }
  }

  // --- Acciones de Retiros en Efectivo ---
  const addWithdrawal = async (d: Omit<CashWithdrawal, 'id'>) => {
    const newId = `cash-${Date.now()}`
    const item: CashWithdrawal = { ...d, id: newId }
    setCashState(prev => [item, ...prev])

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('cash_withdrawals').insert({
        id: newId,
        user_id: user.id,
        period: d.period,
        amount: d.amount,
        reason: d.reason,
        note: d.note ?? null,
        date: d.date,
      })
    }
  }

  const deleteWithdrawal = async (id: string) => {
    setCashState(prev => prev.filter(c => c.id !== id))

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('cash_withdrawals').delete().eq('id', id)
    }
  }

  return {
    incomes, expenses, cash,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense,
    addWithdrawal, deleteWithdrawal,
  }
}
