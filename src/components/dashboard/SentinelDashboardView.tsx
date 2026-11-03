// ==============================================================================
// AUREUS · SENTINEL EXECUTIVE DASHBOARD (REVOLUT ULTRA x STRIPE BENTO EDITION)
// ==============================================================================

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Zap,
  CreditCard,
  Wifi,
  School,
  Droplets,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  PiggyBank,
  Check,
  X,
  AlertTriangle,
  Home,
  Activity,
  PieChart,
  RefreshCw,
} from 'lucide-react'
import type {
  Income,
  Expense,
  CashWithdrawal,
  CreditCard as CreditCardType,
  CreditCardTransaction,
  CategoryBudget,
  ExpenseCategory,
} from '../../types/finance'
import { apiClient } from '../../services/apiClient'
import {
  getStoredDailyExchangeRate,
  syncDailyUsdDopRate,
  type DailyExchangeRateState,
} from '../../utils/currencyConverter'
import { getCurrentSystemPeriod } from '../../utils/calendar'
import { CustomIconSelect, type CustomSelectOption } from '../ui/CustomIconSelect'
import './SentinelDashboardView.css'

export interface SentinelDashboardViewProps {
  currentPeriod?: string
  incomes?: Income[]
  expenses?: Expense[]
  cashWithdrawals?: CashWithdrawal[]
  creditCards?: CreditCardType[]
  creditTransactions?: CreditCardTransaction[]
  categoryBudgets?: CategoryBudget[]
  availableBalance?: number
  userEmail?: string | null
  onAddExpense?: (expense: Omit<Expense, 'id'>) => Promise<{ success: boolean } | void>
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void
}

interface CommitmentItem {
  id: string
  name: string
  monogram: string
  category: 'electric' | 'telecom' | 'card' | 'education' | 'water' | 'other'
  dueDateStr: string
  dueDayOfMonth: number
  status: 'pending' | 'paid' | 'overdue'
  amountFormatted: string
  amountRaw: number
  lateFeeAvoided: string
  contractNumber?: string
  daysRemaining: number
}

interface TelegramFeedItem {
  id: string
  sender: 'Mamá' | 'Papá' | 'Centinela Bot'
  avatarType: 'mama' | 'papa' | 'bot'
  text: string
  timestamp: string
  aiConfidence?: number
  categoryTag?: string
  amountTag?: string
}

const COMMITMENTS_STORAGE_KEY = 'aureus_sentinel_commitments'
const FEED_STORAGE_KEY = 'aureus_sentinel_feed'

const INITIAL_COMMITMENTS: CommitmentItem[] = [
  {
    id: 'c-edesur',
    name: 'Edesur Dominicana',
    monogram: 'ED',
    category: 'electric',
    dueDateStr: 'Día 20 del ciclo',
    dueDayOfMonth: 20,
    status: 'pending',
    amountFormatted: 'RD$ 2,450.00',
    amountRaw: 2450,
    lateFeeAvoided: 'RD$ 450.00',
    contractNumber: 'Suministro #49102-1',
    daysRemaining: 2,
  },
  {
    id: 'c-claro',
    name: 'Claro Telecomunicaciones',
    monogram: 'CL',
    category: 'telecom',
    dueDateStr: 'Día 24 del ciclo',
    dueDayOfMonth: 24,
    status: 'pending',
    amountFormatted: 'RD$ 2,190.00',
    amountRaw: 2190,
    lateFeeAvoided: 'RD$ 300.00',
    contractNumber: 'Fibra Óptica 300 Mbps',
    daysRemaining: 6,
  },
  {
    id: 'c-banreservas',
    name: 'Banreservas Visa Oro',
    monogram: 'BR',
    category: 'card',
    dueDateStr: 'Día 28 del ciclo',
    dueDayOfMonth: 28,
    status: 'pending',
    amountFormatted: 'RD$ 14,800.00',
    amountRaw: 14800,
    lateFeeAvoided: 'RD$ 1,200.00',
    contractNumber: 'Corte 0% Interés · *4892',
    daysRemaining: 10,
  },
  {
    id: 'c-colegio',
    name: 'Colegio San Judas Tadeo',
    monogram: 'SJ',
    category: 'education',
    dueDateStr: 'Día 05 del ciclo',
    dueDayOfMonth: 5,
    status: 'pending',
    amountFormatted: 'RD$ 12,500.00',
    amountRaw: 12500,
    lateFeeAvoided: 'RD$ 800.00',
    contractNumber: 'Colegiatura Mensual #2026-A',
    daysRemaining: 18,
  },
  {
    id: 'c-caasd',
    name: 'CAASD (Agua Potable)',
    monogram: 'CA',
    category: 'water',
    dueDateStr: 'Día 12 del ciclo',
    dueDayOfMonth: 12,
    status: 'paid',
    amountFormatted: 'RD$ 680.00',
    amountRaw: 680,
    lateFeeAvoided: 'RD$ 150.00',
    contractNumber: 'Contrato #44910',
    daysRemaining: 0,
  },
]

const INITIAL_FEED: TelegramFeedItem[] = [
  {
    id: 'feed-1',
    sender: 'Mamá',
    avatarType: 'mama',
    text: 'OCR Factura Supermercado Nacional · NCF B0200481920 conciliado',
    timestamp: 'Hace 12 min',
    aiConfidence: 99,
    categoryTag: 'Alimentación & Despensa',
    amountTag: 'RD$ 6,840.00',
  },
  {
    id: 'feed-2',
    sender: 'Papá',
    avatarType: 'papa',
    text: 'Nota de Voz transcrita: Gasolina regular en Texaco Churchill con débito Banreservas',
    timestamp: 'Hace 1 hora',
    aiConfidence: 98,
    categoryTag: 'Combustible & Vehículo',
    amountTag: 'RD$ 1,500.00',
  },
  {
    id: 'feed-3',
    sender: 'Centinela Bot',
    avatarType: 'bot',
    text: 'Factura de CAASD conciliada y marcada como pagada. Ahorraste RD$ 150.00 en mora.',
    timestamp: 'Hace 2 horas',
    amountTag: 'RD$ 680.00',
  },
]

const FALLBACK_LIQUIDITY_DOP = 413950

