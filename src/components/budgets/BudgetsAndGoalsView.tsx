import { useState, useMemo, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Edit3,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Flame,
  SlidersHorizontal,
  PiggyBank,
  Trash2,
  X,
  ArrowUpRight,
  Home,
  Utensils,
  Car,
  Zap,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  CreditCard,
  Package,
  RefreshCw,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from 'recharts'
import type {
  Expense,
  Income,
  CategoryBudget,
  SavingsGoal,
  ExpenseCategory,
  GoalCategory,
} from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import {
  calculateCategoryBudgetStatus,
  suggestCategoryBudgetsFromHistory,
  evaluate503020Rule,
} from '../../utils/budgetAdvisor'
import { calculateCumulativeBalance } from '../../utils/calendar'
import { triggerHaptic } from '../../utils/haptics'
import { ActionConfirmationModal, type ActionConfirmationDetail } from '../ui/ActionConfirmationModal'
import './BudgetsAndGoalsView.css'

interface BudgetsAndGoalsViewProps {
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
  categoryBudgets: CategoryBudget[]
  savingsGoals?: SavingsGoal[]
  availableBalance?: number
  onSetCategoryBudget: (category: ExpenseCategory, limit: number, period?: string) => Promise<any>
  onSetMultipleBudgets: (budgetsMap: Record<ExpenseCategory, number>, period?: string) => Promise<any>
  onAddSavingsGoal?: (goal: Omit<SavingsGoal, 'id'>) => Promise<any>
  onUpdateSavingsGoal?: (goal: SavingsGoal) => Promise<any>
  onDepositToGoal?: (goalId: string, amount: number) => Promise<any>
  onDeleteSavingsGoal?: (goalId: string) => Promise<any>
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

const CATEGORIES: ExpenseCategory[] = [
  'housing', 'food', 'transport', 'utilities',
  'health', 'entertainment', 'education', 'debt', 'other',
]

const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: ReactNode }> = {
  housing:       { label: 'Vivienda', icon: <Home size={16} /> },
  food:          { label: 'Alimentación', icon: <Utensils size={16} /> },
  transport:     { label: 'Transporte', icon: <Car size={16} /> },
  utilities:     { label: 'Servicios & Apps', icon: <Zap size={16} /> },
  health:        { label: 'Salud & Bienestar', icon: <HeartPulse size={16} /> },
  entertainment: { label: 'Ocio & Viajes', icon: <Gamepad2 size={16} /> },
  education:     { label: 'Educación & Desarrollo', icon: <GraduationCap size={16} /> },
  debt:          { label: 'Deudas & Pasivos', icon: <CreditCard size={16} /> },
  other:         { label: 'Otros & Contingencia', icon: <Package size={16} /> },
}

export function BudgetsAndGoalsView({
  currentPeriod,
  incomes,
  expenses,
  categoryBudgets,
  savingsGoals = [],
  availableBalance,
  onSetCategoryBudget,
  onSetMultipleBudgets,
  onAddSavingsGoal,
  onDepositToGoal,
  onDeleteSavingsGoal,
  onShowToast,
}: BudgetsAndGoalsViewProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'alert' | 'over'>('all')
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [tempLimit, setTempLimit] = useState<string>('')

  // Estado de aviso de confirmación (Denegar / Aceptar) para todas las acciones
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string
    description: string
    variant: 'gold' | 'emerald' | 'danger'
    details?: ActionConfirmationDetail[]
    onConfirm: () => void | Promise<void>
  } | null>(null)

  // Modal para crear Meta de Ahorro o abonar a una meta
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [goalForm, setGoalForm] = useState<{
    name: string
    targetAmount: string
    currentAmount: string
    monthlyContribution: string
    category: GoalCategory
  }>({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    monthlyContribution: '',
    category: 'emergency',
  })

  useEffect(() => {
    if (!showGoalModal && !depositGoal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowGoalModal(false)
        setDepositGoal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showGoalModal, depositGoal])

  // FIRE Engine Simulation Parameters
  const [fireMode, setFireMode] = useState<'lean' | 'classic' | 'fat'>('classic')
  const [annualSpend, setAnnualSpend] = useState<number>(360000)
  const [swr, setSwr] = useState<number>(4.0)
  const [netReturn, setNetReturn] = useState<number>(8.5)

  const fireTarget = useMemo(() => {
    return Math.round(annualSpend / (swr / 100))
  }, [annualSpend, swr])

  // Total Inflows & Outflows for Period (100% reales)
  const periodIncomes = incomes.filter(i => (i.period && i.period.trim().length === 7 ? i.period.trim() : i.date?.slice(0, 7)) === currentPeriod)
  const periodExpenses = expenses.filter(e => (e.period && e.period.trim().length === 7 ? e.period.trim() : e.date?.slice(0, 7)) === currentPeriod)

  const totalIn = periodIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExp = periodExpenses.reduce((s, e) => s + e.amount, 0)
  const surplus = Math.max(0, totalIn - totalExp)
  const savingsRatePct = totalIn > 0 ? Number(((surplus / totalIn) * 100).toFixed(1)) : 0

  // Category Statuses
  const categoryStatuses = useMemo(() => {
    return CATEGORIES.map(cat => {
      const budget = categoryBudgets.find(b => b.category === cat)
      const limit = budget && budget.limitAmount > 0 ? budget.limitAmount : 5000
      const status = calculateCategoryBudgetStatus(cat, limit, expenses, currentPeriod)
      return {
        category: cat,
        meta: CATEGORY_META[cat],
        limit,
        spent: status.spent,
        pct: status.percentUsed,
        state: status.status,
      }
    })
  }, [categoryBudgets, expenses, currentPeriod])

  const totalBudgeted = categoryStatuses.reduce((s, c) => s + c.limit, 0)
  const totalSpent = categoryStatuses.reduce((s, c) => s + c.spent, 0)
  const freeBudgetMargin = totalBudgeted - totalSpent
  const budgetPctConsumed = totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : '0.0'

  const alertCategories = categoryStatuses.filter(c => c.pct >= 85 && c.pct <= 100)
  const overCategories = categoryStatuses.filter(c => c.pct > 100)
  const safeCategories = categoryStatuses.filter(c => c.pct < 85 && c.limit > c.spent)

  // 50/30/20 Rule
  const rule503020 = useMemo(() => {
    return evaluate503020Rule(incomes, expenses, surplus, currentPeriod)
  }, [incomes, expenses, surplus, currentPeriod])

  // Capital Acumulado Real (Metas de Ahorro + Liquidez Acumulada)
  const cumulative = useMemo(
    () => calculateCumulativeBalance(incomes, expenses, currentPeriod),
    [incomes, expenses, currentPeriod]
  )
  const totalGoalsSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0)
  const totalGoalsTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0)
  const currentAccumulatedCapital = Math.max(0, totalGoalsSaved + Math.max(0, cumulative.totalCumulativeBalance))
  const fireCompletionPct = fireTarget > 0 ? Math.min(100, Number(((currentAccumulatedCapital / fireTarget) * 100).toFixed(1))) : 0

  // Trajectory Curve for FIRE Engine
  const trajectoryData = useMemo(() => {
    const currentNW = currentAccumulatedCapital
    const annualSavings = surplus > 0 ? surplus * 12 : 120000
    const points = []
    let accumulated = currentNW
    const startYear = Number(currentPeriod.slice(0, 4)) || new Date().getFullYear()

    for (let yr = 0; yr <= 10; yr++) {
      const year = startYear + yr
      points.push({
        year: year.toString(),
        portfolio: Math.round(accumulated),
        target: fireTarget,
      })
      accumulated = (accumulated + annualSavings) * (1 + netReturn / 100)
    }
    return points
  }, [currentAccumulatedCapital, surplus, fireTarget, netReturn, currentPeriod])

  const yearsToFire = useMemo(() => {
    if (currentAccumulatedCapital >= fireTarget) return '0.0'
    const annualContribution = surplus > 0 ? surplus * 12 : 120000
    const r = netReturn / 100
    let bal = currentAccumulatedCapital
    for (let y = 1; y <= 40; y++) {
      bal = (bal + annualContribution) * (1 + r)
      if (bal >= fireTarget) return y.toFixed(1)
    }
    return '25+'
  }, [currentAccumulatedCapital, fireTarget, surplus, netReturn])

  // Handle Edit Limit (con confirmación)
  const handleSaveLimit = (cat: ExpenseCategory) => {
    const num = parseFloat(tempLimit)
    if (isNaN(num) || num < 0) {
      onShowToast('Ingresa un monto válido', 'error')
      return
    }
    const catLabel = CATEGORY_META[cat].label

    setPendingConfirm({
      title: 'Confirmar Ajuste de Presupuesto',
      description: `¿Deseas actualizar el límite presupuestario mensual para la categoría "${catLabel}"?`,
      variant: 'gold',
      details: [
        { label: 'Categoría', value: catLabel },
        { label: 'Período Activo', value: currentPeriod },
        { label: 'Nuevo Límite Asignado', value: formatCurrency(num) },
      ],
      onConfirm: async () => {
        setPendingConfirm(null)
        await onSetCategoryBudget(cat, num, currentPeriod)
        onShowToast(`Límite de ${catLabel} actualizado a ${formatCurrency(num)}`, 'success')
        setEditingCategory(null)
      },
    })
  }

  // Auto suggest (con confirmación)
  const handleAutoSuggest = () => {
    const suggestions = suggestCategoryBudgetsFromHistory(expenses, incomes, currentPeriod)
    const totalSuggested = Object.values(suggestions).reduce((s, v) => s + v, 0)

    setPendingConfirm({
      title: 'Confirmar Aplicación de Regla 50/30/20',
      description: '¿Deseas ajustar automáticamente los topes de tus 9 categorías según tus ingresos y el modelo 50/30/20?',
      variant: 'gold',
      details: [
        { label: 'Período a Optimizar', value: currentPeriod },
        { label: 'Partidas Ajustadas', value: '9 categorías operativas' },
        { label: 'Presupuesto Total Sugerido', value: formatCurrency(totalSuggested) },
      ],
      onConfirm: async () => {
        setPendingConfirm(null)
        triggerHaptic('light')
        await onSetMultipleBudgets(suggestions, currentPeriod)
        onShowToast('Límites optimizados según tus gastos e ingresos reales', 'success')
      },
    })
  }

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseFloat(goalForm.targetAmount)
    const current = parseFloat(goalForm.currentAmount) || 0
    const monthly = parseFloat(goalForm.monthlyContribution) || 0
    if (!goalForm.name.trim() || isNaN(target) || target <= 0) {
      onShowToast('Completa el nombre y un monto objetivo válido', 'error')
      return
    }
    const cleanName = goalForm.name.trim()

    setPendingConfirm({
      title: 'Confirmar Nueva Meta de Ahorro',
      description: `¿Deseas crear el fondo con propósito "${cleanName}" en tu plan patrimonial?`,
      variant: 'emerald',
      details: [
        { label: 'Nombre de la Meta', value: cleanName },
        { label: 'Monto Objetivo', value: formatCurrency(target) },
        { label: 'Ahorro Inicial', value: formatCurrency(current) },
        { label: 'Aporte Mensual Sugerido', value: monthly > 0 ? formatCurrency(monthly) : 'Flexible' },
      ],
      onConfirm: async () => {
        setPendingConfirm(null)
        if (onAddSavingsGoal) {
          await onAddSavingsGoal({
            name: cleanName,
            targetAmount: target,
            currentAmount: current,
            monthlyContribution: monthly > 0 ? monthly : undefined,
            category: goalForm.category,
            color: '#34D399',
            isCompleted: current >= target,
          })
          onShowToast(`Meta "${cleanName}" creada correctamente`, 'success')
        }
        setGoalForm({
          name: '',
          targetAmount: '',
          currentAmount: '0',
          monthlyContribution: '',
          category: 'emergency',
        })
        setShowGoalModal(false)
      },
    })
  }

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!depositGoal || !onDepositToGoal) return
    const amt = parseFloat(depositAmount)
    if (isNaN(amt) || amt <= 0) {
      onShowToast('Ingresa un monto de aporte válido', 'error')
      return
    }

    const effectiveAvail = availableBalance !== undefined ? Math.max(0, availableBalance) : Math.max(0, cumulative.totalCumulativeBalance)
    if (amt > effectiveAvail) {
      onShowToast(
        `Saldo líquido insuficiente: dispones de ${formatCurrency(effectiveAvail)} y no puedes abonar ${formatCurrency(amt)} a esta meta.`,
        'error'
      )
      return
    }

    const targetGoal = depositGoal
    setPendingConfirm({
      title: 'Confirmar Aporte a Meta de Ahorro',
      description: `¿Deseas transferir ${formatCurrency(amt)} hacia tu meta "${targetGoal.name}"?`,
      variant: 'emerald',
      details: [
        { label: 'Meta Destino', value: targetGoal.name },
        { label: 'Acumulado Actual', value: formatCurrency(targetGoal.currentAmount) },
        { label: 'Monto a Aportar', value: `+${formatCurrency(amt)}` },
        { label: 'Nuevo Acumulado', value: formatCurrency(targetGoal.currentAmount + amt) },
      ],
      onConfirm: async () => {
        setPendingConfirm(null)
        await onDepositToGoal(targetGoal.id, amt)
        onShowToast(`Aporte de ${formatCurrency(amt)} sumado a "${targetGoal.name}"`, 'success')
        setDepositGoal(null)
        setDepositAmount('')
      },
    })
  }

  const handleRequestDeleteGoal = (goal: SavingsGoal) => {
    if (!onDeleteSavingsGoal) return
    setPendingConfirm({
      title: 'Eliminar Meta de Ahorro',
      description: `¿Estás seguro de que deseas eliminar la meta "${goal.name}" de tu plan financiero?`,
      variant: 'danger',
      details: [
        { label: 'Meta de Ahorro', value: goal.name },
        { label: 'Monto Acumulado', value: formatCurrency(goal.currentAmount) },
        { label: 'Objetivo Original', value: formatCurrency(goal.targetAmount) },
      ],
      onConfirm: async () => {
        setPendingConfirm(null)
        await onDeleteSavingsGoal(goal.id)
        onShowToast(`Meta "${goal.name}" eliminada`, 'info')
      },
    })
  }

  // Filtered categories
  const filteredCategories = categoryStatuses.filter(c => {
    if (filterTab === 'alert') return c.pct >= 85 && c.pct <= 100
    if (filterTab === 'over') return c.pct > 100
    return true
  })

  // Recomendaciones dinámicas del Motor Asesor AUREUS
  const primaryRecommendation = useMemo(() => {
    if (overCategories.length > 0) {
      const worst = [...overCategories].sort((a, b) => (b.spent - b.limit) - (a.spent - a.limit))[0]
      const excess = worst.spent - worst.limit
      const donor = [...safeCategories].sort((a, b) => (b.limit - b.spent) - (a.limit - a.spent))[0]
      return {
        isAlert: true,
        title: `CONTENCIÓN EN ${worst.meta.label.toUpperCase()}`,
        body: donor
          ? `Has superado el tope asignado en ${formatCurrency(excess)}. Sugerimos absorber el excedente desde el margen libre de ${donor.meta.label} (${formatCurrency(donor.limit - donor.spent)} disponible).`
          : `Has superado el tope asignado en ${formatCurrency(excess)}. Ajusta el límite o restringe consumos variables en esta partida durante el resto del ciclo.`,
      }
    }
    if (alertCategories.length > 0) {
      const warn = alertCategories[0]
      return {
        isAlert: true,
        title: `UMBRAL PREVENTIVO EN ${warn.meta.label.toUpperCase()}`,
        body: `Has consumido el ${warn.pct.toFixed(1)}% de tu presupuesto en ${warn.meta.label}. Te restan ${formatCurrency(Math.max(0, warn.limit - warn.spent))} para cerrar el período sin sobregiro.`,
      }
    }
    return {
      isAlert: false,
      title: 'EJECUCIÓN PRESUPUESTARIA BAJO CONTROL',
      body: `Todas tus 9 partidas operan dentro de los límites saludables. Dispones de un margen libre presupuestario de ${formatCurrency(Math.max(0, freeBudgetMargin))}.`,
    }
  }, [overCategories, alertCategories, safeCategories, freeBudgetMargin])

  return (
    <div className="budget-stitch-root fade-in">
      {/* ── CABECERA INSTITUCIONAL STITCH ── */}
      <div className="budget-page-header">
        <div className="budget-title-wrap">
          <h1>Plan Financiero, Presupuesto &amp; Metas FIRE</h1>
          <p>
            Supervisión de asignación de capital mensual, semáforos de tolerancia de gasto y proyección de independencia financiera con retornos reales compuestos.
          </p>
        </div>
        <div className="budget-header-actions">
          <button
            type="button"
            className="btn-stitch-outline btn-rule-animated"
            onClick={handleAutoSuggest}
            title="Ajustar presupuestos automáticamente con la regla 50/30/20"
          >
            <SlidersHorizontal size={14} />
            <span>Aplicar Regla 50/30/20</span>
          </button>
          <button
            type="button"
            className="btn-stitch-gold"
            onClick={() => setShowGoalModal(true)}
          >
            <Plus size={15} />
            <span>Nueva Meta de Ahorro</span>
          </button>
        </div>
      </div>

      {/* ── KPI SUMMARY CARDS (STITCH EXACT 3 CARDS) ── */}
      <div className="budget-kpi-grid">
        {/* KPI 1: Presupuesto Total */}
        <div className="budget-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Presupuesto Mensual Asignado</span>
            <span className="kpi-badge-success">
              <CheckCircle2 size={12} />
              {overCategories.length === 0 ? 'Bajo Control' : `${overCategories.length} con Sobregiro`}
            </span>
          </div>
          <div className="kpi-value-block">
            <div className="kpi-big-number">{formatCurrency(totalBudgeted)}</div>
            <p className="kpi-footnote">
              Gasto actual: <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{formatCurrency(totalSpent)}</strong> ({budgetPctConsumed}% consumido)
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>
            <span>Ciclo activo: {currentPeriod}</span>
            <span style={{ color: freeBudgetMargin >= 0 ? 'var(--color-tertiary, #56e5a9)' : 'var(--color-error, #ffb4ab)', fontWeight: 600 }}>
              {freeBudgetMargin >= 0 ? `+${formatCurrency(freeBudgetMargin)} libre` : `${formatCurrency(freeBudgetMargin)} excedido`}
            </span>
          </div>
        </div>

        {/* KPI 2: Capacidad de Ahorro / Superávit */}
        <div className="budget-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Superávit Mensual Proyectado</span>
            <span className="kpi-badge-success">
              <TrendingUp size={12} />
              {savingsRatePct}% Tasa Ahorro
            </span>
          </div>
          <div className="kpi-value-block">
            <div className="kpi-big-number" style={{ color: 'var(--color-tertiary, #56e5a9)' }}>
              {formatCurrency(surplus)}
            </div>
            <p className="kpi-footnote">
              Ingresos del ciclo: {formatCurrency(totalIn)} · <strong style={{ color: 'var(--color-primary, #ffc174)' }}>Egresos: {formatCurrency(totalExp)}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>
            <span>75% Inversión Indexada: {formatCurrency(surplus * 0.75)}</span>
            <span style={{ color: 'var(--color-on-surface-variant, #d8c3ad)' }}>25% Liquidez: {formatCurrency(surplus * 0.25)}</span>
          </div>
        </div>

        {/* KPI 3: FIRE Metric */}
        <div className="budget-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Progreso de Meta FIRE</span>
            <span className="kpi-badge-success">
              <Flame size={12} />
              {fireCompletionPct >= 50 ? 'En Tramo Sólido' : 'En Construcción'}
            </span>
          </div>
          <div className="kpi-value-block">
            <div className="kpi-big-number" style={{ color: 'var(--color-primary-container, #f59e0b)' }}>
              {fireCompletionPct}% <span style={{ fontSize: 13, color: 'var(--color-outline, #a08e7a)' }}>acumulado</span>
            </div>
            <p className="kpi-footnote">
              {formatCurrency(currentAccumulatedCapital)} acumulado · Objetivo: <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{formatCurrency(fireTarget)}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>
            <span>Horizonte Estimado: <strong>{yearsToFire} años</strong></span>
            <span style={{ color: 'var(--color-primary, #ffc174)', fontWeight: 600 }}>Tasa SWR: {swr}%</span>
          </div>
        </div>
      </div>

      {/* ── METAS DE AHORRO ACTIVAS (CONECTADAS AL STORE) ── */}
      {savingsGoals.length > 0 && (
        <div className="categories-section" style={{ marginBottom: 24 }}>
          <div className="categories-header-row">
            <div>
              <h2 className="categories-title">Metas de Ahorro &amp; Fondos con Propósito</h2>
              <p className="categories-subtitle">
                Acumulado en metas: {formatCurrency(totalGoalsSaved)} de {formatCurrency(totalGoalsTarget)} ({totalGoalsTarget > 0 ? ((totalGoalsSaved / totalGoalsTarget) * 100).toFixed(1) : '0.0'}%)
              </p>
            </div>
          </div>

          <div className="category-grid-3x3">
            {savingsGoals.map(goal => {
              const pct = goal.targetAmount > 0 ? Math.min(100, Number(((goal.currentAmount / goal.targetAmount) * 100).toFixed(1))) : 0
              return (
                <div key={goal.id} className="category-budget-card">
                  <div>
                    <div className="cat-top-row">
                      <div className="cat-name-icon">
                        <PiggyBank size={16} style={{ color: goal.color || '#34D399' }} />
                        <span>{goal.name}</span>
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          backgroundColor: 'rgba(48, 200, 143, 0.15)',
                          color: 'var(--color-tertiary, #56e5a9)',
                        }}
                      >
                        {pct}% COMPLETADO
                      </span>
                    </div>

                    <div className="cat-amounts-row">
                      <span className="cat-spent">{formatCurrency(goal.currentAmount)}</span>
                      <span className="cat-limit">meta {formatCurrency(goal.targetAmount)}</span>
                    </div>

                    <div style={{ marginTop: 10, width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--color-surface-container-highest, #31353e)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: goal.color || 'var(--color-tertiary, #56e5a9)',
                          borderRadius: 9999,
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 11 }}>
                    <span style={{ color: 'var(--color-outline, #a08e7a)' }}>
                      Restante: {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {onDepositToGoal && (
                        <button
                          type="button"
                          onClick={() => {
                            setDepositGoal(goal)
                            setDepositAmount(goal.monthlyContribution ? String(goal.monthlyContribution) : '5000')
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-tertiary, #56e5a9)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600 }}
                        >
                          <ArrowUpRight size={12} /> Abonar
                        </button>
                      )}
                      {onDeleteSavingsGoal && (
                        <button
                          type="button"
                          onClick={() => handleRequestDeleteGoal(goal)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-error, #ffb4ab)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Eliminar meta"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 9 CATEGORIES BUDGET GRID (3x3) ── */}
      <div className="categories-section">
        <div className="categories-header-row">
          <div>
            <h2 className="categories-title">Ejecución por Categorías</h2>
            <p className="categories-subtitle">Control de partidas con política estricta de límites y alertas automáticas</p>
          </div>

          <div className="categories-filter-tabs">
            <button
              type="button"
              className={`filter-tab-btn ${filterTab === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTab('all')}
            >
              Todas ({categoryStatuses.length})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filterTab === 'alert' ? 'active' : ''}`}
              onClick={() => setFilterTab('alert')}
            >
              En Alerta ({alertCategories.length})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filterTab === 'over' ? 'active' : ''}`}
              onClick={() => setFilterTab('over')}
            >
              Sobregiro ({overCategories.length})
            </button>
          </div>
        </div>

        <div className="category-grid-3x3">
          {filteredCategories.map(c => {
            const isEditing = editingCategory === c.category
            const isOver = c.pct > 100
            const isLimit = c.pct >= 85 && c.pct <= 100
            const badgeText = isOver ? `SOBREGIRO +${(c.pct - 100).toFixed(1)}%` : isLimit ? 'AL LÍMITE' : 'BAJO CONTROL'
            const badgeBg = isOver ? 'rgba(244, 63, 94, 0.15)' : isLimit ? 'rgba(245, 158, 11, 0.15)' : 'rgba(48, 200, 143, 0.15)'
            const badgeColor = isOver ? 'var(--color-error, #ffb4ab)' : isLimit ? 'var(--color-primary-container, #f59e0b)' : 'var(--color-tertiary, #56e5a9)'

            return (
              <div key={c.category} className="category-budget-card">
                <div>
                  <div className="cat-top-row">
                    <div className="cat-name-icon">
                      <span style={{ color: badgeColor, display: 'inline-flex', alignItems: 'center' }}>
                        {c.meta.icon}
                      </span>
                      <span>{c.meta.label}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {badgeText}
                    </span>
                  </div>

                  <div className="cat-amounts-row">
                    <span className="cat-spent">{formatCurrency(c.spent)}</span>
                    <span className="cat-limit">de {formatCurrency(c.limit)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop: 10, width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--color-surface-container-highest, #31353e)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(c.pct, 100)}%`,
                        backgroundColor: isOver ? 'var(--color-error, #ffb4ab)' : isLimit ? 'var(--color-primary-container, #f59e0b)' : 'var(--color-tertiary, #56e5a9)',
                        borderRadius: 9999,
                      }}
                    />
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input
                      type="number"
                      value={tempLimit}
                      onChange={e => setTempLimit(e.target.value)}
                      placeholder="Nuevo límite..."
                      style={{
                        flex: 1,
                        background: 'var(--color-surface-container-low, #181c24)',
                        border: '1px solid var(--color-primary-container, #f59e0b)',
                        color: 'var(--color-on-surface, #dfe2ee)',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 12,
                      }}
                    />
                    <button
                      type="button"
                      className="btn-stitch-gold"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => handleSaveLimit(c.category)}
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      className="btn-stitch-outline"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={() => setEditingCategory(null)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 11 }}>
                    <span style={{ color: 'var(--color-outline, #a08e7a)' }}>
                      Margen: {c.limit - c.spent >= 0 ? `+${formatCurrency(c.limit - c.spent)}` : `-${formatCurrency(c.spent - c.limit)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(c.category)
                        setTempLimit(c.limit.toString())
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-primary, #ffc174)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}
                    >
                      <Edit3 size={11} /> Ajustar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SIMULADOR DE INDEPENDENCIA FINANCIERA (FIRE ENGINE) ── */}
      <div className="fire-engine-card">
        <div className="fire-engine-header">
          <div className="fire-title-group">
            <Flame size={22} style={{ color: 'var(--color-primary-container, #f59e0b)', flexShrink: 0 }} />
            <div>
              <h2 className="categories-title">Simulador de Independencia Financiera (FIRE Engine)</h2>
              <p className="categories-subtitle">Cálculo dinámico basado en la Regla Trinity ajustada por inflación y retornos reales compuestos</p>
            </div>
          </div>

          <div className="fire-badges-row">
            <button
              type="button"
              className={`fire-badge-btn ${fireMode === 'lean' ? 'active' : ''}`}
              onClick={() => {
                setFireMode('lean')
                setAnnualSpend(240000)
              }}
            >
              LEAN FIRE (RD$ 6.0M)
            </button>
            <button
              type="button"
              className={`fire-badge-btn ${fireMode === 'classic' ? 'active' : ''}`}
              onClick={() => {
                setFireMode('classic')
                setAnnualSpend(360000)
              }}
            >
              FIRE CLÁSICO (RD$ 9.0M)
            </button>
            <button
              type="button"
              className={`fire-badge-btn ${fireMode === 'fat' ? 'active' : ''}`}
              onClick={() => {
                setFireMode('fat')
                setAnnualSpend(600000)
              }}
            >
              FAT FIRE (RD$ 15.0M)
            </button>
          </div>
        </div>

        <div className="fire-engine-grid">
          {/* Sliders Panel */}
          <div className="fire-sliders-panel">
            <div className="fire-slider-group">
              <div className="fire-slider-label-row">
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Gasto Anual Proyectado</span>
                <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{formatCurrency(annualSpend)}</strong>
              </div>
              <input
                type="range"
                min="120000"
                max="1200000"
                step="20000"
                value={annualSpend}
                onChange={e => setAnnualSpend(Number(e.target.value))}
                className="fire-slider-input"
              />
            </div>

            <div className="fire-slider-group">
              <div className="fire-slider-label-row">
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Tasa Retiro Seguro (SWR)</span>
                <strong style={{ color: 'var(--color-primary, #ffc174)' }}>{swr}%</strong>
              </div>
              <input
                type="range"
                min="2.5"
                max="5.0"
                step="0.1"
                value={swr}
                onChange={e => setSwr(Number(e.target.value))}
                className="fire-slider-input"
              />
            </div>

            <div className="fire-slider-group">
              <div className="fire-slider-label-row">
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Retorno Anual Portafolio</span>
                <strong style={{ color: 'var(--color-tertiary, #56e5a9)' }}>{netReturn}%</strong>
              </div>
              <input
                type="range"
                min="4.0"
                max="12.0"
                step="0.2"
                value={netReturn}
                onChange={e => setNetReturn(Number(e.target.value))}
                className="fire-slider-input"
              />
            </div>

            {/* Result Box */}
            <div className="fire-result-box">
              <span className="fire-result-label">Patrimonio FIRE Requerido</span>
              <span className="fire-result-number">{formatCurrency(fireTarget)}</span>
              <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>
                Multiplicador: {(100 / swr).toFixed(1)}x de gasto anual
              </span>
            </div>
          </div>

          {/* Trajectory Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-outline, #a08e7a)' }}>
                  Curva Proyectada a 10 Años (Interés Compuesto)
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-tertiary, #56e5a9)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> Horizonte: {yearsToFire} años
                </span>
              </div>

              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trajectoryData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fireCurveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#56e5a9" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#56e5a9" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1c2028', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                      formatter={(val) => [formatCurrency(Number(val)), 'Portafolio']}
                    />
                    <Area
                      type="monotone"
                      dataKey="portfolio"
                      stroke="#56e5a9"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#fireCurveGrad)"
                      name="Portafolio Proyectado"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3 Milestone Metrics Trio */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 14, borderTop: '1px solid rgba(49, 53, 62, 0.3)' }}>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-outline, #a08e7a)', textTransform: 'uppercase' }}>Avance Actual</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-tertiary, #56e5a9)' }}>{fireCompletionPct}%</div>
                <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>{formatCurrency(currentAccumulatedCapital)}</span>
              </div>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-outline, #a08e7a)', textTransform: 'uppercase' }}>Horizonte</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-on-surface, #dfe2ee)' }}>{yearsToFire} Años</div>
                <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>Al ritmo actual</span>
              </div>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-outline, #a08e7a)', textTransform: 'uppercase' }}>Renta Mensual FIRE</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary, #ffc174)' }}>{formatCurrency(annualSpend / 12)}</div>
                <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>Preserva capital</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 50/30/20 & REBALANCING RECOMMENDATIONS ── */}
      <div className="budget-insights-grid">
        {/* Regla 50/30/20 Visualizer */}
        <div className="budget-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Desglose Regla 50 / 30 / 20</span>
            <span className="kpi-badge-success">{rule503020.savingsPercent >= 20 ? 'Optimizado' : 'En Ajuste'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '12px 0' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Necesidades Básicas (50% máx.)</span>
                <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{rule503020.needsPercent}% ({formatCurrency(rule503020.needsSpent)})</strong>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--color-surface-container-highest, #31353e)' }}>
                <div style={{ width: `${Math.min(rule503020.needsPercent * 2, 100)}%`, height: '100%', borderRadius: 9999, backgroundColor: 'var(--color-tertiary, #56e5a9)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Deseos &amp; Estilo de Vida (30% máx.)</span>
                <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{rule503020.wantsPercent}% ({formatCurrency(rule503020.wantsSpent)})</strong>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--color-surface-container-highest, #31353e)' }}>
                <div style={{ width: `${Math.min(rule503020.wantsPercent * 3.3, 100)}%`, height: '100%', borderRadius: 9999, backgroundColor: 'var(--color-primary, #ffc174)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Ahorro / Inversión FIRE (20% mín.)</span>
                <strong style={{ color: 'var(--color-tertiary, #56e5a9)' }}>{rule503020.savingsPercent}% ({formatCurrency(rule503020.savingsSpent)})</strong>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--color-surface-container-highest, #31353e)' }}>
                <div style={{ width: `${Math.min(rule503020.savingsPercent * 5, 100)}%`, height: '100%', borderRadius: 9999, backgroundColor: 'var(--color-tertiary, #56e5a9)' }} />
              </div>
            </div>
          </div>

          <span style={{ fontSize: 11, color: 'var(--color-tertiary, #56e5a9)', display: 'block', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)' }}>
            {rule503020.savingsPercent >= 20
              ? `✓ Superas la meta mínima del 20% con ${rule503020.savingsPercent}% destinado a ahorro/patrimonio`
              : `Prioriza reducir gastos variables para alcanzar el 20% de ahorro recomendado`}
          </span>
        </div>

        {/* Strategic Rebalancing Recommendations */}
        <div className="budget-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Recomendaciones del Motor Asesor AUREUS</span>
            <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={11} /> Sync Activo
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '8px 0' }}>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: primaryRecommendation.isAlert ? 'rgba(244, 63, 94, 0.1)' : 'rgba(48, 200, 143, 0.1)',
                border: primaryRecommendation.isAlert ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid rgba(48, 200, 143, 0.25)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: primaryRecommendation.isAlert ? 'var(--color-error, #ffb4ab)' : 'var(--color-tertiary, #56e5a9)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {primaryRecommendation.isAlert ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                <span>{primaryRecommendation.title}</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant, #d8c3ad)', marginTop: 4, lineHeight: 1.4 }}>
                {primaryRecommendation.body}
              </p>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: 10, backgroundColor: 'rgba(48, 200, 143, 0.1)', border: '1px solid rgba(48, 200, 143, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-tertiary, #56e5a9)', fontSize: 11, fontWeight: 700 }}>
                <TrendingUp size={13} /> CAPACIDAD DE CAPITALIZACIÓN DEL PERÍODO
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant, #d8c3ad)', marginTop: 4, lineHeight: 1.4 }}>
                Con tu superávit actual de {formatCurrency(surplus)}, puedes aportar {formatCurrency(surplus * 0.6)} a tus metas de ahorro e inversión sin comprometer tu liquidez operativa.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>
            <span>Auditoría del ciclo {currentPeriod}</span>
            <span style={{ color: 'var(--color-tertiary, #56e5a9)' }}>{savingsGoals.length} metas activas</span>
          </div>
        </div>
      </div>

      {/* ── MODAL PARA CREAR META DE AHORRO (PORTAL EN DOCUMENT.BODY) ── */}
      {showGoalModal && createPortal(
        <div className="aureus-modal-backdrop" onClick={() => setShowGoalModal(false)}>
          <div className="aureus-modal-card" onClick={e => e.stopPropagation()}>
            <div className="aureus-modal-header">
              <h2 className="modal-title" style={{ margin: 0 }}>
                <PiggyBank size={16} className="text-gold" />
                <span>Nueva Meta de Ahorro</span>
              </h2>
              <button
                type="button"
                className="aureus-modal-close"
                onClick={() => setShowGoalModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="aureus-field-label">Nombre de la Meta</label>
                <input
                  className="aureus-adaptive-input"
                  placeholder="Ej: Fondo de Emergencia, Inicial Apartamento..."
                  value={goalForm.name}
                  onChange={e => setGoalForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                  required
                />
              </div>

              <div className="aureus-modal-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Monto Objetivo (RD$)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    className="aureus-adaptive-input"
                    placeholder="150000"
                    value={goalForm.targetAmount}
                    onChange={e => setGoalForm(p => ({ ...p, targetAmount: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Ahorro Inicial (RD$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="aureus-adaptive-input"
                    placeholder="0"
                    value={goalForm.currentAmount}
                    onChange={e => setGoalForm(p => ({ ...p, currentAmount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="aureus-modal-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Aporte Mensual Sugerido (RD$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="aureus-adaptive-input"
                    placeholder="10000"
                    value={goalForm.monthlyContribution}
                    onChange={e => setGoalForm(p => ({ ...p, monthlyContribution: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Propósito</label>
                  <select
                    className="aureus-adaptive-input"
                    value={goalForm.category}
                    onChange={e => setGoalForm(p => ({ ...p, category: e.target.value as GoalCategory }))}
                  >
                    <option value="emergency">Fondo de Emergencia</option>
                    <option value="investment">Portafolio / Inversión</option>
                    <option value="housing">Vivienda / Inicial</option>
                    <option value="vehicle">Vehículo</option>
                    <option value="vacation">Viajes &amp; Vacaciones</option>
                    <option value="education">Educación</option>
                    <option value="other">Otro Propósito</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  className="aureus-btn-secondary"
                  onClick={() => setShowGoalModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="sandbox-btn-gold">
                  <Plus size={14} />
                  <span>Crear Meta</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL PARA ABONAR A UNA META DE AHORRO (PORTAL EN DOCUMENT.BODY) ── */}
      {depositGoal && createPortal(
        <div className="aureus-modal-backdrop" onClick={() => setDepositGoal(null)}>
          <div className="aureus-modal-card" onClick={e => e.stopPropagation()}>
            <div className="aureus-modal-header">
              <h2 className="modal-title" style={{ margin: 0 }}>
                <PiggyBank size={16} className="text-emerald" />
                <span>Abonar a Meta: {depositGoal.name}</span>
              </h2>
              <button
                type="button"
                className="aureus-modal-close"
                onClick={() => setDepositGoal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                Acumulado actual: <strong className="text-emerald">{formatCurrency(depositGoal.currentAmount)}</strong> de {formatCurrency(depositGoal.targetAmount)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="aureus-field-label">Monto a Aportar (RD$)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="aureus-adaptive-input"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  className="aureus-btn-secondary"
                  onClick={() => setDepositGoal(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="sandbox-btn-gold">
                  <ArrowUpRight size={14} />
                  <span>Confirmar Aporte</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Aviso de Confirmación (Denegar / Aceptar) para todas las acciones */}
      <ActionConfirmationModal
        isOpen={Boolean(pendingConfirm)}
        title={pendingConfirm?.title || ''}
        description={pendingConfirm?.description || ''}
        variant={pendingConfirm?.variant || 'gold'}
        details={pendingConfirm?.details}
        confirmLabel="Aceptar"
        cancelLabel="Denegar"
        onConfirm={() => pendingConfirm?.onConfirm()}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  )
}
