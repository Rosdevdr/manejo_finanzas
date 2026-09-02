import { useState, useEffect, useCallback, useRef } from 'react'
import type { User, RealtimeChannel } from '@supabase/supabase-js'
import type {
  Income,
  Expense,
  CashWithdrawal,
  CreditCard,
  CreditCardTransaction,
  CategoryBudget,
  SavingsGoal,
  IncomeType,
  ExpenseCategory,
  ExpenseType,
  PaymentMethod,
  CashReason,
  CardThemeColor,
  GoalCategory,
} from '../types/finance'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { sanitizeAmount } from '../utils/security'
import {
  validateIncomeInput,
  validateExpenseInput,
  validateCashWithdrawalInput,
  validateCreditCardInput,
  validateCreditTransactionInput,
  validateBudgetInput,
  validateSavingsGoalInput,
} from '../utils/bllValidator'

export function getStorageKeys(userId?: string | null) {
  const prefix = userId ? `aureus_user_${userId}` : 'aureus_demo'
  return {
    incomes:            `${prefix}_incomes`,
    expenses:           `${prefix}_expenses`,
    cash:               `${prefix}_cash`,
    creditCards:        `${prefix}_credit_cards`,
    creditTransactions: `${prefix}_credit_transactions`,
    categoryBudgets:    `${prefix}_category_budgets`,
    savingsGoals:       `${prefix}_savings_goals`,
  }
}

function cleanLegacyStorage() {
  const legacy = [
    'aureus_incomes',
    'aureus_expenses',
    'aureus_cash',
    'aureus_credit_cards',
    'aureus_credit_transactions',
    'aureus_category_budgets',
    'aureus_savings_goals',
  ]
  legacy.forEach(k => {
    try { localStorage.removeItem(k) } catch {}
  })
}

function loadLocal<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback
  } catch {
    return fallback
  }
}

function saveLocal<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // fail silently
  }
}

const DEFAULT_INCOMES: Income[] = [
  // Septiembre 2026 (Período actual)
  { id: 'inc-demo-sep-1', description: 'Sueldo Principal (Senior Software Engineer)', amount: 95000, type: 'salary', date: '2026-09-01', period: '2026-09' },
  { id: 'inc-demo-sep-2', description: 'Desarrollo App Móvil Freelance', amount: 28000, type: 'freelance', date: '2026-09-05', period: '2026-09' },
  { id: 'inc-demo-sep-3', description: 'Rendimientos / Dividendos ETF', amount: 4500, type: 'investment', date: '2026-09-10', period: '2026-09' },

  // Agosto 2026 (Mes anterior para comparativa)
  { id: 'inc-demo-ago-1', description: 'Sueldo Principal (Senior Software Engineer)', amount: 95000, type: 'salary', date: '2026-08-01', period: '2026-08' },
  { id: 'inc-demo-ago-2', description: 'Consultoría Web E-commerce', amount: 22500, type: 'freelance', date: '2026-08-08', period: '2026-08' },
  { id: 'inc-demo-ago-3', description: 'Rendimientos Fondo Indexado', amount: 4200, type: 'investment', date: '2026-08-10', period: '2026-08' },

  // Julio 2026 (Histórico)
  { id: 'inc-demo-jul-1', description: 'Sueldo Principal', amount: 90000, type: 'salary', date: '2026-07-01', period: '2026-07' },
  { id: 'inc-demo-jul-2', description: 'Proyecto Frontend Web', amount: 18000, type: 'freelance', date: '2026-07-15', period: '2026-07' },
]

