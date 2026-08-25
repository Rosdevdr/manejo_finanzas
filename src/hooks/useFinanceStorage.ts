import { useState, useEffect, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
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
import { sanitizeString, sanitizeAmount } from '../utils/security'

const KEYS = {
  incomes:            'aureus_incomes',
  expenses:           'aureus_expenses',
  cash:               'aureus_cash',
  creditCards:        'aureus_credit_cards',
  creditTransactions: 'aureus_credit_transactions',
  categoryBudgets:    'aureus_category_budgets',
  savingsGoals:       'aureus_savings_goals',
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
    // fail silently
  }
}

const DEFAULT_INCOMES: Income[] = [
  { id: 'inc-1', description: 'Sueldo Principal (Software Engineer)', amount: 85000, type: 'salary',     date: '2026-08-01', period: '2026-08' },
  { id: 'inc-2', description: 'Consultoría Web Freelance',            amount: 22500, type: 'freelance',  date: '2026-08-08', period: '2026-08' },
  { id: 'inc-3', description: 'Dividendos Fondos Indexados',          amount: 4500,  type: 'investment', date: '2026-08-10', period: '2026-08' },
  { id: 'inc-prev-1', description: 'Sueldo Principal (Software Engineer)', amount: 85000, type: 'salary',     date: '2026-07-01', period: '2026-07' },
  { id: 'inc-prev-2', description: 'Proyecto Freelance Frontend',         amount: 18000, type: 'freelance',  date: '2026-07-15', period: '2026-07' },
]

const DEFAULT_EXPENSES: Expense[] = [
  { id: 'exp-1', description: 'Alquiler Apartamento',            amount: 28000, category: 'housing',       type: 'fixed',    paymentMethod: 'bank_transfer', date: '2026-08-02', period: '2026-08' },
  { id: 'exp-2', description: 'Supermercado & Despensa',         amount: 14500, category: 'food',          type: 'variable', paymentMethod: 'debit_card',    date: '2026-08-04', period: '2026-08' },
  { id: 'exp-3', description: 'Servicios (Luz, Agua, Internet)', amount: 3200,  category: 'utilities',     type: 'fixed',    paymentMethod: 'bank_transfer', date: '2026-08-05', period: '2026-08' },
  { id: 'exp-4', description: 'Transporte / Gasolina',           amount: 6000,  category: 'transport',     type: 'variable', paymentMethod: 'credit_card',   date: '2026-08-06', period: '2026-08' },
  { id: 'exp-5', description: 'Cena Restaurante & Salidas',      amount: 3800,  category: 'entertainment', type: 'variable', paymentMethod: 'credit_card',   date: '2026-08-07', period: '2026-08' },
  { id: 'exp-6', description: 'Farmacia & Medicamentos',         amount: 1900,  category: 'health',        type: 'variable', paymentMethod: 'cash',          date: '2026-08-09', period: '2026-08' },
  { id: 'exp-prev-1', description: 'Alquiler Apartamento',        amount: 28000, category: 'housing',       type: 'fixed',    paymentMethod: 'bank_transfer', date: '2026-07-02', period: '2026-07' },
  { id: 'exp-prev-2', description: 'Supermercado',                amount: 16200, category: 'food',          type: 'variable', paymentMethod: 'debit_card',    date: '2026-07-05', period: '2026-07' },
  { id: 'exp-prev-3', description: 'Servicios (Luz e Internet)',  amount: 3100,  category: 'utilities',     type: 'fixed',    paymentMethod: 'bank_transfer', date: '2026-07-06', period: '2026-07' },
  { id: 'exp-prev-4', description: 'Salidas y Entretenimiento',   amount: 5200,  category: 'entertainment', type: 'variable', paymentMethod: 'credit_card',   date: '2026-07-12', period: '2026-07' },
]

