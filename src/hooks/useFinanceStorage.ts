import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import type {
  Income,
  Expense,
  CashWithdrawal,
  CreditCard,
  CreditCardTransaction,
  IncomeType,
  ExpenseCategory,
  ExpenseType,
  PaymentMethod,
  CashReason,
  CardThemeColor
} from '../types/finance'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { sanitizeString, sanitizeAmount } from '../utils/security'

const KEYS = {
  incomes:            'aureus_incomes',
  expenses:           'aureus_expenses',
  cash:               'aureus_cash',
  creditCards:        'aureus_credit_cards',
  creditTransactions: 'aureus_credit_transactions',
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
  // Transacción mes anterior
  {
    id: 'ctx-prev-1',
    cardId: 'card-1',
    period: '2026-07',
    description: 'Compras Electrónicos',
    amount: 18900,
    category: 'other',
    date: '2026-07-16',
    installments: 1,
    currentInstallment: 1,
    isPaid: true,
  },
]

export function useFinanceStorage(user?: User | null) {
  const [incomes,            setIncomesState]            = useState<Income[]>(()                => loadLocal(KEYS.incomes,            DEFAULT_INCOMES))
  const [expenses,           setExpensesState]           = useState<Expense[]>(()               => loadLocal(KEYS.expenses,           DEFAULT_EXPENSES))
  const [cash,               setCashState]               = useState<CashWithdrawal[]>(()        => loadLocal(KEYS.cash,               DEFAULT_CASH))
  const [creditCards,        setCreditCardsState]        = useState<CreditCard[]>(()            => loadLocal(KEYS.creditCards,        DEFAULT_CARDS))
  const [creditTransactions, setCreditTransactionsState] = useState<CreditCardTransaction[]>(() => loadLocal(KEYS.creditTransactions, DEFAULT_CARD_TRANSACTIONS))

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
        const [incRes, expRes, cashRes, cardRes, ctxRes] = await Promise.all([
          supabase.from('incomes').select('*').eq('user_id', userId).order('date', { ascending: false }),
          supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
          supabase.from('cash_withdrawals').select('*').eq('user_id', userId).order('date', { ascending: false }),
          supabase.from('credit_cards').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
          supabase.from('credit_card_transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
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

        if (cardRes.data && cardRes.data.length > 0) {
          setCreditCardsState(cardRes.data.map(row => ({
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
        }

        if (ctxRes.data) {
          setCreditTransactionsState(ctxRes.data.map(row => ({
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
        }
      } catch {
        // Usar estado local si hay fallo de conexión
      }
    }

    loadData()

    // Suscripción Realtime vía WebSockets (IRT)
    const channel = supabase
      .channel(`realtime-finance-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incomes' },
        (payload) => {
          if (payload.eventType === 'DELETE' && payload.old && (payload.old as { id?: string }).id) {
            const deletedId = (payload.old as { id: string }).id
            setIncomesState(prev => prev.filter(i => i.id !== deletedId))
          } else {
            loadData()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        (payload) => {
          if (payload.eventType === 'DELETE' && payload.old && (payload.old as { id?: string }).id) {
            const deletedId = (payload.old as { id: string }).id
            setExpensesState(prev => prev.filter(e => e.id !== deletedId))
          } else {
            loadData()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_withdrawals' },
        (payload) => {
          if (payload.eventType === 'DELETE' && payload.old && (payload.old as { id?: string }).id) {
            const deletedId = (payload.old as { id: string }).id
            setCashState(prev => prev.filter(c => c.id !== deletedId))
          } else {
            loadData()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credit_cards' },
        (payload) => {
          if (payload.eventType === 'DELETE' && payload.old && (payload.old as { id?: string }).id) {
            const deletedId = (payload.old as { id: string }).id
            setCreditCardsState(prev => prev.filter(c => c.id !== deletedId))
          } else {
            loadData()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credit_card_transactions' },
        (payload) => {
          if (payload.eventType === 'DELETE' && payload.old && (payload.old as { id?: string }).id) {
            const deletedId = (payload.old as { id: string }).id
            setCreditTransactionsState(prev => prev.filter(t => t.id !== deletedId))
          } else {
            loadData()
          }
        }
      )
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
    }
  }, [incomes, expenses, cash, creditCards, creditTransactions, user])

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

  // --- Acciones de Retiros en Efectivo ---
  const addWithdrawal = async (d: Omit<CashWithdrawal, 'id'>) => {
    const cleanNote = d.note ? sanitizeString(d.note) : undefined
    const cleanAmount = sanitizeAmount(d.amount)
    const newId = `cash-${Date.now()}`
    const item: CashWithdrawal = { ...d, amount: cleanAmount, note: cleanNote, id: newId }
    setCashState(prev => [item, ...prev])

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('cash_withdrawals').insert({
        id: newId,
        user_id: user.id,
        period: d.period,
        amount: cleanAmount,
        reason: d.reason,
        note: cleanNote ?? null,
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
    const cleanDigits = d.lastFourDigits.replace(/\D/g, '').slice(0, 4) || '0000'
    const cleanLimit = sanitizeAmount(d.creditLimit)
    const newId = `card-${Date.now()}`

    const newCard: CreditCard = {
      ...d,
      id: newId,
      name: cleanName,
      bank: cleanBank,
      lastFourDigits: cleanDigits,
      creditLimit: cleanLimit,
      cutoffDay: Math.max(1, Math.min(31, d.cutoffDay)),
      paymentDueDay: Math.max(1, Math.min(31, d.paymentDueDay)),
    }

    setCreditCardsState(prev => [...prev, newCard])

    if (supabase && isSupabaseConfigured && user) {
      await supabase.from('credit_cards').insert({
        id: newId,
        user_id: user.id,
        name: cleanName,
        bank: cleanBank,
        last_four_digits: cleanDigits,
        credit_limit: cleanLimit,
        cutoff_day: newCard.cutoffDay,
        payment_due_day: newCard.paymentDueDay,
        interest_rate: d.interestRate ?? null,
        color: d.color,
      })
    }
  }

  const updateCreditCard = async (updated: CreditCard) => {
    const cleanName = sanitizeString(updated.name)
    const cleanBank = sanitizeString(updated.bank)
    const cleanDigits = updated.lastFourDigits.replace(/\D/g, '').slice(0, 4) || '0000'
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

  return {
    incomes, expenses, cash, creditCards, creditTransactions,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense,
    addWithdrawal, deleteWithdrawal,
    addCreditCard, updateCreditCard, deleteCreditCard,
    addCreditTransaction, updateCreditTransaction, deleteCreditTransaction, toggleTransactionPaid,
  }
}