const DEFAULT_EXPENSES: Expense[] = [
  // Septiembre 2026
  { id: 'exp-demo-sep-1', description: 'Alquiler Apartamento Torre Bella Vista', amount: 28000, category: 'housing', type: 'fixed', paymentMethod: 'bank_transfer', date: '2026-09-02', period: '2026-09' },
  { id: 'exp-demo-sep-2', description: 'Supermercado Nacional & Despensa', amount: 13500, category: 'food', type: 'variable', paymentMethod: 'debit_card', date: '2026-09-03', period: '2026-09' },
  { id: 'exp-demo-sep-3', description: 'Servicios (Internet Fibra + Luz)', amount: 3400, category: 'utilities', type: 'fixed', paymentMethod: 'bank_transfer', date: '2026-09-04', period: '2026-09' },
  { id: 'exp-demo-sep-4', description: 'Combustible Vehículo', amount: 5500, category: 'transport', type: 'variable', paymentMethod: 'credit_card', date: '2026-09-05', period: '2026-09' },
  { id: 'exp-demo-sep-5', description: 'Cena Restaurante & Salida Fin de Semana', amount: 3600, category: 'entertainment', type: 'variable', paymentMethod: 'credit_card', date: '2026-09-06', period: '2026-09' },

  // Agosto 2026
  { id: 'exp-demo-ago-1', description: 'Alquiler Apartamento', amount: 28000, category: 'housing', type: 'fixed', paymentMethod: 'bank_transfer', date: '2026-08-02', period: '2026-08' },
  { id: 'exp-demo-ago-2', description: 'Supermercado & Despensa', amount: 14500, category: 'food', type: 'variable', paymentMethod: 'debit_card', date: '2026-08-04', period: '2026-08' },
  { id: 'exp-demo-ago-3', description: 'Servicios Básicos', amount: 3200, category: 'utilities', type: 'fixed', paymentMethod: 'bank_transfer', date: '2026-08-05', period: '2026-08' },
  { id: 'exp-demo-ago-4', description: 'Gasolina', amount: 6000, category: 'transport', type: 'variable', paymentMethod: 'credit_card', date: '2026-08-06', period: '2026-08' },
  { id: 'exp-demo-ago-5', description: 'Ocio y Salidas', amount: 4800, category: 'entertainment', type: 'variable', paymentMethod: 'credit_card', date: '2026-08-07', period: '2026-08' },

  // Julio 2026
  { id: 'exp-demo-jul-1', description: 'Alquiler Apartamento', amount: 28000, category: 'housing', type: 'fixed', paymentMethod: 'bank_transfer', date: '2026-07-02', period: '2026-07' },
  { id: 'exp-demo-jul-2', description: 'Supermercado', amount: 16200, category: 'food', type: 'variable', paymentMethod: 'debit_card', date: '2026-07-05', period: '2026-07' },
  { id: 'exp-demo-jul-3', description: 'Servicios (Luz e Internet)', amount: 3100, category: 'utilities', type: 'fixed', paymentMethod: 'bank_transfer', date: '2026-07-06', period: '2026-07' },
]

const DEFAULT_CASH: CashWithdrawal[] = [
  { id: 'cash-demo-1', amount: 8000, reason: 'pocket_money', note: 'Cajero Plaza Central (Gastos menores)', date: '2026-09-02', period: '2026-09' },
  { id: 'cash-demo-2', amount: 10000, reason: 'pocket_money', note: 'Cajero Bella Vista', date: '2026-08-03', period: '2026-08' },
  { id: 'cash-demo-3', amount: 8000, reason: 'pocket_money', note: 'Cajero Bella Vista', date: '2026-07-04', period: '2026-07' },
]

const DEFAULT_CARDS: CreditCard[] = [
  {
    id: 'card-1',
    name: 'Visa Signature',
    bank: 'Banco BHD',
    lastFourDigits: '4821',
    creditLimit: 120000,
    cutoffDay: 15,
    paymentDueDay: 5,
    interestRate: 4.2,
    color: 'gold',
  },
  {
    id: 'card-2',
    name: 'Mastercard Platinum',
    bank: 'Banreservas',
    lastFourDigits: '9012',
    creditLimit: 85000,
    cutoffDay: 22,
    paymentDueDay: 12,
    interestRate: 4.5,
    color: 'emerald',
  },
]

const DEFAULT_CARD_TRANSACTIONS: CreditCardTransaction[] = [
  {
    id: 'ctx-demo-1',
    cardId: 'card-1',
    period: '2026-09',
    description: 'Boletos Aéreos Vacaciones',
    amount: 18500,
    category: 'entertainment',
    date: '2026-09-03',
    installments: 3,
    currentInstallment: 1,
    isPaid: false,
  },
  {
    id: 'ctx-demo-2',
    cardId: 'card-1',
    period: '2026-09',
    description: 'Renovación Licencias & Software IDE',
    amount: 6800,
    category: 'education',
    date: '2026-09-05',
    installments: 1,
    currentInstallment: 1,
    isPaid: false,
  },
  {
    id: 'ctx-demo-3',
    cardId: 'card-2',
    period: '2026-09',
    description: 'Mantenimiento Preventivo Vehículo',
    amount: 12500,
    category: 'transport',
    date: '2026-09-04',
    installments: 1,
    currentInstallment: 1,
    isPaid: false,
  },
]