const COMMITMENT_CATEGORY_OPTIONS: CustomSelectOption<CommitmentItem['category']>[] = [
  {
    value: 'electric',
    label: 'Energía Eléctrica',
    subtitle: 'Edesur, Edenorte, Edeeste',
    icon: <Zap size={15} />,
    accentColor: '#EF4444',
  },
  {
    value: 'telecom',
    label: 'Telecomunicaciones & Internet',
    subtitle: 'Claro, Altice, Starlink',
    icon: <Wifi size={15} />,
    accentColor: '#C8A962',
  },
  {
    value: 'card',
    label: 'Tarjeta de Crédito / Préstamo',
    subtitle: 'Corte bancario sin intereses',
    icon: <CreditCard size={15} />,
    accentColor: '#818CF8',
  },
  {
    value: 'education',
    label: 'Educación & Colegiatura',
    subtitle: 'Colegio, universidad, cursos',
    icon: <School size={15} />,
    accentColor: '#10B981',
  },
  {
    value: 'water',
    label: 'Agua & Servicios Municipales',
    subtitle: 'CAASD, mantenimiento, basura',
    icon: <Droplets size={15} />,
    accentColor: '#38BDF8',
  },
  {
    value: 'other',
    label: 'Otro Compromiso Recurrente',
    subtitle: 'Seguros, suscripciones, alquiler',
    icon: <Calendar size={15} />,
    accentColor: '#94A3B8',
  },
]

function loadSavedCommitments(): CommitmentItem[] {
  try {
    const raw = localStorage.getItem(COMMITMENTS_STORAGE_KEY)
    if (!raw) return INITIAL_COMMITMENTS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_COMMITMENTS
  } catch {
    return INITIAL_COMMITMENTS
  }
}

function loadSavedFeed(): TelegramFeedItem[] {
  try {
    const raw = localStorage.getItem(FEED_STORAGE_KEY)
    if (!raw) return INITIAL_FEED
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_FEED
  } catch {
    return INITIAL_FEED
  }
}

function mapCommitmentCategoryToExpense(cat: CommitmentItem['category']): ExpenseCategory {
  if (cat === 'electric' || cat === 'telecom' || cat === 'water') return 'utilities'
  if (cat === 'card') return 'debt'
  if (cat === 'education') return 'education'
  return 'housing'
}

function inferTelegramCategory(text: string): { category: ExpenseCategory; tag: string } {
  const lower = text.toLowerCase()
  if (/cena|almuerzo|desayuno|comida|super|nacional|bravo|sirena|restaurante|cafe|pizza/.test(lower)) {
    return { category: 'food', tag: 'Alimentación & Despensa' }
  }
  if (/luz|edesur|edenorte|agua|caasd|internet|claro|altice|factura|telefono/.test(lower)) {
    return { category: 'utilities', tag: 'Servicios & Facturas' }
  }
  if (/gasolina|combustible|uber|taxi|peaje|parqueo|auto|mantenimiento/.test(lower)) {
    return { category: 'transport', tag: 'Combustible & Movilidad' }
  }
  if (/farmacia|medico|consulta|salud|clinica|laboratorio/.test(lower)) {
    return { category: 'health', tag: 'Salud & Bienestar' }
  }
  if (/colegio|universidad|curso|libro|educacion/.test(lower)) {
    return { category: 'education', tag: 'Educación & Formación' }
  }
  if (/alquiler|renta|hipoteca|condominio/.test(lower)) {
    return { category: 'housing', tag: 'Vivienda & Hogar' }
  }
  if (/cine|salida|fiesta|concierto|viaje|hotel|ocio/.test(lower)) {
    return { category: 'entertainment', tag: 'Ocio & Recreación' }
  }
  return { category: 'other', tag: 'Captura Telegram Live' }
}

