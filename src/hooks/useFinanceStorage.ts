import { useState, useEffect } from 'react'
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
    // quota exceeded — fail silently
  }
}

const DEFAULT_INCOMES: Income[] = [
  { id: 'inc-1', description: 'Sueldo Principal (Software Engineer)', amount: 85000, type: 'salary',     date: '2026-08-01', period: '2026-08' },
  { id: 'inc-2', description: 'Consultoría Web Freelance',            amount: 22500, type: 'freelance',  date: '2026-08-08', period: '2026-08' },
  { id: 'inc-3', description: 'Dividendos Fondos Indexados',          amount: 4500,  type: 'investment', date: '2026-08-10', period: '2026-08' },
  // Datos de meses anteriores para permitir comparativas reales
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
  // Gastos mes anterior
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

  // Sincronización inicial y Realtime con Supabase cuando el usuario está logueado
  useEffect(() => {
    if (!user || !supabase || !isSupabaseConfigured) {
      return
    }

    const userId = user.id
    let isMounted = true

    async function loadData() {
      if (!supabase) return
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

        if (!isMounted) return

        setIncomesState((incRes.data || []).map(row => ({
          id: row.id,
          period: row.period,
          description: row.description,
          amount: Number(row.amount),
          type: row.type as IncomeType,
          date: row.date,
        })))

        setExpensesState((expRes.data || []).map(row => ({
          id: row.id,
          period: row.period,
          description: row.description,
          amount: Number(row.amount),
          category: row.category as ExpenseCategory,
          type: row.type as ExpenseType,
          paymentMethod: row.payment_method as PaymentMethod,
          date: row.date,
        })))

        setCashState((cashRes.data || []).map(row => ({
          id: row.id,
          period: row.period,
          amount: Number(row.amount),
          reason: row.reason as CashReason,
          note: row.note ?? undefined,
          date: row.date,
        })))

        setCreditCardsState((cardRes.data || []).map(row => ({
          id: row.id,
          name: row.name,
          bank: row.bank,
          lastFourDigits: row.last_four_digits,
          creditLimit: Number(row.credit_limit),
          cutoffDay: Number(row.cutoff_day),
          paymentDueDay: Number(row.payment_due_day),
          interestRate: row.interest_rate ? Number(row.interest_rate) : undefined,
          color: row.color as CardThemeColor,
        })))

        setCreditTransactionsState((ctxRes.data || []).map(row => ({
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
        })))

        setCategoryBudgetsState((budRes.data || []).map(row => ({
          id: row.id,
          period: row.period,
          category: row.category as ExpenseCategory,
          limitAmount: Number(row.limit_amount),
        })))

        setSavingsGoalsState((goalRes.data || []).map(row => ({
          id: row.id,
          name: row.name,
          targetAmount: Number(row.target_amount),
          currentAmount: Number(row.current_amount || 0),
          monthlyContribution: row.monthly_contribution ? Number(row.monthly_contribution) : undefined,
          targetDate: row.target_date ?? undefined,
          category: row.category as GoalCategory,
          color: row.color || '#34D399',
          isCompleted: Boolean(row.is_completed),
        })))
      } catch {
        // Fallo de red
      }
    }

    loadData()

    // Suscripción Realtime vía WebSockets (IRT)
    const channel = supabase
      .channel(`realtime-finance-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomes' }, (payload) => {
        if (payload.eventType === 'DELETE' && payload.old && (payload.old as { id?: string }).id) {
          const deletedId = (payload.old as { id: string }).id
          setIncomesState(prev => prev.filter(i => i.id !== deletedId))
        } else {
          loadData()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        if (payload.eventType === 'DELETE' && payload.old && (payload.old as { id?: string }).id) {
          const deletedId = (payload.old as { id: string }).id
          setExpensesState(prev => prev.filter(e => e.id !== deletedId))
        } else {
          loadData()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_withdrawals' }, (payload) => {
        if (payload.eventType === 'DELETE' && payload.old && (payload.old as { id?: string }).id) {
          const deletedId = (payload.old as { id: string }).id
          setCashState(prev => prev.filter(c => c.id !== deletedId))
        } else {
          loadData()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_cards' }, (payload) => {
        if (payload.eventType === 'DELETE' && payload.old && (payload.old as { id?: string }).id) {
          const deletedId = (payload.old as { id: string }).id
          setCreditCardsState(prev => prev.filter(c => c.id !== deletedId))
        } else {
          loadData()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_card_transactions' }, (payload) => {
        if (payload.eventType === 'DELETE' && payload.old && (payload.old as { id?: string }).id) {
          const deletedId = (payload.old as { id: string }).id
          setCreditTransactionsState(prev => prev.filter(t => t.id !== deletedId))
        } else {
          loadData()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_budgets' }, () => {
        loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_goals' }, (payload) => {
        if (payload.eventType === 'DELETE' && payload.old && (payload.old as { id?: string }).id) {
          const deletedId = (payload.old as { id: string }).id
          setSavingsGoalsState(prev => prev.filter(g => g.id !== deletedId))
        } else {
          loadData()
        }
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
      saveLocal(KEYS.incomes,            incomes)
      saveLocal(KEYS.expenses,           expenses)
      saveLocal(KEYS.cash,               cash)
      saveLocal(KEYS.creditCards,        creditCards)
      saveLocal(KEYS.creditTransactions, creditTransactions)
      saveLocal(KEYS.categoryBudgets,    categoryBudgets)
      saveLocal(KEYS.savingsGoals,       savingsGoals)
    }
  }, [incomes, expenses, cash, creditCards, creditTransactions, categoryBudgets, savingsGoals, user])

  // --- Acciones de Ingresos ---
  const addIncome = async (d: Omit<Income, 'id'>) => {
    const cleanDesc = sanitizeString(d.description)
    const cleanAmount = sanitizeAmount(d.amount)
    const newId = `inc-${Date.now()}`
    const item: Income = { ...d, description: cleanDesc, amount: cleanAmount, id: newId }
    setIncomesState(prev => [item, ...prev])

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('incomes').insert({
        id: newId,
        user_id: user.id,
        period: d.period,
        description: cleanDesc,
        amount: cleanAmount,
        type: d.type,
        date: d.date,
      })
    }
  }

  const updateIncome = async (updated: Income) => {
    const cleanDesc = sanitizeString(updated.description)
    const cleanAmount = sanitizeAmount(updated.amount)
    const cleanItem: Income = { ...updated, description: cleanDesc, amount: cleanAmount }
    setIncomesState(prev => prev.map(i => i.id === updated.id ? cleanItem : i))

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('incomes').update({
        description: cleanDesc,
        amount: cleanAmount,
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
    const cleanDesc = sanitizeString(d.description)
    const cleanAmount = sanitizeAmount(d.amount)
    const newId = `exp-${Date.now()}`
    const item: Expense = { ...d, description: cleanDesc, amount: cleanAmount, id: newId }
    setExpensesState(prev => [item, ...prev])

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('expenses').insert({
        id: newId,
        user_id: user.id,
        period: d.period,
        description: cleanDesc,
        amount: cleanAmount,
        category: d.category,
        type: d.type,
        payment_method: d.paymentMethod,
        date: d.date,
      })
    }
  }

  const updateExpense = async (updated: Expense) => {
    const cleanDesc = sanitizeString(updated.description)
    const cleanAmount = sanitizeAmount(updated.amount)
    const cleanItem: Expense = { ...updated, description: cleanDesc, amount: cleanAmount }
    setExpensesState(prev => prev.map(e => e.id === updated.id ? cleanItem : e))

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('expenses').update({
        description: cleanDesc,
        amount: cleanAmount,
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

  // --- Acciones de Efectivo ---
  const addWithdrawal = async (d: Omit<CashWithdrawal, 'id'>) => {
    const cleanNote = d.note ? sanitizeString(d.note) : undefined
    const cleanAmount = sanitizeAmount(d.amount)
    const newId = `cash-${Date.now()}`
    const item: CashWithdrawal = { ...d, note: cleanNote, amount: cleanAmount, id: newId }
    setCashState(prev => [item, ...prev])

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('cash_withdrawals').insert({
        id: newId,
        user_id: user.id,
        period: d.period,
        amount: cleanAmount,
        reason: d.reason,
        note: cleanNote,
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
    setCreditCardsState(prev => [...prev, item])

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

    setCreditCardsState(prev => prev.map(c => c.id === updated.id ? cleanCard : c))

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
    }
  }

  const deleteCreditCard = async (id: string) => {
    setCreditCardsState(prev => prev.filter(c => c.id !== id))
    setCreditTransactionsState(prev => prev.filter(t => t.cardId !== id))

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_cards').delete().eq('id', id)
      await supabase.from('credit_card_transactions').delete().eq('card_id', id)
    }
  }

  // --- Acciones de Transacciones de Tarjeta ---
  const addCreditTransaction = async (d: Omit<CreditCardTransaction, 'id'>) => {
    const cleanDesc = sanitizeString(d.description)
    const cleanAmount = sanitizeAmount(d.amount)
    const newId = `ctx-${Date.now()}`
    const item: CreditCardTransaction = { ...d, description: cleanDesc, amount: cleanAmount, id: newId }
    setCreditTransactionsState(prev => [item, ...prev])

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_card_transactions').insert({
        id: newId,
        user_id: user.id,
        card_id: d.cardId,
        period: d.period,
        description: cleanDesc,
        amount: cleanAmount,
        category: d.category,
        date: d.date,
        installments: d.installments,
        current_installment: d.currentInstallment,
        is_paid: d.isPaid,
      })
    }
  }

  const updateCreditTransaction = async (updated: CreditCardTransaction) => {
    const cleanDesc = sanitizeString(updated.description)
    const cleanAmount = sanitizeAmount(updated.amount)
    const cleanItem: CreditCardTransaction = { ...updated, description: cleanDesc, amount: cleanAmount }
    setCreditTransactionsState(prev => prev.map(t => t.id === updated.id ? cleanItem : t))

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_card_transactions').update({
        card_id: updated.cardId,
        description: cleanDesc,
        amount: cleanAmount,
        category: updated.category,
        date: updated.date,
        period: updated.period,
        installments: updated.installments,
        current_installment: updated.currentInstallment,
        is_paid: updated.isPaid,
      }).eq('id', updated.id)
    }
  }

  const deleteCreditTransaction = async (id: string) => {
    setCreditTransactionsState(prev => prev.filter(t => t.id !== id))

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_card_transactions').delete().eq('id', id)
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
      setCategoryBudgetsState(prev => prev.map(b => b.id === existing.id ? updated : b))

      if (supabase && isSupabaseConfigured && user) {
        await supabase.from('category_budgets').upsert({
          id: existing.id,
          user_id: user.id,
          period,
          category,
          limit_amount: cleanLimit,
        })
      }
    } else {
      const newId = `bud-${Date.now()}-${category}`
      const newBudget: CategoryBudget = { id: newId, category, limitAmount: cleanLimit, period }
      setCategoryBudgetsState(prev => [...prev, newBudget])

      if (supabase && isSupabaseConfigured && user) {
        await supabase.from('category_budgets').insert({
          id: newId,
          user_id: user.id,
          period,
          category,
          limit_amount: cleanLimit,
        })
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

    if (supabase && isSupabaseConfigured && user) {
      const rows = newBudgets.map(b => ({
        id: b.id,
        user_id: user.id,
        period: b.period,
        category: b.category,
        limit_amount: b.limitAmount,
      }))
      await supabase.from('category_budgets').upsert(rows)
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

    setSavingsGoalsState(prev => [...prev, item])

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

    setSavingsGoalsState(prev => prev.map(g => g.id === updated.id ? cleanItem : g))

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
    setSavingsGoalsState(prev => prev.filter(g => g.id !== goalId))

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('savings_goals').delete().eq('id', goalId)
    }
  }

  return {
    incomes, expenses, cash, creditCards, creditTransactions, categoryBudgets, savingsGoals,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense,
    addWithdrawal, deleteWithdrawal,
    addCreditCard, updateCreditCard, deleteCreditCard,
    addCreditTransaction, updateCreditTransaction, deleteCreditTransaction, toggleTransactionPaid,
    setCategoryBudget, setMultipleCategoryBudgets,
    addSavingsGoal, updateSavingsGoal, depositToGoal, deleteSavingsGoal,
  }
}