const DEFAULT_BUDGETS: CategoryBudget[] = [
  { id: 'bud-1', period: 'default', category: 'housing',       limitAmount: 30000 },
  { id: 'bud-2', period: 'default', category: 'food',          limitAmount: 18000 },
  { id: 'bud-3', period: 'default', category: 'transport',     limitAmount: 8000 },
  { id: 'bud-4', period: 'default', category: 'utilities',     limitAmount: 4500 },
  { id: 'bud-5', period: 'default', category: 'health',        limitAmount: 3500 },
  { id: 'bud-6', period: 'default', category: 'entertainment', limitAmount: 6000 },
  { id: 'bud-7', period: 'default', category: 'education',     limitAmount: 5000 },
  { id: 'bud-8', period: 'default', category: 'debt',          limitAmount: 10000 },
  { id: 'bud-9', period: 'default', category: 'other',         limitAmount: 4000 },
]

const DEFAULT_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Fondo de Emergencia (3 Meses)',
    targetAmount: 150000,
    currentAmount: 65000,
    monthlyContribution: 15000,
    category: 'emergency',
    color: '#34D399',
    isCompleted: false,
  },
  {
    id: 'goal-2',
    name: 'Vacaciones Fin de Año',
    targetAmount: 80000,
    currentAmount: 35000,
    monthlyContribution: 10000,
    targetDate: '2026-12-15',
    category: 'vacation',
    color: '#FBBF24',
    isCompleted: false,
  },
  {
    id: 'goal-3',
    name: 'Portafolio de Inversión / ETF',
    targetAmount: 200000,
    currentAmount: 90000,
    monthlyContribution: 20000,
    category: 'investment',
    color: '#C9A84C',
    isCompleted: false,
  },
]