const DEFAULT_CASH: CashWithdrawal[] = [
  { id: 'cash-1', amount: 10000, reason: 'pocket_money', note: 'Cajero Plaza Central', date: '2026-08-03', period: '2026-08' },
  { id: 'cash-prev-1', amount: 8000, reason: 'pocket_money', note: 'Cajero Bella Vista', date: '2026-07-04', period: '2026-07' },
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
    id: 'ctx-1',
    cardId: 'card-1',
    period: '2026-08',
    description: 'Boletos Aéreos Vacaciones',
    amount: 24500,
    category: 'entertainment',
    date: '2026-08-06',
    installments: 3,
    currentInstallment: 1,
    isPaid: false,
  },
  {
    id: 'ctx-2',
    cardId: 'card-1',
    period: '2026-08',
    description: 'Renovación Licencias & Software',
    amount: 6800,
    category: 'education',
    date: '2026-08-08',
    installments: 1,
    currentInstallment: 1,
    isPaid: false,
  },
  {
    id: 'ctx-3',
    cardId: 'card-2',
    period: '2026-08',
    description: 'Mantenimiento Vehículo',
    amount: 12500,
    category: 'transport',
    date: '2026-08-04',
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
  const [incomes,            setIncomesState]            = useState<Income[]>(() => !user ? loadLocal(KEYS.incomes, DEFAULT_INCOMES) : [])
  const [expenses,           setExpensesState]           = useState<Expense[]>(() => !user ? loadLocal(KEYS.expenses, DEFAULT_EXPENSES) : [])
  const [cash,               setCashState]               = useState<CashWithdrawal[]>(() => !user ? loadLocal(KEYS.cash, DEFAULT_CASH) : [])
  const [creditCards,        setCreditCardsState]        = useState<CreditCard[]>(() => !user ? loadLocal(KEYS.creditCards, DEFAULT_CARDS) : [])
  const [creditTransactions, setCreditTransactionsState] = useState<CreditCardTransaction[]>(() => !user ? loadLocal(KEYS.creditTransactions, DEFAULT_CARD_TRANSACTIONS) : [])
  const [categoryBudgets,    setCategoryBudgetsState]    = useState<CategoryBudget[]>(() => !user ? loadLocal(KEYS.categoryBudgets, DEFAULT_BUDGETS) : [])
  const [savingsGoals,       setSavingsGoalsState]       = useState<SavingsGoal[]>(() => !user ? loadLocal(KEYS.savingsGoals, DEFAULT_GOALS) : [])

  const isMountedRef = useRef(true)

  // Consulta directa completa e instantánea a Supabase
  const loadData = useCallback(async () => {
    if (!user || !supabase || !isSupabaseConfigured) return
    const userId = user.id

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
        saveLocal(KEYS.incomes, mapped)
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
        saveLocal(KEYS.expenses, mapped)
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
        saveLocal(KEYS.cash, mapped)
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
        saveLocal(KEYS.creditCards, mapped)
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
        saveLocal(KEYS.creditTransactions, mapped)
      }

      if (budRes.data) {
        const mapped = budRes.data.map(row => ({
          id: row.id,
          period: row.period,
          category: row.category as ExpenseCategory,
          limitAmount: Number(row.limit_amount),
        }))
        setCategoryBudgetsState(mapped)
        saveLocal(KEYS.categoryBudgets, mapped)
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
        saveLocal(KEYS.savingsGoals, mapped)
      }
    } catch (err) {
      console.error('Error al sincronizar datos con Supabase:', err)
    }
  }, [user])

  // Inicialización y Realtime con Supabase
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

    // ⚡ Suscripción Realtime por WebSockets (Instant Real-time) sin filtros restrictivos
    const channel = supabase
      .channel(`realtime-finance-stream-${userId}`)
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

    // Sincronización automática al reactivar la pantalla del móvil / cambiar de pestaña
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
      window.removeEventListener('visibilitychange', handleReactivation)
      window.removeEventListener('focus', handleReactivation)
      window.removeEventListener('online', handleReactivation)
      if (supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [user, loadData])

  // --- Acciones de Ingresos ---
  const addIncome = async (d: Omit<Income, 'id'>) => {
    const cleanDesc = sanitizeString(d.description)
    const cleanAmount = sanitizeAmount(d.amount)
    const newId = `inc-${Date.now()}`
    const computedPeriod = d.date ? d.date.slice(0, 7) : d.period
    const item: Income = { ...d, period: computedPeriod, description: cleanDesc, amount: cleanAmount, id: newId }

    setIncomesState(prev => {
      const next = [item, ...prev]
      saveLocal(KEYS.incomes, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('incomes').insert({
        id: newId,
        user_id: user.id,
        period: computedPeriod,
        description: cleanDesc,
        amount: cleanAmount,
        type: d.type,
        date: d.date,
      })
      void loadData()
    }
  }

  const updateIncome = async (updated: Income) => {
    const cleanDesc = sanitizeString(updated.description)
    const cleanAmount = sanitizeAmount(updated.amount)
    const computedPeriod = updated.date ? updated.date.slice(0, 7) : updated.period
    const cleanItem: Income = { ...updated, period: computedPeriod, description: cleanDesc, amount: cleanAmount }

    setIncomesState(prev => {
      const next = prev.map(i => i.id === updated.id ? cleanItem : i)
      saveLocal(KEYS.incomes, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('incomes').update({
        description: cleanDesc,
        amount: cleanAmount,
        type: updated.type,
        date: updated.date,
        period: computedPeriod,
      }).eq('id', updated.id)
      void loadData()
    }
  }

  const deleteIncome = async (id: string) => {
    setIncomesState(prev => {
      const next = prev.filter(i => i.id !== id)
      saveLocal(KEYS.incomes, next)
      return next
    })
    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('incomes').delete().eq('id', id)
      void loadData()
    }
  }

  // --- Acciones de Gastos ---
  const addExpense = async (d: Omit<Expense, 'id'>) => {
    const cleanDesc = sanitizeString(d.description)
    const cleanAmount = sanitizeAmount(d.amount)
    const newId = `exp-${Date.now()}`
    const computedPeriod = d.date ? d.date.slice(0, 7) : d.period
    const item: Expense = { ...d, period: computedPeriod, description: cleanDesc, amount: cleanAmount, id: newId }

    setExpensesState(prev => {
      const next = [item, ...prev]
      saveLocal(KEYS.expenses, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('expenses').insert({
        id: newId,
        user_id: user.id,
        period: computedPeriod,
        description: cleanDesc,
        amount: cleanAmount,
        category: d.category,
        type: d.type,
        payment_method: d.paymentMethod,
        date: d.date,
      })
      void loadData()
    }
  }

  const updateExpense = async (updated: Expense) => {
    const cleanDesc = sanitizeString(updated.description)
    const cleanAmount = sanitizeAmount(updated.amount)
    const computedPeriod = updated.date ? updated.date.slice(0, 7) : updated.period
    const cleanItem: Expense = { ...updated, period: computedPeriod, description: cleanDesc, amount: cleanAmount }

    setExpensesState(prev => {
      const next = prev.map(e => e.id === updated.id ? cleanItem : e)
      saveLocal(KEYS.expenses, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('expenses').update({
        description: cleanDesc,
        amount: cleanAmount,
        category: updated.category,
        type: updated.type,
        payment_method: updated.paymentMethod,
        date: updated.date,
        period: computedPeriod,
      }).eq('id', updated.id)
      void loadData()
    }
  }

  const deleteExpense = async (id: string) => {
    setExpensesState(prev => {
      const next = prev.filter(e => e.id !== id)
      saveLocal(KEYS.expenses, next)
      return next
    })
    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('expenses').delete().eq('id', id)
      void loadData()
    }
  }

  // --- Acciones de Efectivo ---
  const addWithdrawal = async (d: Omit<CashWithdrawal, 'id'>) => {
    const cleanNote = d.note ? sanitizeString(d.note) : undefined
    const cleanAmount = sanitizeAmount(d.amount)
    const newId = `cash-${Date.now()}`
    const computedPeriod = d.date ? d.date.slice(0, 7) : d.period
    const item: CashWithdrawal = { ...d, period: computedPeriod, note: cleanNote, amount: cleanAmount, id: newId }

    setCashState(prev => {
      const next = [item, ...prev]
      saveLocal(KEYS.cash, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('cash_withdrawals').insert({
        id: newId,
        user_id: user.id,
        period: computedPeriod,
        amount: cleanAmount,
        reason: d.reason,
        note: cleanNote,
        date: d.date,
      })
      void loadData()
    }
  }

  const deleteWithdrawal = async (id: string) => {
    setCashState(prev => {
      const next = prev.filter(c => c.id !== id)
      saveLocal(KEYS.cash, next)
      return next
    })
    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('cash_withdrawals').delete().eq('id', id)
      void loadData()
    }
  }

  // --- Acciones de Tarjetas de Crédito ---
  const addCreditCard = async (d: Omit<CreditCard, 'id'>) => {
    const cleanName = sanitizeString(d.name)
    const cleanBank = sanitizeString(d.bank)
    const cleanDigits = d.lastFourDigits.replace(/\D/g, '').slice(-4)
    const cleanLimit = sanitizeAmount(d.creditLimit)
    const newId = `card-${Date.now()}`
    const item: CreditCard = {
      ...d,
      name: cleanName,
      bank: cleanBank,
      lastFourDigits: cleanDigits,
      creditLimit: cleanLimit,
      id: newId,
    }

    setCreditCardsState(prev => {
      const next = [...prev, item]
      saveLocal(KEYS.creditCards, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_cards').insert({
        id: newId,
        user_id: user.id,
        name: cleanName,
        bank: cleanBank,
        last_four_digits: cleanDigits,
        credit_limit: cleanLimit,
        cutoff_day: d.cutoffDay,
        payment_due_day: d.paymentDueDay,
        interest_rate: d.interestRate ?? null,
        color: d.color,
      })
      void loadData()
    }
  }

  const updateCreditCard = async (updated: CreditCard) => {
    const cleanName = sanitizeString(updated.name)
    const cleanBank = sanitizeString(updated.bank)
    const cleanDigits = updated.lastFourDigits.replace(/\D/g, '').slice(-4)
    const cleanLimit = sanitizeAmount(updated.creditLimit)
    const cleanCard: CreditCard = {
      ...updated,
      name: cleanName,
      bank: cleanBank,
      lastFourDigits: cleanDigits,
      creditLimit: cleanLimit,
      cutoffDay: Math.max(1, Math.min(31, updated.cutoffDay)),
      paymentDueDay: Math.max(1, Math.min(31, updated.paymentDueDay)),
    }

    setCreditCardsState(prev => {
      const next = prev.map(c => c.id === updated.id ? cleanCard : c)
      saveLocal(KEYS.creditCards, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_cards').update({
        name: cleanName,
        bank: cleanBank,
        last_four_digits: cleanDigits,
        credit_limit: cleanLimit,
        cutoff_day: cleanCard.cutoffDay,
        payment_due_day: cleanCard.paymentDueDay,
        interest_rate: updated.interestRate ?? null,
        color: updated.color,
      }).eq('id', updated.id)
      void loadData()
    }
  }

  const deleteCreditCard = async (id: string) => {
    setCreditCardsState(prev => {
      const next = prev.filter(c => c.id !== id)
      saveLocal(KEYS.creditCards, next)
      return next
    })
    setCreditTransactionsState(prev => {
      const next = prev.filter(t => t.cardId !== id)
      saveLocal(KEYS.creditTransactions, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_cards').delete().eq('id', id)
      await supabase.from('credit_card_transactions').delete().eq('card_id', id)
      void loadData()
    }
  }

  // --- Acciones de Transacciones de Tarjeta ---
  const addCreditTransaction = async (d: Omit<CreditCardTransaction, 'id'>) => {
    const cleanDesc = sanitizeString(d.description)
    const cleanAmount = sanitizeAmount(d.amount)
    const newId = `ctx-${Date.now()}`
    const computedPeriod = d.date ? d.date.slice(0, 7) : d.period
    const item: CreditCardTransaction = { ...d, period: computedPeriod, description: cleanDesc, amount: cleanAmount, id: newId }

    setCreditTransactionsState(prev => {
      const next = [item, ...prev]
      saveLocal(KEYS.creditTransactions, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_card_transactions').insert({
        id: newId,
        user_id: user.id,
        card_id: d.cardId,
        period: computedPeriod,
        description: cleanDesc,
        amount: cleanAmount,
        category: d.category,
        date: d.date,
        installments: d.installments,
        current_installment: d.currentInstallment,
        is_paid: d.isPaid,
      })
      void loadData()
    }
  }

  const updateCreditTransaction = async (updated: CreditCardTransaction) => {
    const cleanDesc = sanitizeString(updated.description)
    const cleanAmount = sanitizeAmount(updated.amount)
    const computedPeriod = updated.date ? updated.date.slice(0, 7) : updated.period
    const cleanItem: CreditCardTransaction = { ...updated, period: computedPeriod, description: cleanDesc, amount: cleanAmount }

    setCreditTransactionsState(prev => {
      const next = prev.map(t => t.id === updated.id ? cleanItem : t)
      saveLocal(KEYS.creditTransactions, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_card_transactions').update({
        card_id: updated.cardId,
        description: cleanDesc,
        amount: cleanAmount,
        category: updated.category,
        date: updated.date,
        period: computedPeriod,
        installments: updated.installments,
        current_installment: updated.currentInstallment,
        is_paid: updated.isPaid,
      }).eq('id', updated.id)
      void loadData()
    }
  }

  const deleteCreditTransaction = async (id: string) => {
    setCreditTransactionsState(prev => {
      const next = prev.filter(t => t.id !== id)
      saveLocal(KEYS.creditTransactions, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_card_transactions').delete().eq('id', id)
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
    const cleanLimit = Math.max(0, sanitizeAmount(limitAmount))
    const existing = categoryBudgets.find(b => b.category === category && (b.period === period || b.period === 'default'))

    if (existing) {
      const updated: CategoryBudget = { ...existing, limitAmount: cleanLimit, period }
      setCategoryBudgetsState(prev => {
        const next = prev.map(b => b.id === existing.id ? updated : b)
        saveLocal(KEYS.categoryBudgets, next)
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
        void loadData()
      }
    } else {
      const newId = `bud-${Date.now()}-${category}`
      const newBudget: CategoryBudget = { id: newId, category, limitAmount: cleanLimit, period }
      setCategoryBudgetsState(prev => {
        const next = [...prev, newBudget]
        saveLocal(KEYS.categoryBudgets, next)
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
        void loadData()
      }
    }
  }

  const setMultipleCategoryBudgets = async (budgetsMap: Record<ExpenseCategory, number>, period: string = 'default') => {
    const newBudgets: CategoryBudget[] = []

    for (const [cat, limit] of Object.entries(budgetsMap)) {
      const category = cat as ExpenseCategory
      const cleanLimit = Math.max(0, sanitizeAmount(limit))
      const existing = categoryBudgets.find(b => b.category === category)
      const id = existing ? existing.id : `bud-${Date.now()}-${category}`
      newBudgets.push({ id, category, limitAmount: cleanLimit, period })
    }

    setCategoryBudgetsState(newBudgets)
    saveLocal(KEYS.categoryBudgets, newBudgets)

    if (supabase && isSupabaseConfigured && user) {
      const rows = newBudgets.map(b => ({
        id: b.id,
        user_id: user.id,
        period: b.period,
        category: b.category,
        limit_amount: b.limitAmount,
      }))
      await supabase.from('category_budgets').upsert(rows)
      void loadData()
    }
  }

  // --- Acciones de Metas de Ahorro ---
  const addSavingsGoal = async (g: Omit<SavingsGoal, 'id'>) => {
    const cleanName = sanitizeString(g.name)
    const cleanTarget = sanitizeAmount(g.targetAmount)
    const cleanCurrent = Math.max(0, sanitizeAmount(g.currentAmount || 0))
    const cleanMonthly = g.monthlyContribution ? sanitizeAmount(g.monthlyContribution) : undefined
    const newId = `goal-${Date.now()}`

    const item: SavingsGoal = {
      ...g,
      id: newId,
      name: cleanName,
      targetAmount: cleanTarget,
      currentAmount: cleanCurrent,
      monthlyContribution: cleanMonthly,
      isCompleted: cleanCurrent >= cleanTarget,
    }

    setSavingsGoalsState(prev => {
      const next = [...prev, item]
      saveLocal(KEYS.savingsGoals, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('savings_goals').insert({
        id: newId,
        user_id: user.id,
        name: cleanName,
        target_amount: cleanTarget,
        current_amount: cleanCurrent,
        monthly_contribution: cleanMonthly ?? null,
        target_date: g.targetDate ?? null,
        category: g.category,
        color: g.color || '#34D399',
        is_completed: item.isCompleted,
      })
      void loadData()
    }
  }

  const updateSavingsGoal = async (updated: SavingsGoal) => {
    const cleanName = sanitizeString(updated.name)
    const cleanTarget = sanitizeAmount(updated.targetAmount)
    const cleanCurrent = Math.max(0, sanitizeAmount(updated.currentAmount || 0))
    const cleanMonthly = updated.monthlyContribution ? sanitizeAmount(updated.monthlyContribution) : undefined
    const isCompleted = cleanCurrent >= cleanTarget

    const cleanItem: SavingsGoal = {
      ...updated,
      name: cleanName,
      targetAmount: cleanTarget,
      currentAmount: cleanCurrent,
      monthlyContribution: cleanMonthly,
      isCompleted,
    }

    setSavingsGoalsState(prev => {
      const next = prev.map(g => g.id === updated.id ? cleanItem : g)
      saveLocal(KEYS.savingsGoals, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('savings_goals').update({
        name: cleanName,
        target_amount: cleanTarget,
        current_amount: cleanCurrent,
        monthly_contribution: cleanMonthly ?? null,
        target_date: updated.targetDate ?? null,
        category: updated.category,
        color: updated.color || '#34D399',
        is_completed: isCompleted,
      }).eq('id', updated.id)
      void loadData()
    }
  }

  const depositToGoal = async (goalId: string, amount: number) => {
    const target = savingsGoals.find(g => g.id === goalId)
    if (!target) return
    const cleanDeposit = sanitizeAmount(amount)
    const newCurrent = target.currentAmount + cleanDeposit
    await updateSavingsGoal({ ...target, currentAmount: newCurrent })
  }

  const deleteSavingsGoal = async (goalId: string) => {
    setSavingsGoalsState(prev => {
      const next = prev.filter(g => g.id !== goalId)
      saveLocal(KEYS.savingsGoals, next)
      return next
    })

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('savings_goals').delete().eq('id', goalId)
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