export function SentinelDashboardView({
  currentPeriod,
  incomes,
  expenses,
  cashWithdrawals = [],
  creditCards = [],
  creditTransactions = [],
  categoryBudgets = [],
  availableBalance,
  userEmail,
  onAddExpense,
  onShowToast,
}: SentinelDashboardViewProps = {}) {
  const activePeriod = currentPeriod || getCurrentSystemPeriod()
  const [commitments, setCommitments] = useState<CommitmentItem[]>(() => loadSavedCommitments())
  const [feed, setFeed] = useState<TelegramFeedItem[]>(() => loadSavedFeed())
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'urgent'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [simText, setSimText] = useState('')
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null)

  // Persistir compromisos y feed en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COMMITMENTS_STORAGE_KEY, JSON.stringify(commitments))
    } catch { }
  }, [commitments])

  useEffect(() => {
    try {
      localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(feed))
    } catch { }
  }, [feed])

  // Estado de la Tasa de Cambio Diaria (USD -> DOP) con respaldo automático a la tasa anterior
  const [fxState, setFxState] = useState<DailyExchangeRateState>(() =>
    getStoredDailyExchangeRate()
  )
  const [isSyncingFx, setIsSyncingFx] = useState(false)

  // Formulario nuevo compromiso
  const [newBillName, setNewBillName] = useState('')
  const [newBillCategory, setNewBillCategory] = useState<CommitmentItem['category']>('electric')
  const [newBillDay, setNewBillDay] = useState(15)
  const [newBillAmount, setNewBillAmount] = useState('2000')
  const [newBillLateFee, setNewBillLateFee] = useState('350')

  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  // Sincronización automática de la tasa de cambio del día
  useEffect(() => {
    let isMounted = true
    setIsSyncingFx(true)
    syncDailyUsdDopRate(false)
      .then(result => {
        if (isMounted) {
          setFxState(result)
          setIsSyncingFx(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsSyncingFx(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleRefreshExchangeRate = async () => {
    if (isSyncingFx) return
    setIsSyncingFx(true)
    const updated = await syncDailyUsdDopRate(true)
    setFxState(updated)
    setIsSyncingFx(false)
  }

  // Liquidez real conectada al motor contable de AUREUS
  const liquidityDop = useMemo(() => {
    if (availableBalance !== undefined) return availableBalance
    return FALLBACK_LIQUIDITY_DOP
  }, [availableBalance])

  // Equivalente en USD calculado con la tasa del día (o la anterior si no varió)
  const liquidityInUsdFormatted = useMemo(() => {
    const rate = fxState.rate > 0 ? fxState.rate : 60.25
    const usdAmount = liquidityDop / rate
    return usdAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }, [fxState.rate, liquidityDop])

  // Carga inicial del backend
  useEffect(() => {
    let isMounted = true
    apiClient.sentinel
      .getCommitments()
      .then(res => {
        if (!isMounted || !res?.data?.commitments?.length) return
        const mapped = res.data.commitments.map((c: any) => {
          const words = String(c.name || 'SV').trim().split(/\s+/)
          const monogram =
            words.length >= 2
              ? `${words[0][0]}${words[1][0]}`.toUpperCase()
              : String(c.name || 'SV').slice(0, 2).toUpperCase()
          return {
            id: c.id,
            name: c.name,
            monogram,
            category: (c.name.toLowerCase().includes('luz') || c.name.toLowerCase().includes('ede')
              ? 'electric'
              : c.name.toLowerCase().includes('claro') || c.name.toLowerCase().includes('internet')
                ? 'telecom'
                : c.name.toLowerCase().includes('tarjeta') || c.name.toLowerCase().includes('visa')
                  ? 'card'
                  : 'other') as CommitmentItem['category'],
            dueDateStr: c.currentCycle.dueDate,
            dueDayOfMonth: c.dueDayOfMonth,
            status: c.currentCycle.status,
            amountFormatted: c.expectedAmount || 'RD$ 0.00',
            amountRaw: c.expectedAmountCents ? c.expectedAmountCents / 100 : 0,
            lateFeeAvoided: c.estimatedLateFee || 'RD$ 0.00',
            daysRemaining: Math.ceil(
              (new Date(c.currentCycle.dueDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
            ),
          }
        })
        setCommitments(mapped)
      })
      .catch(() => {
        // Si el backend no responde, conserva los datos persistidos localmente
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Métricas reales calculadas a partir del período activo
  const metrics = useMemo(() => {
    const getP = (item: { period?: string; date?: string }) =>
      item.period && item.period.trim().length === 7 ? item.period.trim() : (item.date ? item.date.slice(0, 7) : activePeriod)

    const hasLiveStore = incomes !== undefined || expenses !== undefined
    const periodIncomes = (incomes || []).filter(i => getP(i) === activePeriod)
    const periodExpenses = (expenses || []).filter(e => getP(e) === activePeriod)
    const periodCash = (cashWithdrawals || []).filter(c => getP(c) === activePeriod)

    const computedIncome = periodIncomes.reduce((s, i) => s + i.amount, 0)
    const computedSpent = periodExpenses.reduce((s, e) => s + e.amount, 0) + periodCash.reduce((s, c) => s + c.amount, 0)

    const totalIncome = hasLiveStore ? computedIncome : 170000
    const totalSpent = hasLiveStore ? computedSpent : 78420
    const netFlow = totalIncome - totalSpent

    const savedFeesTotal = commitments
      .filter(c => c.status === 'paid')
      .reduce((acc, c) => acc + (parseFloat(c.lateFeeAvoided.replace(/[^0-9.]/g, '')) || 0), 3450)

    const urgentBill = commitments.find(c => c.status === 'pending' && c.daysRemaining <= 2)

    // Endeudamiento real de tarjetas
    const totalCreditLimit = creditCards.reduce((s, c) => s + (c.creditLimit || 0), 0)
    const totalCardDebt = creditTransactions.filter(t => !t.isPaid).reduce((s, t) => s + t.amount, 0)
    const debtRatio = totalCreditLimit > 0
      ? Number(((totalCardDebt / totalCreditLimit) * 100).toFixed(1))
      : 14.8

    // Regla 50/30/20 real del período
    const needsCats: ExpenseCategory[] = ['housing', 'food', 'utilities', 'health', 'transport', 'education', 'debt']
    const wantsCats: ExpenseCategory[] = ['entertainment', 'other']

    const needsSpent = hasLiveStore
      ? periodExpenses.filter(e => needsCats.includes(e.category)).reduce((s, e) => s + e.amount, 0)
      : 81600
    const wantsSpent = hasLiveStore
      ? periodExpenses.filter(e => wantsCats.includes(e.category)).reduce((s, e) => s + e.amount, 0) + periodCash.reduce((s, c) => s + c.amount, 0)
      : 40800
    const savingsVal = Math.max(0, totalIncome - needsSpent - wantsSpent)
    const denom = Math.max(1, totalIncome, needsSpent + wantsSpent + savingsVal)

    const needsPct = Math.round((needsSpent / denom) * 100)
    const wantsPct = Math.round((wantsSpent / denom) * 100)
    const savingsPct = Math.max(0, 100 - needsPct - wantsPct)

    // 4 Sobres Digitales reales
    const getBudgetLimit = (cats: ExpenseCategory[], fallback: number) => {
      const sum = categoryBudgets
        .filter(b => cats.includes(b.category))
        .reduce((s, b) => s + b.limitAmount, 0)
      return sum > 0 ? sum : fallback
    }

    const envHousingSpent = hasLiveStore
      ? periodExpenses.filter(e => e.category === 'housing' || e.category === 'utilities').reduce((s, e) => s + e.amount, 0)
      : 18400
    const envHousingLimit = getBudgetLimit(['housing', 'utilities'], 34500)
    const envHousingPct = Math.min(100, Math.round((envHousingSpent / envHousingLimit) * 100))

    const envFoodSpent = hasLiveStore
      ? periodExpenses.filter(e => e.category === 'food').reduce((s, e) => s + e.amount, 0)
      : 14230
    const envFoodLimit = getBudgetLimit(['food'], 18000)
    const envFoodPct = Math.min(100, Math.round((envFoodSpent / envFoodLimit) * 100))

    const envEduSpent = hasLiveStore
      ? periodExpenses.filter(e => e.category === 'education' || e.category === 'health').reduce((s, e) => s + e.amount, 0)
      : 12500
    const envEduLimit = getBudgetLimit(['education', 'health'], 8500)
    const envEduPct = Math.min(100, Math.round((envEduSpent / envEduLimit) * 100))

    const envLeisureSpent = hasLiveStore
      ? periodExpenses.filter(e => e.category === 'entertainment' || e.category === 'transport').reduce((s, e) => s + e.amount, 0)
      : 5120
    const envLeisureLimit = getBudgetLimit(['entertainment', 'transport'], 14000)
    const envLeisurePct = Math.min(100, Math.round((envLeisureSpent / envLeisureLimit) * 100))

    const spendPctOfIncome = totalIncome > 0 ? Math.min(100, Number(((totalSpent / totalIncome) * 100).toFixed(1))) : 0
    const savingsRatePct = totalIncome > 0 ? Math.max(0, Number(((netFlow / totalIncome) * 100).toFixed(1))) : 0
    const runwayMonths = totalSpent > 0 ? (Math.max(0, liquidityDop) / totalSpent).toFixed(1) : '6.0'

    return {
      totalSpent,
      totalIncome,
      netFlow,
      savedFeesTotal,
      urgentBill,
      debtRatio,
      totalCardDebt,
      spendPctOfIncome,
      savingsRatePct,
      runwayMonths,
      needsSpent,
      wantsSpent,
      savingsVal,
      needsPct,
      wantsPct,
      savingsPct,
      envelopes: {
        housing: { spent: envHousingSpent, pct: envHousingPct },
        food: { spent: envFoodSpent, pct: envFoodPct },
        edu: { spent: envEduSpent, pct: envEduPct },
        leisure: { spent: envLeisureSpent, pct: envLeisurePct },
      },
    }
  }, [commitments, incomes, expenses, cashWithdrawals, creditCards, creditTransactions, categoryBudgets, activePeriod, liquidityDop])

  // Filtrado de compromisos
  const filteredCommitments = useMemo(() => {
    return commitments.filter(c => {
      if (filter === 'pending') return c.status === 'pending'
      if (filter === 'paid') return c.status === 'paid'
      if (filter === 'urgent') return c.status === 'pending' && c.daysRemaining <= 2
      return true
    })
  }, [commitments, filter])

  // Acción rápida: Marcar pagado y descontar del saldo líquido real
  const handleMarkAsPaid = async (item: CommitmentItem) => {
    if (availableBalance !== undefined && item.amountRaw > Math.max(0, availableBalance)) {
      const errMsg = `Saldo líquido insuficiente (${liquidityDop.toLocaleString('es-DO', { minimumFractionDigits: 2 })}) para pagar ${item.name} (${item.amountFormatted}).`
      onShowToast?.(errMsg, 'error')
      return
    }

    if (onAddExpense && item.amountRaw > 0) {
      const todayIso = new Date().toISOString().slice(0, 10)
      const res = await onAddExpense({
        period: activePeriod,
        description: `Pago Centinela: ${item.name}`,
        amount: item.amountRaw,
        category: mapCommitmentCategoryToExpense(item.category),
        type: 'fixed',
        paymentMethod: 'bank_transfer',
        date: todayIso,
      })
      if (res && res.success === false) return
    }

    setCommitments(prev =>
      prev.map(c => (c.id === item.id ? { ...c, status: 'paid', daysRemaining: 0 } : c))
    )

    const toastMsg = `Factura de "${item.name}" pagada y descontada de tu liquidez. Ahorraste ${item.lateFeeAvoided} en moras.`
    setCelebrationToast(toastMsg)

    setFeed(prev => [
      {
        id: `feed-${Date.now()}`,
        sender: 'Centinela Bot',
        avatarType: 'bot',
        text: toastMsg,
        timestamp: 'Justo ahora',
        amountTag: item.amountFormatted,
      },
      ...prev,
    ])

    setTimeout(() => setCelebrationToast(null), 5000)
  }

  // Simulador de mensaje Telegram conectado al registro real de gastos
  const handleSimulateTelegram = async (e: React.FormEvent) => {
    e.preventDefault()
    const raw = simText.trim()
    if (!raw) return

    const numMatch = raw.match(/(\d+(?:[.,]\d+)?)/)
    const parsedAmount = numMatch ? parseFloat(numMatch[1].replace(',', '.')) : 0
    const { category, tag } = inferTelegramCategory(raw)
    const cleanDesc = raw.replace(/(\d+(?:[.,]\d+)?)/g, '').replace(/\s+/g, ' ').trim() || 'Gasto Captura Telegram'

    if (parsedAmount > 0 && onAddExpense) {
      if (availableBalance !== undefined && parsedAmount > Math.max(0, availableBalance)) {
        onShowToast?.(
          `Saldo insuficiente para registrar RD$ ${parsedAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })} vía Telegram Bot.`,
          'error'
        )
        return
      }
      const todayIso = new Date().toISOString().slice(0, 10)
      const res = await onAddExpense({
        period: activePeriod,
        description: `${cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1)} (Telegram Bot)`,
        amount: parsedAmount,
        category,
        type: 'variable',
        paymentMethod: 'debit_card',
        date: todayIso,
      })
      if (res && res.success === false) return
      onShowToast?.(`Gasto de RD$ ${parsedAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })} conciliado en Egresos`, 'success')
    }

    const newFeedItem: TelegramFeedItem = {
      id: `sim-${Date.now()}`,
      sender: 'Mamá',
      avatarType: 'mama',
      text: raw,
      timestamp: 'Justo ahora',
      aiConfidence: 99,
      categoryTag: tag,
      amountTag: parsedAmount > 0
        ? `RD$ ${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : undefined,
    }

    setFeed(prev => [newFeedItem, ...prev])
    setSimText('')
  }

  // Crear nuevo compromiso
  const handleCreateCommitment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBillName.trim()) return

    const words = newBillName.trim().split(/\s+/)
    const monogram =
      words.length >= 2
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : newBillName.trim().slice(0, 2).toUpperCase()

    const newItem: CommitmentItem = {
      id: `comm-${Date.now()}`,
      name: newBillName,
      monogram,
      category: newBillCategory,
      dueDayOfMonth: Number(newBillDay),
      dueDateStr: `Día ${newBillDay} (${activePeriod})`,
      status: 'pending',
      amountFormatted: `RD$ ${Number(newBillAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      amountRaw: Number(newBillAmount),
      lateFeeAvoided: `RD$ ${Number(newBillLateFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      contractNumber: 'Servicio Recurrente',
      daysRemaining: Math.max(1, Number(newBillDay) - new Date().getDate()),
    }

    setCommitments(prev => [newItem, ...prev])
    setIsModalOpen(false)

    try {
      await apiClient.sentinel.createCommitment({
        name: newBillName,
        dueDayOfMonth: Number(newBillDay),
        expectedAmount: newBillAmount,
        estimatedLateFee: newBillLateFee,
      })
    } catch {
      // Manejado optimistamente en UI
    }

    setNewBillName('')
  }

  const householdTitle = userEmail
    ? `Hogar · ${userEmail.split('@')[0]}`
    : 'Hogar Familia Pérez'

  const splitCurr = (val: number) => {
    const abs = Math.abs(val)
    const str = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const [intPart, decPart] = str.split('.')
    return { intPart, decPart: decPart || '00' }
  }

  const incSplit = splitCurr(metrics.totalIncome)
  const expSplit = splitCurr(metrics.totalSpent)
  const netSplit = splitCurr(metrics.netFlow)

  return (
    <div className="sentinel-dashboard-container">
      {/* Toast de celebración (Portal en document.body) */}
      {celebrationToast && createPortal(
        <div className="fixed top-20 right-6 z-[10050] bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold text-sm">{celebrationToast}</span>
          <button
            onClick={() => setCelebrationToast(null)}
            className="text-emerald-400 hover:text-white ml-2"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>,
        document.body
      )}

      {/* 1. Barra de Telemetría Soberana (Sin emojis, diseño Revolut / Stripe) */}
      <div className="sentinel-header-bar">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="sentinel-household-selector">
            <Home size={15} className="sentinel-gold-icon" />
            <span>{householdTitle}</span>
            <span className="sentinel-currency-chip">DOM · DOP</span>
          </div>

          <div className="sentinel-telemetry-pill">
            <span className="sentinel-pulse-dot" />
            <span>Consola Soberana // ACH Activo</span>
            <span className="sentinel-telemetry-divider">·</span>
            <span className="tabular-nums">Ciclo {activePeriod}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="sentinel-sync-badge">
            <span className="sentinel-pulse-dot" />
            <span>Telegram Bot Conectado</span>
            <span className="sentinel-sync-latency">· Sync 1.2s</span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="sentinel-new-commitment-btn"
          >
            <span className="sentinel-new-commitment-icon">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <span>Nuevo Compromiso</span>
          </button>
        </div>
      </div>

      {/* 2. HERO BENTO CARD: ESTILO REVOLUT ULTRA + CURVA DE VELOCIDAD DE CAJA */}
      <div className="sentinel-hero-shield">
        <div className="sentinel-specular-top-line" />

        <div className="sentinel-revolut-hero-grid">
          {/* Columna Izquierda (7 cols): Liquidez Inmediata, Patrimonio y Alerta Activa */}
          <div className="sentinel-revolut-left">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="sentinel-tier-badge">Nivel Soberano Ultra</span>
                <span className="sentinel-health-score-badge">
                  <span className="sentinel-pulse-dot" />
                  <span>
                    Salud Financiera: {liquidityDop > 0 && metrics.netFlow >= 0 ? 'Óptima / Score A1' : 'En Observación'}
                  </span>
                </span>
              </div>

              <div className="sentinel-savings-pill">
                <PiggyBank className="w-4 h-4" />
                <span className="tabular-nums">
                  RD$ {metrics.savedFeesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ahorrados en moras
                </span>
              </div>
            </div>

            <div className="sentinel-hero-balance-block">
              <span className="sentinel-hero-overline">Liquidez Inmediata Disponible</span>
              <div className="sentinel-hero-balance-row">
                <h1 className="sentinel-hero-amount tabular-nums">
                  RD$ {liquidityDop.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h1>
                <span className="sentinel-hero-usd tabular-nums">
                  ~ US$ {liquidityInUsdFormatted}
                </span>
              </div>

              {/* Píldora de Tasa de Cambio del Día (USD/DOP) con respaldo a tasa anterior */}
              <div className="sentinel-fx-rate-bar">
                <div className="sentinel-fx-rate-main tabular-nums">
                  <span className="sentinel-fx-pair">Tasa USD/DOP:</span>
                  <strong className="sentinel-fx-value">RD$ {fxState.rate.toFixed(2)}</strong>
                </div>

                <span className="sentinel-fx-divider">•</span>

                <span
                  className={`sentinel-fx-status-chip ${fxState.status === 'updated' ? 'updated' : 'unchanged'
                    }`}
                >
                  {fxState.status === 'updated'
                    ? `Actualizada hoy (${fxState.delta >= 0 ? `+${fxState.delta.toFixed(2)}` : fxState.delta.toFixed(2)})`
                    : `Sin cambios · Tasa anterior (${fxState.dateISO})`}
                </span>

                <button
                  type="button"
                  onClick={handleRefreshExchangeRate}
                  disabled={isSyncingFx}
                  className="sentinel-fx-refresh-btn"
                  title="Verificar tasa de cambio del día"
                  aria-label="Verificar tasa de cambio del día"
                >
                  <RefreshCw size={12} className={isSyncingFx ? 'animate-spin' : ''} />
                  <span>{isSyncingFx ? 'Verificando...' : 'Al día'}</span>
                </button>
              </div>
            </div>

            {/* Sub-tarjetas gemelas de Patrimonio y Rendimiento */}
            <div className="sentinel-hero-subcards">
              <div className="sentinel-hero-subcard">
                <span className="sentinel-subcard-label">Patrimonio Neto Operativo</span>
                <span className="sentinel-subcard-value tabular-nums">
                  RD$ {Math.max(0, liquidityDop - metrics.totalCardDebt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="sentinel-subcard-delta positive">
                  <ArrowUpRight size={14} />
                  <span>Libre de pasivos exigibles</span>
                </span>
              </div>

              <div className="sentinel-hero-subcard">
                <span className="sentinel-subcard-label">Reserva &amp; Bóveda de Liquidez</span>
                <span className="sentinel-subcard-value tabular-nums">
                  RD$ {Math.max(0, liquidityDop * 0.65).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="sentinel-subcard-meta">
                  Colchón operativo de {metrics.runwayMonths} meses
                </span>
              </div>
            </div>

            {/* Urgent Callout Box integrado */}
            {metrics.urgentBill ? (
              <div className="sentinel-urgent-box">
                <div className="sentinel-urgent-left">
                  <div className="sentinel-urgent-icon">
                    <Zap className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold sentinel-title-text text-sm sm:text-base">
                        {metrics.urgentBill.name}
                      </span>
                      <span className="sentinel-urgent-pill">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Vence en {Math.max(1, metrics.urgentBill.daysRemaining) * 24}h ({metrics.urgentBill.dueDateStr})
                      </span>
                    </div>
                    <div className="text-xs sentinel-subtitle-text flex items-center gap-2 mt-1 flex-wrap">
                      <span>
                        Monto nominal:{' '}
                        <strong className="sentinel-gold-text font-bold tabular-nums">
                          {metrics.urgentBill.amountFormatted}
                        </strong>
                      </span>
                      <span>•</span>
                      <span className="sentinel-danger-text font-semibold tabular-nums">
                        Recargo evitado hoy: +{metrics.urgentBill.lateFeeAvoided}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleMarkAsPaid(metrics.urgentBill!)}
                  className="sentinel-btn-pay"
                >
                  <Check className="w-4 h-4" />
                  <span>Pagar Ahora</span>
                </button>
              </div>
            ) : (
              <div className="sentinel-safe-zone-banner">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm font-semibold">
                  Zona de Seguridad Sentinel Activa: Cero vencimientos urgentes en las próximas 48 horas.
                </span>
              </div>
            )}
          </div>

          {/* Columna Derecha (5 cols): Curva de Velocidad de Caja 30 Días (Stripe x Revolut Chart) */}
          <div className="sentinel-velocity-panel">
            <div className="sentinel-velocity-header">
              <div>
                <span className="sentinel-subcard-label">Velocidad de Caja · Runway</span>
                <h2 className="sentinel-velocity-title">Curva de Liquidez 30 Días</h2>
              </div>
              <span className="sentinel-inertia-badge">
                <Activity size={13} />
                <span>{metrics.netFlow >= 0 ? 'Inercia Positiva' : 'Flujo Ajustado'}</span>
              </span>
            </div>

            <div className="sentinel-sparkline-canvas">
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 420 155"
              >
                <defs>
                  <linearGradient id="aureusLiquidityGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#C8A962" stopOpacity="0.34" />
                    <stop offset="65%" stopColor="#C8A962" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#C8A962" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Guías horizontales sutiles */}
                <line
                  x1="0"
                  y1="35"
                  x2="420"
                  y2="35"
                  stroke="currentColor"
                  strokeOpacity="0.07"
                  strokeDasharray="3 3"
                />
                <line
                  x1="0"
                  y1="80"
                  x2="420"
                  y2="80"
                  stroke="currentColor"
                  strokeOpacity="0.07"
                  strokeDasharray="3 3"
                />
                {/* Piso de seguridad crítico */}
                <line
                  x1="0"
                  y1="132"
                  x2="420"
                  y2="132"
                  stroke="#EF4444"
                  strokeOpacity="0.45"
                  strokeDasharray="4 4"
                  strokeWidth="1.25"
                />
                {/* Área bajo la curva */}
                <path
                  d="M 0,108 Q 45,98 90,86 T 175,92 T 255,50 T 335,58 T 412,20 L 412,148 L 0,148 Z"
                  fill="url(#aureusLiquidityGlow)"
                />
                {/* Curva continua */}
                <path
                  d="M 0,108 Q 45,98 90,86 T 175,92 T 255,50 T 335,58 T 412,20"
                  fill="none"
                  stroke="#C8A962"
                  strokeLinecap="round"
                  strokeWidth="2.75"
                />
                {/* Puntos clave de quincena y corte */}
                <circle cx="90" cy="86" r="4" fill="#10B981" />
                <circle cx="255" cy="50" r="4.5" fill="#10B981" />
                <circle cx="335" cy="58" r="4" fill="#F59E0B" />
                <circle cx="412" cy="20" r="5" fill="#C8A962" />
              </svg>
            </div>

            <div className="sentinel-velocity-axis tabular-nums">
              <div className="sentinel-axis-point">
                <span className="sentinel-axis-date">INICIO CICLO</span>
                <span className="sentinel-axis-val">
                  RD$ {(Math.max(0, liquidityDop - metrics.netFlow) / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="sentinel-axis-point">
                <span className="sentinel-axis-date">QUINCENA 1</span>
                <span className="sentinel-axis-val emerald">
                  RD$ {(Math.max(0, liquidityDop - metrics.netFlow * 0.4) / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="sentinel-axis-point">
                <span className="sentinel-axis-date">ACTUAL</span>
                <span className="sentinel-axis-val gold">
                  RD$ {(liquidityDop / 1000).toFixed(1)}K
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CUATRO TARJETAS KPI INSTITUCIONALES DESACOPLADAS (1 RENGLÓN POR CIFRA) */}
      <div className="sentinel-kpi-grid">
        {/* KPI 1: Ingresos del Mes */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Ingresos del Mes</span>
            <div className="sentinel-kpi-icon-box emerald">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="sentinel-kpi-value tabular-nums">
            RD$ {incSplit.intPart}<span className="sentinel-decimals">.{incSplit.decPart}</span>
          </div>
          <div className="sentinel-kpi-footer">
            <div className="sentinel-kpi-meta-row">
              <span className="sentinel-kpi-badge">Ciclo {activePeriod}</span>
              <span className="sentinel-kpi-target tabular-nums">Meta: 100%</span>
            </div>
            <div className="sentinel-progress-track">
              <div className="sentinel-progress-fill emerald" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* KPI 2: Gastos Totales */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Gastos Totales</span>
            <div className="sentinel-kpi-icon-box neutral">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="sentinel-kpi-value tabular-nums">
            RD$ {expSplit.intPart}<span className="sentinel-decimals">.{expSplit.decPart}</span>
          </div>
          <div className="sentinel-kpi-footer">
            <div className="sentinel-kpi-meta-row">
              <span className="sentinel-kpi-badge">
                {metrics.spendPctOfIncome <= 80 ? 'Bajo control' : 'Atención ppto'}
              </span>
              <span className="sentinel-kpi-target tabular-nums">Consumo: {metrics.spendPctOfIncome}%</span>
            </div>
            <div className="sentinel-progress-track">
              <div className="sentinel-progress-fill gold" style={{ width: `${metrics.spendPctOfIncome}%` }} />
            </div>
          </div>
        </div>

        {/* KPI 3: Flujo Neto Operativo */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Flujo Neto Operativo</span>
            <div className="sentinel-kpi-icon-box emerald">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="sentinel-kpi-value emerald tabular-nums">
            {metrics.netFlow >= 0 ? '+' : '-'}RD$ {netSplit.intPart}<span className="sentinel-decimals">.{netSplit.decPart}</span>
          </div>
          <div className="sentinel-kpi-footer">
            <div className="sentinel-kpi-meta-row">
              <span className="sentinel-kpi-badge">{metrics.savingsRatePct}% ahorro</span>
              <span className="sentinel-kpi-runway-text">
                {metrics.netFlow >= 0 ? 'Superávit' : 'Déficit'}
              </span>
            </div>
            <div className="sentinel-progress-track">
              <div className="sentinel-progress-fill emerald" style={{ width: `${Math.min(100, metrics.savingsRatePct)}%` }} />
            </div>
          </div>
        </div>

        {/* KPI 4: Nivel de Endeudamiento */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Endeudamiento</span>
            <div className="sentinel-kpi-icon-box gold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="sentinel-kpi-value gold tabular-nums">{metrics.debtRatio}%</div>
          <div className="sentinel-kpi-footer">
            <div className="sentinel-kpi-meta-row">
              <span className="sentinel-kpi-badge neutral">
                {metrics.debtRatio <= 30 ? 'Riesgo Bajo (Lím. 30%)' : 'Riesgo Moderado'}
              </span>
              <span className="sentinel-kpi-fee-text">
                {metrics.debtRatio <= 30 ? 'Capacidad A+' : 'Vigilar'}
              </span>
            </div>
            <div className="sentinel-progress-track">
              <div className="sentinel-progress-fill gold" style={{ width: `${Math.min(100, metrics.debtRatio)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. BLOQUE ASIMÉTRICO PRINCIPAL: RADAR CENTINELA + DOCTRINAS PRESUPUESTARIAS + TELEGRAM LIVE */}
      <div className="sentinel-main-grid">
        {/* Columna Izquierda (60%): Radar Centinela Anti-Moras & Estructura Presupuestaria */}
        <div className="flex flex-col gap-6">
          {/* Radar Centinela Anti-Moras (Stripe-Style Ledger) */}
          <div className="sentinel-card">
            <div className="sentinel-card-header">
              <div className="flex items-center gap-3">
                <div className="sentinel-section-icon-box">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold sentinel-title-text">
                    Radar Centinela Anti-Moras
                  </h3>
                  <p className="text-xs sentinel-subtitle-text">
                    Obligaciones fijas auditadas: {commitments.length} activas en este ciclo de corte
                  </p>
                </div>
              </div>

              <div className="sentinel-filter-pills">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`sentinel-filter-pill ${filter === 'all' ? 'active' : ''}`}
                >
                  Todos ({commitments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('pending')}
                  className={`sentinel-filter-pill ${filter === 'pending' ? 'active' : ''}`}
                >
                  Pendientes ({commitments.filter(c => c.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('paid')}
                  className={`sentinel-filter-pill ${filter === 'paid' ? 'active' : ''}`}
                >
                  Pagados ({commitments.filter(c => c.status === 'paid').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('urgent')}
                  className={`sentinel-filter-pill ${filter === 'urgent' ? 'active' : ''}`}
                >
                  Urgentes ({commitments.filter(c => c.status === 'pending' && c.daysRemaining <= 2).length})
                </button>
              </div>
            </div>

            {/* Encabezado de columnas estilo Stripe */}
            <div className="sentinel-ledger-thead">
              <span>Emisor &amp; Concepto</span>
              <span>Plazo &amp; Cobertura</span>
              <span className="text-right">Monto Nominal &amp; Acción</span>
            </div>

            <div className="sentinel-commitment-list">
              {filteredCommitments.map(c => {
                const isPaid = c.status === 'paid'
                const isUrgent = c.status === 'pending' && c.daysRemaining <= 2

                return (
                  <div key={c.id} className="sentinel-commitment-item">
                    <div className="sentinel-item-left">
                      <div className={`sentinel-item-icon ${c.category}`}>
                        <span className="sentinel-item-monogram">{c.monogram}</span>
                        <span className="sentinel-item-subicon">
                          {c.category === 'electric' && <Zap className="w-3 h-3" />}
                          {c.category === 'telecom' && <Wifi className="w-3 h-3" />}
                          {c.category === 'card' && <CreditCard className="w-3 h-3" />}
                          {c.category === 'education' && <School className="w-3 h-3" />}
                          {c.category === 'water' && <Droplets className="w-3 h-3" />}
                          {c.category === 'other' && <Calendar className="w-3 h-3" />}
                        </span>
                      </div>

                      <div>
                        <div className="sentinel-item-name">
                          <span>{c.name}</span>
                          {isPaid ? (
                            <span className="sentinel-badge paid">
                              <Check size={11} style={{ marginRight: '4px', display: 'inline' }} />
                              Conciliado
                            </span>
                          ) : isUrgent ? (
                            <span className="sentinel-badge urgent">
                              Vence en {Math.max(1, c.daysRemaining) * 24}h
                            </span>
                          ) : (
                            <span className="sentinel-badge pending">
                              En {c.daysRemaining} días
                            </span>
                          )}
                        </div>

                        <div className="sentinel-item-meta">
                          <span>{c.contractNumber || 'Servicio Residencial'}</span>
                          <span>•</span>
                          <span>Corte: {c.dueDateStr}</span>
                          <span>•</span>
                          <span className="sentinel-item-savings tabular-nums">
                            Mora evitada: +{c.lateFeeAvoided}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sentinel-item-right">
                      <div className="text-right">
                        <div className={`sentinel-item-amount tabular-nums ${isPaid ? 'paid' : ''}`}>
                          {c.amountFormatted}
                        </div>
                        <span className="text-xs sentinel-muted-text">
                          {isPaid ? 'Débito ejecutado' : isUrgent ? 'Urgente Pago' : 'Fondos Garantizados'}
                        </span>
                      </div>

                      {!isPaid ? (
                        <button
                          type="button"
                          onClick={() => void handleMarkAsPaid(c)}
                          className={`sentinel-item-pay-btn ${isUrgent ? 'urgent' : ''}`}
                        >
                          Pagar
                        </button>
                      ) : (
                        <span className="sentinel-item-paid-pill">
                          <Check size={13} />
                          <span>Al día</span>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Panel de Métodos Presupuestarios Soberanos (50/30/20 + Sobres Bento + ZBB + Kakebo) */}
          <div className="sentinel-card">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="sentinel-section-icon-box">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold sentinel-title-text text-base">
                    Estructura de Asignación Presupuestaria
                  </h4>
                  <p className="text-xs sentinel-subtitle-text">
                    Validación cruzada institucional de 4 doctrinas de asignación
                  </p>
                </div>
              </div>
              <span className="sentinel-cycle-chip">CICLO {activePeriod}</span>
            </div>

            {/* 1. Barra Compuesta 50 / 30 / 20 */}
            <div className="sentinel-doctrine-block">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="sentinel-title-text">Regla 50/30/20 Institucional</span>
                <span className="sentinel-kpi-runway-text font-mono">
                  {metrics.savingsPct >= 20 ? 'Balance Óptimo' : 'En Ajuste'}
                </span>
              </div>
              <div className="sentinel-composite-bar">
                <div
                  className="sentinel-composite-segment c1"
                  style={{ width: `${metrics.needsPct}%` }}
                  title={`Necesidades: ${metrics.needsPct}% (RD$ ${(metrics.needsSpent / 1000).toFixed(1)}K)`}
                />
                <div
                  className="sentinel-composite-segment c2"
                  style={{ width: `${metrics.wantsPct}%` }}
                  title={`Deseos: ${metrics.wantsPct}% (RD$ ${(metrics.wantsSpent / 1000).toFixed(1)}K)`}
                />
                <div
                  className="sentinel-composite-segment c3"
                  style={{ width: `${metrics.savingsPct}%` }}
                  title={`Ahorro / Inversión: ${metrics.savingsPct}% (RD$ ${(metrics.savingsVal / 1000).toFixed(1)}K)`}
                />
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs sentinel-subtitle-text font-mono pt-1 tabular-nums">
                <span>Necesidades: {metrics.needsPct}% (RD$ {(metrics.needsSpent / 1000).toFixed(1)}K)</span>
                <span>Deseos: {metrics.wantsPct}% (RD$ {(metrics.wantsSpent / 1000).toFixed(1)}K)</span>
                <span className="sentinel-kpi-runway-text font-semibold">
                  Ahorro: {metrics.savingsPct}% (RD$ {(metrics.savingsVal / 1000).toFixed(1)}K)
                </span>
              </div>
            </div>

            {/* 2. Sobres Digitales (4 Bento Envelopes) */}
            <div className="sentinel-category-grid">
              <div className="sentinel-category-box">
                <div className="flex items-center justify-between">
                  <span className="text-xs sentinel-subtitle-text">Vivienda &amp; Luz</span>
                  <span className="text-xs font-mono sentinel-category-val-1 font-bold">
                    {metrics.envelopes.housing.pct}%
                  </span>
                </div>
                <span className="font-bold sentinel-title-text text-sm tabular-nums">
                  RD$ {metrics.envelopes.housing.spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <div className="sentinel-progress-track">
                  <div className="sentinel-progress-fill gold" style={{ width: `${metrics.envelopes.housing.pct}%` }} />
                </div>
              </div>

              <div className="sentinel-category-box">
                <div className="flex items-center justify-between">
                  <span className="text-xs sentinel-subtitle-text">Alimentación</span>
                  <span className="text-xs font-mono sentinel-category-val-3 font-bold">
                    {metrics.envelopes.food.pct}%
                  </span>
                </div>
                <span className="font-bold sentinel-title-text text-sm tabular-nums">
                  RD$ {metrics.envelopes.food.spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <div className="sentinel-progress-track">
                  <div className="sentinel-progress-fill emerald" style={{ width: `${metrics.envelopes.food.pct}%` }} />
                </div>
              </div>

              <div className="sentinel-category-box">
                <div className="flex items-center justify-between">
                  <span className="text-xs sentinel-subtitle-text">Educación &amp; Salud</span>
                  <span className="text-xs font-mono sentinel-category-val-3 font-bold">
                    {metrics.envelopes.edu.pct}%
                  </span>
                </div>
                <span className="font-bold sentinel-title-text text-sm tabular-nums">
                  RD$ {metrics.envelopes.edu.spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <div className="sentinel-progress-track">
                  <div className="sentinel-progress-fill emerald" style={{ width: `${metrics.envelopes.edu.pct}%` }} />
                </div>
              </div>

              <div className="sentinel-category-box">
                <div className="flex items-center justify-between">
                  <span className="text-xs sentinel-subtitle-text">Ocio &amp; Movilidad</span>
                  <span className="text-xs font-mono sentinel-category-val-2 font-bold">
                    {metrics.envelopes.leisure.pct}%
                  </span>
                </div>
                <span className="font-bold sentinel-title-text text-sm tabular-nums">
                  RD$ {metrics.envelopes.leisure.spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <div className="sentinel-progress-track">
                  <div className="sentinel-progress-fill indigo" style={{ width: `${metrics.envelopes.leisure.pct}%` }} />
                </div>
              </div>
            </div>

            {/* 3 & 4. Base Cero (ZBB) & Kakebo */}
            <div className="sentinel-methods-duo">
              <div className="sentinel-method-mini-card">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sentinel-title-text">
                    Presupuesto Base Cero (ZBB)
                  </span>
                  <span className="sentinel-kpi-badge">100% Asignado</span>
                </div>
                <p className="text-xs sentinel-subtitle-text leading-relaxed">
                  Cada peso ingresado tiene destino planificado. Cero fuga no identificada.
                </p>
              </div>

              <div className="sentinel-method-mini-card">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sentinel-title-text">
                    Disciplina Kakebo Reflexivo
                  </span>
                  <span className="sentinel-kpi-badge gold">
                    +RD$ {metrics.savedFeesTotal.toLocaleString('en-US')} evitados
                  </span>
                </div>
                <p className="text-xs sentinel-subtitle-text leading-relaxed">
                  Gasto hormiga y moras neutralizadas por alertas preventivas este mes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (40%): Captura Zero-Fricción (Telegram Bot + OCR Multimodal) */}
        <div className="sentinel-card">
          <div className="sentinel-stream-header">
            <div className="flex items-center gap-2.5">
              <div className="sentinel-section-icon-box indigo">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold sentinel-title-text text-base flex items-center gap-2">
                  <span>Captura Zero-Fricción</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <p className="text-xs sentinel-subtitle-text">
                  Pipeline multimodal · Conciliación directa a Egresos
                </p>
              </div>
            </div>
            <span className="sentinel-telegram-tag">
              <Send size={12} className="sentinel-telegram-tag-icon" />
              <span>Telegram Bot</span>
            </span>
          </div>

          {/* Barra de estado del Bot */}
          <div className="sentinel-bot-status-bar">
            <div className="flex items-center gap-2.5">
              <span className="sentinel-pulse-dot" />
              <span className="text-xs font-bold sentinel-title-text">
                @Aureus_OS_Bot · 24/7 ONLINE
              </span>
            </div>
            <span className="text-xs font-mono sentinel-subtitle-text tabular-nums">
              Sync: &lt;1.2s
            </span>
          </div>

          <div className="sentinel-stream-container">
            {feed.map(item => (
              <div key={item.id} className="sentinel-chat-bubble">
                <div className="sentinel-chat-top">
                  <div className="sentinel-chat-sender">
                    <span className={`sentinel-avatar ${item.avatarType}`}>{item.sender[0]}</span>
                    <span>{item.sender}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.amountTag && (
                      <span className="sentinel-chat-amount tabular-nums">{item.amountTag}</span>
                    )}
                    <span className="sentinel-chat-time">{item.timestamp}</span>
                  </div>
                </div>

                <p className="sentinel-chat-text">{item.text}</p>

                {item.aiConfidence && (
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                    <span className="sentinel-ai-tag">
                      <Sparkles className="w-3 h-3" />
                      <span>{item.aiConfidence}% confianza IA</span>
                    </span>
                    {item.categoryTag && (
                      <span className="text-xs sentinel-muted-text font-medium">
                        {item.categoryTag}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Simulador interactivo de captura por Telegram */}
          <form onSubmit={handleSimulateTelegram} className="sentinel-sim-box">
            <input
              type="text"
              value={simText}
              onChange={e => setSimText(e.target.value)}
              placeholder="Simular ingesta ej: 1500 cena o factura luz..."
              className="sentinel-sim-input"
            />
            <button type="submit" className="sentinel-sim-btn">
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>

      {/* Modal: Nuevo Compromiso Recurrente (Portal en document.body con scroll solo en el contenido) */}
      {isModalOpen && createPortal(
        <div
          className="sentinel-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="sentinel-modal-card"
            onClick={e => e.stopPropagation()}
          >
            <div className="sentinel-modal-header">
              <h3 className="font-bold sentinel-title-text text-base sm:text-lg flex items-center gap-2.5 m-0">
                <Shield className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span>Nuevo Compromiso Recurrente</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="sentinel-modal-close-btn"
                title="Cerrar modal"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommitment} className="sentinel-modal-body">
              <div className="sentinel-form-group">
                <label className="sentinel-form-label">Nombre del Servicio / Compromiso</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="ej: Luz Edesur, Internet Claro, Tarjeta..."
                  value={newBillName}
                  onChange={e => setNewBillName(e.target.value)}
                  className="sentinel-form-input"
                />
              </div>

              <div className="sentinel-form-group">
                <label className="sentinel-form-label">Categoría del Compromiso</label>
                <CustomIconSelect
                  options={COMMITMENT_CATEGORY_OPTIONS}
                  value={newBillCategory}
                  onChange={val => setNewBillCategory(val)}
                  ariaLabel="Categoría del Compromiso"
                />
              </div>

              <div className="sentinel-modal-grid-2">
                <div className="sentinel-form-group">
                  <label className="sentinel-form-label">Día de Corte (1 - 31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={newBillDay}
                    onChange={e => setNewBillDay(Number(e.target.value))}
                    className="sentinel-form-input"
                  />
                </div>

                <div className="sentinel-form-group">
                  <label className="sentinel-form-label">Monto Nominal (RD$)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={newBillAmount}
                    onChange={e => setNewBillAmount(e.target.value)}
                    className="sentinel-form-input"
                  />
                </div>
              </div>

              <div className="sentinel-form-group">
                <label className="sentinel-form-label">
                  Mora o Penalidad Estimada si se Vence (RD$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={newBillLateFee}
                  onChange={e => setNewBillLateFee(e.target.value)}
                  className="sentinel-form-input"
                />
                <span className="text-xs sentinel-subtitle-text">
                  El Centinela te avisará 5 días y 48 horas antes para evitar este recargo.
                </span>
              </div>

              <div className="sentinel-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="sentinel-modal-cancel-btn"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="sentinel-modal-submit-btn"
                >
                  <Plus size={15} />
                  <span>Guardar Compromiso</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