export function useFinanceStorage(user?: User | null) {
  const [incomes,            setIncomesState]            = useState<Income[]>(() => !user ? loadLocal(getStorageKeys(null).incomes, DEFAULT_INCOMES) : loadLocal(getStorageKeys(user.id).incomes, []))
  const [expenses,           setExpensesState]           = useState<Expense[]>(() => !user ? loadLocal(getStorageKeys(null).expenses, DEFAULT_EXPENSES) : loadLocal(getStorageKeys(user.id).expenses, []))
  const [cash,               setCashState]               = useState<CashWithdrawal[]>(() => !user ? loadLocal(getStorageKeys(null).cash, DEFAULT_CASH) : loadLocal(getStorageKeys(user.id).cash, []))
  const [creditCards,        setCreditCardsState]        = useState<CreditCard[]>(() => !user ? loadLocal(getStorageKeys(null).creditCards, DEFAULT_CARDS) : loadLocal(getStorageKeys(user.id).creditCards, []))
  const [creditTransactions, setCreditTransactionsState] = useState<CreditCardTransaction[]>(() => !user ? loadLocal(getStorageKeys(null).creditTransactions, DEFAULT_CARD_TRANSACTIONS) : loadLocal(getStorageKeys(user.id).creditTransactions, []))
  const [categoryBudgets,    setCategoryBudgetsState]    = useState<CategoryBudget[]>(() => !user ? loadLocal(getStorageKeys(null).categoryBudgets, DEFAULT_BUDGETS) : loadLocal(getStorageKeys(user.id).categoryBudgets, []))
  const [savingsGoals,       setSavingsGoalsState]       = useState<SavingsGoal[]>(() => !user ? loadLocal(getStorageKeys(null).savingsGoals, DEFAULT_GOALS) : loadLocal(getStorageKeys(user.id).savingsGoals, []))

  const isMountedRef = useRef(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Limpiar claves legadas compartidas para evitar contaminación
  useEffect(() => {
    cleanLegacyStorage()
  }, [])

  // Sincronizar y aislar completamente el estado cuando el usuario inicia sesión o entra en modo Demo
  useEffect(() => {
    if (!user) {
      const demoKeys = getStorageKeys(null)
      setIncomesState(loadLocal(demoKeys.incomes, DEFAULT_INCOMES))
      setExpensesState(loadLocal(demoKeys.expenses, DEFAULT_EXPENSES))
      setCashState(loadLocal(demoKeys.cash, DEFAULT_CASH))
      setCreditCardsState(loadLocal(demoKeys.creditCards, DEFAULT_CARDS))
      setCreditTransactionsState(loadLocal(demoKeys.creditTransactions, DEFAULT_CARD_TRANSACTIONS))
      setCategoryBudgetsState(loadLocal(demoKeys.categoryBudgets, DEFAULT_BUDGETS))
      setSavingsGoalsState(loadLocal(demoKeys.savingsGoals, DEFAULT_GOALS))
    } else {
      const userKeys = getStorageKeys(user.id)
      setIncomesState(loadLocal(userKeys.incomes, []))
      setExpensesState(loadLocal(userKeys.expenses, []))
      setCashState(loadLocal(userKeys.cash, []))
      setCreditCardsState(loadLocal(userKeys.creditCards, []))
      setCreditTransactionsState(loadLocal(userKeys.creditTransactions, []))
      setCategoryBudgetsState(loadLocal(userKeys.categoryBudgets, []))
      setSavingsGoalsState(loadLocal(userKeys.savingsGoals, []))
    }
  }, [user])

  // Consulta directa a Supabase
  const loadData = useCallback(async () => {
    if (!user || !supabase || !isSupabaseConfigured) return
    const userId = user.id
    const userKeys = getStorageKeys(userId)

    try {
      const [incRes, expRes, cashRes, cardRes, ctxRes, budRes, goalRes] = await Promise.all([
        supabase.from('incomes').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('cash_withdrawals').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('credit_cards').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('credit_card_transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('category_budgets').select('*').eq('user_id', userId),
        supabase.from('savings_goals').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      ])

      if (!isMountedRef.current) return

      if (incRes.data) {
        const mapped = incRes.data.map(row => ({
          id: row.id,
          period: row.period,
          description: row.description,
          amount: Number(row.amount),
          type: row.type as IncomeType,
          date: row.date,
        }))
        setIncomesState(mapped)
        saveLocal(userKeys.incomes, mapped)
      }

      if (expRes.data) {
        const mapped = expRes.data.map(row => ({
          id: row.id,
          period: row.period,
          description: row.description,
          amount: Number(row.amount),
          category: row.category as ExpenseCategory,
          type: row.type as ExpenseType,
          paymentMethod: row.payment_method as PaymentMethod,
          date: row.date,
        }))
        setExpensesState(mapped)
        saveLocal(userKeys.expenses, mapped)
      }

      if (cashRes.data) {
        const mapped = cashRes.data.map(row => ({
          id: row.id,
          period: row.period,
          amount: Number(row.amount),
          reason: row.reason as CashReason,
          note: row.note ?? undefined,
          date: row.date,
        }))
        setCashState(mapped)
        saveLocal(userKeys.cash, mapped)
      }

      if (cardRes.data) {
        const mapped = cardRes.data.map(row => ({
          id: row.id,
          name: row.name,
          bank: row.bank,
          lastFourDigits: row.last_four_digits,
          creditLimit: Number(row.credit_limit),
          cutoffDay: Number(row.cutoff_day),
          paymentDueDay: Number(row.payment_due_day),
          interestRate: row.interest_rate ? Number(row.interest_rate) : undefined,
          color: row.color as CardThemeColor,
        }))
        setCreditCardsState(mapped)
        saveLocal(userKeys.creditCards, mapped)
      }

      if (ctxRes.data) {
        const mapped = ctxRes.data.map(row => ({
          id: row.id,
          cardId: row.card_id,
          period: row.period,
          description: row.description,
          amount: Number(row.amount),
          category: row.category as ExpenseCategory,
          date: row.date,
          installments: Number(row.installments || 1),
          currentInstallment: Number(row.current_installment || 1),
          isPaid: Boolean(row.is_paid),
        }))
        setCreditTransactionsState(mapped)
        saveLocal(userKeys.creditTransactions, mapped)
      }

      if (budRes.data) {
        const mapped = budRes.data.map(row => ({
          id: row.id,
          period: row.period,
          category: row.category as ExpenseCategory,
          limitAmount: Number(row.limit_amount),
        }))
        setCategoryBudgetsState(mapped)
        saveLocal(userKeys.categoryBudgets, mapped)
      }

      if (goalRes.data) {
        const mapped = goalRes.data.map(row => ({
          id: row.id,
          name: row.name,
          targetAmount: Number(row.target_amount),
          currentAmount: Number(row.current_amount || 0),
          monthlyContribution: row.monthly_contribution ? Number(row.monthly_contribution) : undefined,
          targetDate: row.target_date ?? undefined,
          category: row.category as GoalCategory,
          color: row.color || '#34D399',
          isCompleted: Boolean(row.is_completed),
        }))
        setSavingsGoalsState(mapped)
        saveLocal(userKeys.savingsGoals, mapped)
      }
    } catch (err) {
      console.error('Error al sincronizar datos con Supabase:', err)
    }
  }, [user])

  // Notificar a todos los demás dispositivos conectados vía Realtime Broadcast
  const notifyMutation = useCallback((entityName: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'finance_mutation',
        payload: { entity: entityName, timestamp: Date.now() },
      }).catch(() => {})
    }
  }, [])

  // Inicialización y Realtime con Supabase (Broadcast + Postgres Changes)
  useEffect(() => {
    isMountedRef.current = true
    if (!user || !supabase || !isSupabaseConfigured) {
      return
    }

    const userId = user.id

    const initFetch = async () => {
      await loadData()
    }
    void initFetch()

    // ⚡ Suscripción Híbrida: Broadcast de cliente a cliente + Cambios de Postgres WAL
    const channel = supabase
      .channel(`rt-aureus-${userId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on('broadcast', { event: 'finance_mutation' }, () => {
        void loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomes' }, () => {
        void loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        void loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_withdrawals' }, () => {
        void loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_cards' }, () => {
        void loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_card_transactions' }, () => {
        void loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_budgets' }, () => {
        void loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_goals' }, () => {
        void loadData()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void loadData()
        }
      })

    channelRef.current = channel

    // Sincronización al volver a ver la app en móvil
    const handleReactivation = () => {
      if (document.visibilityState === 'visible') {
        void loadData()
      }
    }

    window.addEventListener('visibilitychange', handleReactivation)
    window.addEventListener('focus', handleReactivation)
    window.addEventListener('online', handleReactivation)

    return () => {
      isMountedRef.current = false
      channelRef.current = null
      window.removeEventListener('visibilitychange', handleReactivation)
      window.removeEventListener('focus', handleReactivation)
      window.removeEventListener('online', handleReactivation)
      if (supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [user, loadData])

  // Heartbeat Polling: refetch de respaldo cada 4 segundos cuando la app está visible en pantalla
  useEffect(() => {
    if (!user || !supabase || !isSupabaseConfigured) return

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadData()
      }
    }, 4000)

    return () => clearInterval(timer)
  }, [user, loadData])

  // --- Acciones de Ingresos ---
  const addIncome = async (d: Omit<Income, 'id'>) => {
    const val = validateIncomeInput(d)
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Datos de ingreso inválidos' }
    }
    const cleanData = val.data
    const newId = `inc-${Date.now()}`
    const item: Income = { ...cleanData, id: newId }
    const keys = getStorageKeys(user?.id)

    setIncomesState(prev => {
      const next = [item, ...prev]
      saveLocal(keys.incomes, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('incomes').insert({
        id: newId,
        user_id: user.id,
        period: cleanData.period,
        description: cleanData.description,
        amount: cleanData.amount,
        type: cleanData.type,
        date: cleanData.date,
      })
      notifyMutation('incomes')
      void loadData()
    }
    return { success: true, targetPeriod: cleanData.period }
  }

  const updateIncome = async (updated: Income) => {
    const val = validateIncomeInput(updated)
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Datos de ingreso inválidos' }
    }
    const cleanItem: Income = { ...val.data, id: updated.id }
    const keys = getStorageKeys(user?.id)

    setIncomesState(prev => {
      const next = prev.map(i => i.id === updated.id ? cleanItem : i)
      saveLocal(keys.incomes, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('incomes').update({
        description: cleanItem.description,
        amount: cleanItem.amount,
        type: cleanItem.type,
        date: cleanItem.date,
        period: cleanItem.period,
      }).eq('id', updated.id)
      notifyMutation('incomes')
      void loadData()
    }
    return { success: true, targetPeriod: cleanItem.period }
  }

  const deleteIncome = async (id: string) => {
    const keys = getStorageKeys(user?.id)
    setIncomesState(prev => {
      const next = prev.filter(i => i.id !== id)
      saveLocal(keys.incomes, next)
      return next
    })
    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('incomes').delete().eq('id', id)
      notifyMutation('incomes')
      void loadData()
    }
  }

  // --- Acciones de Gastos ---
  const addExpense = async (d: Omit<Expense, 'id'>) => {
    const val = validateExpenseInput(d)
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Datos de gasto inválidos' }
    }
    const cleanData = val.data
    const newId = `exp-${Date.now()}`
    const item: Expense = { ...cleanData, id: newId }
    const keys = getStorageKeys(user?.id)

    setExpensesState(prev => {
      const next = [item, ...prev]
      saveLocal(keys.expenses, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('expenses').insert({
        id: newId,
        user_id: user.id,
        period: cleanData.period,
        description: cleanData.description,
        amount: cleanData.amount,
        category: cleanData.category,
        type: cleanData.type,
        payment_method: cleanData.paymentMethod,
        date: cleanData.date,
      })
      notifyMutation('expenses')
      void loadData()
    }
    return { success: true, targetPeriod: cleanData.period }
  }

  const updateExpense = async (updated: Expense) => {
    const val = validateExpenseInput(updated)
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Datos de gasto inválidos' }
    }
    const cleanItem: Expense = { ...val.data, id: updated.id }
    const keys = getStorageKeys(user?.id)

    setExpensesState(prev => {
      const next = prev.map(e => e.id === updated.id ? cleanItem : e)
      saveLocal(keys.expenses, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('expenses').update({
        description: cleanItem.description,
        amount: cleanItem.amount,
        category: cleanItem.category,
        type: cleanItem.type,
        payment_method: cleanItem.paymentMethod,
        date: cleanItem.date,
        period: cleanItem.period,
      }).eq('id', updated.id)
      notifyMutation('expenses')
      void loadData()
    }
    return { success: true, targetPeriod: cleanItem.period }
  }

  const deleteExpense = async (id: string) => {
    const keys = getStorageKeys(user?.id)
    setExpensesState(prev => {
      const next = prev.filter(e => e.id !== id)
      saveLocal(keys.expenses, next)
      return next
    })
    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('expenses').delete().eq('id', id)
      notifyMutation('expenses')
      void loadData()
    }
  }

  // --- Acciones de Efectivo ---
  const addWithdrawal = async (d: Omit<CashWithdrawal, 'id'>) => {
    const val = validateCashWithdrawalInput(d)
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Datos de retiro inválidos' }
    }
    const cleanData = val.data
    const newId = `cash-${Date.now()}`
    const item: CashWithdrawal = { ...cleanData, id: newId }
    const keys = getStorageKeys(user?.id)

    setCashState(prev => {
      const next = [item, ...prev]
      saveLocal(keys.cash, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('cash_withdrawals').insert({
        id: newId,
        user_id: user.id,
        period: cleanData.period,
        amount: cleanData.amount,
        reason: cleanData.reason,
        note: cleanData.note ?? null,
        date: cleanData.date,
      })
      notifyMutation('cash')
      void loadData()
    }
    return { success: true, targetPeriod: cleanData.period }
  }

  const deleteWithdrawal = async (id: string) => {
    const keys = getStorageKeys(user?.id)
    setCashState(prev => {
      const next = prev.filter(c => c.id !== id)
      saveLocal(keys.cash, next)
      return next
    })
    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('cash_withdrawals').delete().eq('id', id)
      notifyMutation('cash')
      void loadData()
    }
  }

  // --- Acciones de Tarjetas de Crédito ---
  const addCreditCard = async (d: Omit<CreditCard, 'id'>) => {
    const val = validateCreditCardInput(d)
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Datos de tarjeta inválidos' }
    }
    const cleanData = val.data
    const newId = `card-${Date.now()}`
    const item: CreditCard = { ...cleanData, id: newId }
    const keys = getStorageKeys(user?.id)

    setCreditCardsState(prev => {
      const next = [...prev, item]
      saveLocal(keys.creditCards, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_cards').insert({
        id: newId,
        user_id: user.id,
        name: cleanData.name,
        bank: cleanData.bank,
        last_four_digits: cleanData.lastFourDigits,
        credit_limit: cleanData.creditLimit,
        cutoff_day: cleanData.cutoffDay,
        payment_due_day: cleanData.paymentDueDay,
        interest_rate: cleanData.interestRate ?? null,
        color: cleanData.color,
      })
      notifyMutation('credit_cards')
      void loadData()
    }
    return { success: true }
  }

  const updateCreditCard = async (updated: CreditCard) => {
    const val = validateCreditCardInput(updated)
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Datos de tarjeta inválidos' }
    }
    const cleanCard: CreditCard = { ...val.data, id: updated.id }
    const keys = getStorageKeys(user?.id)

    setCreditCardsState(prev => {
      const next = prev.map(c => c.id === updated.id ? cleanCard : c)
      saveLocal(keys.creditCards, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_cards').update({
        name: cleanCard.name,
        bank: cleanCard.bank,
        last_four_digits: cleanCard.lastFourDigits,
        credit_limit: cleanCard.creditLimit,
        cutoff_day: cleanCard.cutoffDay,
        payment_due_day: cleanCard.paymentDueDay,
        interest_rate: cleanCard.interestRate ?? null,
        color: cleanCard.color,
      }).eq('id', updated.id)
      notifyMutation('credit_cards')
      void loadData()
    }
    return { success: true }
  }

  const deleteCreditCard = async (id: string) => {
    const keys = getStorageKeys(user?.id)
    setCreditCardsState(prev => {
      const next = prev.filter(c => c.id !== id)
      saveLocal(keys.creditCards, next)
      return next
    })
    setCreditTransactionsState(prev => {
      const next = prev.filter(t => t.cardId !== id)
      saveLocal(keys.creditTransactions, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_cards').delete().eq('id', id)
      await supabase.from('credit_card_transactions').delete().eq('card_id', id)
      notifyMutation('credit_cards')
      void loadData()
    }
  }

  // --- Acciones de Transacciones de Tarjeta ---
  const addCreditTransaction = async (d: Omit<CreditCardTransaction, 'id'>) => {
    const val = validateCreditTransactionInput(d, creditCards)
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Datos de consumo con tarjeta inválidos' }
    }
    const cleanData = val.data
    const newId = `ctx-${Date.now()}`
    const item: CreditCardTransaction = { ...cleanData, id: newId }
    const keys = getStorageKeys(user?.id)

    setCreditTransactionsState(prev => {
      const next = [item, ...prev]
      saveLocal(keys.creditTransactions, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_card_transactions').insert({
        id: newId,
        user_id: user.id,
        card_id: cleanData.cardId,
        period: cleanData.period,
        description: cleanData.description,
        amount: cleanData.amount,
        category: cleanData.category,
        date: cleanData.date,
        installments: cleanData.installments,
        current_installment: cleanData.currentInstallment,
        is_paid: cleanData.isPaid,
      })
      notifyMutation('credit_transactions')
      void loadData()
    }
    return { success: true, targetPeriod: cleanData.period }
  }

  const updateCreditTransaction = async (updated: CreditCardTransaction) => {
    const val = validateCreditTransactionInput(updated, creditCards)
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Datos de consumo inválidos' }
    }
    const cleanItem: CreditCardTransaction = { ...val.data, id: updated.id }
    const keys = getStorageKeys(user?.id)

    setCreditTransactionsState(prev => {
      const next = prev.map(t => t.id === updated.id ? cleanItem : t)
      saveLocal(keys.creditTransactions, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_card_transactions').update({
        card_id: cleanItem.cardId,
        description: cleanItem.description,
        amount: cleanItem.amount,
        category: cleanItem.category,
        date: cleanItem.date,
        period: cleanItem.period,
        installments: cleanItem.installments,
        current_installment: cleanItem.currentInstallment,
        is_paid: cleanItem.isPaid,
      }).eq('id', updated.id)
      notifyMutation('credit_transactions')
      void loadData()
    }
    return { success: true, targetPeriod: cleanItem.period }
  }

  const deleteCreditTransaction = async (id: string) => {
    const keys = getStorageKeys(user?.id)
    setCreditTransactionsState(prev => {
      const next = prev.filter(t => t.id !== id)
      saveLocal(keys.creditTransactions, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_card_transactions').delete().eq('id', id)
      notifyMutation('credit_transactions')
      void loadData()
    }
  }

  const toggleTransactionPaid = async (id: string) => {
    const target = creditTransactions.find(t => t.id === id)
    if (!target) return
    const updated = { ...target, isPaid: !target.isPaid }
    await updateCreditTransaction(updated)
  }

  // --- Acciones de Presupuestos por Categoría ---
  const setCategoryBudget = async (category: ExpenseCategory, limitAmount: number, period: string = 'default') => {
    const val = validateBudgetInput({ category, limitAmount, period })
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Presupuesto inválido' }
    }
    const cleanLimit = val.data.limitAmount
    const existing = categoryBudgets.find(b => b.category === category && (b.period === period || b.period === 'default'))
    const keys = getStorageKeys(user?.id)

    if (existing) {
      const updated: CategoryBudget = { ...existing, limitAmount: cleanLimit, period }
      setCategoryBudgetsState(prev => {
        const next = prev.map(b => b.id === existing.id ? updated : b)
        saveLocal(keys.categoryBudgets, next)
        return next
      })

      if (supabase && isSupabaseConfigured && user) {
        await supabase.from('category_budgets').upsert({
          id: existing.id,
          user_id: user.id,
          period,
          category,
          limit_amount: cleanLimit,
        })
        notifyMutation('category_budgets')
        void loadData()
      }
    } else {
      const newId = `bud-${Date.now()}-${category}`
      const newBudget: CategoryBudget = { id: newId, category, limitAmount: cleanLimit, period }
      setCategoryBudgetsState(prev => {
        const next = [...prev, newBudget]
        saveLocal(keys.categoryBudgets, next)
        return next
      })

      if (supabase && isSupabaseConfigured && user) {
        await supabase.from('category_budgets').insert({
          id: newId,
          user_id: user.id,
          period,
          category,
          limit_amount: cleanLimit,
        })
        notifyMutation('category_budgets')
        void loadData()
      }
    }
    return { success: true }
  }

  const setMultipleCategoryBudgets = async (budgetsMap: Record<ExpenseCategory, number>, period: string = 'default') => {
    const newBudgets: CategoryBudget[] = []
    const keys = getStorageKeys(user?.id)

    for (const [cat, limit] of Object.entries(budgetsMap)) {
      const category = cat as ExpenseCategory
      const cleanLimit = Math.max(0, sanitizeAmount(limit))
      const existing = categoryBudgets.find(b => b.category === category)
      const id = existing ? existing.id : `bud-${Date.now()}-${category}`
      newBudgets.push({ id, category, limitAmount: cleanLimit, period })
    }

    setCategoryBudgetsState(newBudgets)
    saveLocal(keys.categoryBudgets, newBudgets)

    if (supabase && isSupabaseConfigured && user) {
      const rows = newBudgets.map(b => ({
        id: b.id,
        user_id: user.id,
        period: b.period,
        category: b.category,
        limit_amount: b.limitAmount,
      }))
      await supabase.from('category_budgets').upsert(rows)
      notifyMutation('category_budgets')
      void loadData()
    }
    return { success: true }
  }

  // --- Acciones de Metas de Ahorro ---
  const addSavingsGoal = async (g: Omit<SavingsGoal, 'id'>) => {
    const val = validateSavingsGoalInput(g)
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Datos de meta inválidos' }
    }
    const cleanData = val.data
    const newId = `goal-${Date.now()}`
    const keys = getStorageKeys(user?.id)

    const item: SavingsGoal = {
      ...cleanData,
      id: newId,
      color: g.color || '#34D399',
      targetDate: g.targetDate,
      isCompleted: cleanData.currentAmount >= cleanData.targetAmount,
    }

    setSavingsGoalsState(prev => {
      const next = [...prev, item]
      saveLocal(keys.savingsGoals, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('savings_goals').insert({
        id: newId,
        user_id: user.id,
        name: cleanData.name,
        target_amount: cleanData.targetAmount,
        current_amount: cleanData.currentAmount,
        monthly_contribution: cleanData.monthlyContribution ?? null,
        target_date: g.targetDate ?? null,
        category: cleanData.category,
        color: g.color || '#34D399',
        is_completed: item.isCompleted,
      })
      notifyMutation('savings_goals')
      void loadData()
    }
    return { success: true }
  }

  const updateSavingsGoal = async (updated: SavingsGoal) => {
    const val = validateSavingsGoalInput(updated)
    if (!val.isValid || !val.data) {
      return { success: false, error: val.error || 'Datos de meta inválidos' }
    }
    const cleanData = val.data
    const isCompleted = cleanData.currentAmount >= cleanData.targetAmount
    const keys = getStorageKeys(user?.id)

    const cleanItem: SavingsGoal = {
      ...cleanData,
      id: updated.id,
      color: updated.color || '#34D399',
      targetDate: updated.targetDate,
      isCompleted,
    }

    setSavingsGoalsState(prev => {
      const next = prev.map(g => g.id === updated.id ? cleanItem : g)
      saveLocal(keys.savingsGoals, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('savings_goals').update({
        name: cleanData.name,
        target_amount: cleanData.targetAmount,
        current_amount: cleanData.currentAmount,
        monthly_contribution: cleanData.monthlyContribution ?? null,
        target_date: updated.targetDate ?? null,
        category: cleanData.category,
        color: updated.color || '#34D399',
        is_completed: isCompleted,
      }).eq('id', updated.id)
      notifyMutation('savings_goals')
      void loadData()
    }
    return { success: true }
  }

  const depositToGoal = async (goalId: string, amount: number) => {
    const target = savingsGoals.find(g => g.id === goalId)
    if (!target) return
    const cleanDeposit = sanitizeAmount(amount)
    const newCurrent = target.currentAmount + cleanDeposit
    await updateSavingsGoal({ ...target, currentAmount: newCurrent })
  }

  const deleteSavingsGoal = async (goalId: string) => {
    const keys = getStorageKeys(user?.id)
    setSavingsGoalsState(prev => {
      const next = prev.filter(g => g.id !== goalId)
      saveLocal(keys.savingsGoals, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('savings_goals').delete().eq('id', goalId)
      notifyMutation('savings_goals')
      void loadData()
    }
  }

  return {
    incomes, expenses, cash, creditCards, creditTransactions, categoryBudgets, savingsGoals,
    refreshData: loadData,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense,
    addWithdrawal, deleteWithdrawal,
    addCreditCard, updateCreditCard, deleteCreditCard,
    addCreditTransaction, updateCreditTransaction, deleteCreditTransaction, toggleTransactionPaid,
    setCategoryBudget, setMultipleCategoryBudgets,
    addSavingsGoal, updateSavingsGoal, depositToGoal, deleteSavingsGoal,
  }
}
