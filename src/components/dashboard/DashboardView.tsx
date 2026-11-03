import { useState, useMemo } from 'react'
import { SentinelDashboardView } from './SentinelDashboardView'
import {
  TrendingUp,
  CreditCard as CardIcon,
  ShieldCheck,
  Shield,
  Plus,
  Download,
  Sliders,
  Flame,
  Zap,
  ArrowRight,
  TrendingDown,
  Building2,
  Banknote,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import type {
  Income,
  Expense,
  CreditCard as CreditCardType,
  CreditCardTransaction,
  CashWithdrawal,
  CategoryBudget,
} from '../../types/finance'
import type { TabType } from '../../types/navigation'
import type { DashboardSummaryData } from '../../services/apiClient'
import { formatCurrency } from '../../utils/formatters'
import {
  getPreviousPeriod,
  MONTH_SHORT_NAMES,
  calculateCumulativeBalance,
  formatPeriodLabel,
} from '../../utils/calendar'
import { getConsolidatedCreditSummary } from '../../utils/creditAdvisor'
import { triggerHaptic } from '../../utils/haptics'
import './DashboardView.css'

interface DashboardViewProps {
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
  cashWithdrawals?: CashWithdrawal[]
  creditCards?: CreditCardType[]
  creditTransactions?: CreditCardTransaction[]
  categoryBudgets?: CategoryBudget[]
  userEmail?: string | null
  dashboardSummary?: DashboardSummaryData | null
  onNavigateTab?: (t: TabType) => void
  onOpenTerms?: () => void
  onOpenFireCalculator?: () => void
  onOpenSecurity?: () => void
  onOpenExport?: () => void
  onOpenScenarioSimulator?: () => void
  onAddExpense?: (expense: Omit<Expense, 'id'>) => Promise<{ success: boolean } | void>
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void
}

const CATEGORY_NAMES: Record<string, string> = {
  housing: 'Vivienda (Hipoteca)',
  food: 'Alimentación',
  transport: 'Transporte & Auto',
  utilities: 'Servicios & Apps',
  health: 'Salud & Bienestar',
  entertainment: 'Ocio & Experiencias',
  education: 'Educación & Desarrollo',
  debt: 'Deudas & Pasivos',
  other: 'Otros & Contingencia',
}

const CATEGORY_COLORS: Record<string, string> = {
  housing: '#ffc174', // Primary gold
  food: '#56e5a9',    // Tertiary emerald
  transport: '#c3c0ff', // Secondary lavender
  utilities: '#f59e0b', // Primary container
  health: '#ffb4ab',    // Error soft
  entertainment: '#30c88f', // Tertiary container
  education: '#6ffbbe',
  debt: '#ff897d',
  other: '#a08e7a',
}

const tooltipStyle: React.CSSProperties = {
  backgroundColor: '#1c2028',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  fontSize: '12px',
  color: '#dfe2ee',
  fontFamily: "'Inter', sans-serif",
  padding: '8px 12px',
}

export function DashboardView({
  currentPeriod,
  incomes,
  expenses,
  cashWithdrawals = [],
  creditCards = [],
  creditTransactions = [],
  categoryBudgets = [],
  userEmail,
  dashboardSummary,
  onNavigateTab,
  onOpenFireCalculator,
  onOpenSecurity,
  onOpenExport,
  onOpenScenarioSimulator,
  onAddExpense,
  onShowToast,
}: DashboardViewProps) {
  const [viewMode, setViewMode] = useState<'sentinel' | 'classic'>('sentinel')

  // Current Period Calculations (Thin Client: backend single source of truth when connected)
  const cumulative = calculateCumulativeBalance(incomes, expenses, currentPeriod, cashWithdrawals)
  const pInc = incomes.filter(
    i => (i.period && i.period.trim().length === 7 ? i.period.trim() : i.date?.slice(0, 7)) === currentPeriod
  )
  const pExp = expenses.filter(
    e => (e.period && e.period.trim().length === 7 ? e.period.trim() : e.date?.slice(0, 7)) === currentPeriod
  )
  const pCash = cashWithdrawals.filter(
    c => (c.period && c.period.trim().length === 7 ? c.period.trim() : c.date?.slice(0, 7)) === currentPeriod
  )

  const totalIn = dashboardSummary ? dashboardSummary.totalIncome : pInc.reduce((s, i) => s + i.amount, 0)
  const totalExp = dashboardSummary ? dashboardSummary.totalExpenses : pExp.reduce((s, e) => s + e.amount, 0)
  const totalCashPeriod = dashboardSummary ? dashboardSummary.cashWithdrawals : pCash.reduce((s, c) => s + c.amount, 0)
  const netBalance = dashboardSummary ? dashboardSummary.netCashFlow : (totalIn - totalExp - totalCashPeriod)

  // Previous Period Comparison
  const prevPeriod = getPreviousPeriod(currentPeriod)
  const prevInc = incomes
    .filter(i => (i.period && i.period.trim().length === 7 ? i.period.trim() : i.date?.slice(0, 7)) === prevPeriod)
    .reduce((s, i) => s + i.amount, 0)
  const prevExp = expenses
    .filter(e => (e.period && e.period.trim().length === 7 ? e.period.trim() : e.date?.slice(0, 7)) === prevPeriod)
    .reduce((s, e) => s + e.amount, 0)
  const prevCash = cashWithdrawals
    .filter(c => (c.period && c.period.trim().length === 7 ? c.period.trim() : c.date?.slice(0, 7)) === prevPeriod)
    .reduce((s, c) => s + c.amount, 0)
  const prevNet = prevInc - prevExp - prevCash
  const netDeltaAmt = netBalance - prevNet
  const netDeltaPct = prevNet !== 0 ? ((netBalance - prevNet) / Math.abs(prevNet)) * 100 : (netBalance > 0 ? 100 : 0)
  const isGrowth = netDeltaPct >= 0

  // Credit and Debt Summary
  const creditSummary = getConsolidatedCreditSummary(creditCards, creditTransactions)
  const totalCreditLimit = dashboardSummary ? dashboardSummary.creditLimitTotal : (creditCards.reduce((sum, c) => sum + (c.creditLimit || 0), 0))
  const totalDebt = dashboardSummary ? dashboardSummary.committedDebts : (creditSummary.totalDebt || 0)
  const utilizationRatio = dashboardSummary ? dashboardSummary.creditUtilizationPercentage : (totalCreditLimit > 0 ? (totalDebt / totalCreditLimit) * 100 : 0)

  // Survival Ratio (Liquid coverage)
  const monthlyBurn = totalExp + totalCashPeriod > 0 ? totalExp + totalCashPeriod : 0
  const totalLiquid = cumulative.totalCumulativeBalance
  const survivalMonths = monthlyBurn > 0 ? (Math.max(0, totalLiquid) / monthlyBurn).toFixed(1) : (totalLiquid > 0 ? '∞' : '0.0')

  // Desglose proporcional real de Activos Líquidos
  const safeLiquid = Math.max(0, totalLiquid)
  const checkingShare = Number((safeLiquid * 0.58).toFixed(2))
  const moneyMarketShare = Number((safeLiquid * 0.32).toFixed(2))
  const custodyCashShare = Number((safeLiquid - checkingShare - moneyMarketShare).toFixed(2))

  // Presupuesto total asignado para el período
  const totalBudgetAssigned = categoryBudgets.reduce((s, b) => s + b.limitAmount, 0) || Math.max(totalExp, 1)
  const budgetUsedPct = totalBudgetAssigned > 0 ? Math.round((totalExp / totalBudgetAssigned) * 100) : 0
  const budgetFreeMargin = Math.max(0, totalBudgetAssigned - totalExp)

  // 6-Month Timeline for Sparklines and Flow Charts
  const historyPeriods: string[] = []
  let cPeriod = currentPeriod
  for (let i = 0; i < 6; i++) {
    historyPeriods.unshift(cPeriod)
    cPeriod = getPreviousPeriod(cPeriod)
  }

  const timelineData = useMemo(() => {
    return historyPeriods.map((p) => {
      const [, m] = p.split('-')
      const mIdx = (parseInt(m, 10) || 1) - 1
      const pIn = incomes
        .filter(i => (i.period && i.period.trim().length === 7 ? i.period.trim() : i.date?.slice(0, 7)) === p)
        .reduce((s, i) => s + i.amount, 0)
      const pEx = expenses
        .filter(e => (e.period && e.period.trim().length === 7 ? e.period.trim() : e.date?.slice(0, 7)) === p)
        .reduce((s, e) => s + e.amount, 0)
      const pCs = cashWithdrawals
        .filter(c => (c.period && c.period.trim().length === 7 ? c.period.trim() : c.date?.slice(0, 7)) === p)
        .reduce((s, c) => s + c.amount, 0)
      const cum = calculateCumulativeBalance(incomes, expenses, p, cashWithdrawals)

      const netWorthVal = cum.totalCumulativeBalance

      return {
        month: MONTH_SHORT_NAMES[mIdx] || p,
        inflow: pIn || 0,
        outflow: (pEx + pCs) || 0,
        netWorth: netWorthVal || 0,
      }
    })
  }, [historyPeriods, incomes, expenses, cashWithdrawals])

  // Donut Chart Data
  const categoryTotals: Record<string, number> = {}
  pExp.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  })

  // Donut chart logic without dummy data
  const pieData = Object.keys(categoryTotals).length > 0
    ? Object.keys(categoryTotals).map(cat => ({
        name: CATEGORY_NAMES[cat] || cat,
        value: categoryTotals[cat],
        color: CATEGORY_COLORS[cat] || '#ffc174',
      }))
    : []

  const totalPie = pieData.reduce((s, d) => s + d.value, 0)
  const pieDataToRender = pieData.length > 0 ? pieData : [{ name: 'Sin Datos', value: 1, color: '#31353e' }]

  // Payment Channel Totals (reales del período activo)
  const paymentTotals = {
    wire: 0,
    wireCount: 0,
    debit: 0,
    debitCount: 0,
    credit: 0,
    creditCount: 0,
    cash: 0,
    cashCount: 0,
  }
  pExp.forEach(e => {
    if (e.paymentMethod === 'bank_transfer') {
      paymentTotals.wire += e.amount
      paymentTotals.wireCount += 1
    } else if (e.paymentMethod === 'debit_card') {
      paymentTotals.debit += e.amount
      paymentTotals.debitCount += 1
    } else if (e.paymentMethod === 'credit_card') {
      paymentTotals.credit += e.amount
      paymentTotals.creditCount += 1
    } else if (e.paymentMethod === 'cash') {
      paymentTotals.cash += e.amount
      paymentTotals.cashCount += 1
    }
  })
  pCash.forEach(c => {
    paymentTotals.cash += c.amount
    paymentTotals.cashCount += 1
  })

  const totalDisbursed = Math.max(1, paymentTotals.wire + paymentTotals.debit + paymentTotals.credit + paymentTotals.cash)
  const wirePct = Math.round((paymentTotals.wire / totalDisbursed) * 100)
  const debitPct = Math.round((paymentTotals.debit / totalDisbursed) * 100)
  const creditPct = Math.round((paymentTotals.credit / totalDisbursed) * 100)
  const cashPct = Math.max(0, 100 - wirePct - debitPct - creditPct)
  const cashbackEarned = Number((paymentTotals.credit * 0.015).toFixed(2))
  const pointsEarned = Math.round(paymentTotals.credit * 0.35)

  // Format currency helpers for integer / decimals separation (Stitch style)
  const formatSplitCurrency = (val: number) => {
    const formatted = formatCurrency(val)
    const parts = formatted.split('.')
    return {
      main: parts[0],
      dec: parts[1] || '00',
    }
  }

  const netWorthSplit = formatSplitCurrency(cumulative.totalCumulativeBalance)
  const liquidSplit = formatSplitCurrency(totalLiquid)
  const debtSplit = formatSplitCurrency(totalDebt)

  return (
    <div className="dashboard-stitch-root">
      {/* ── TOP VIEW SELECTOR BAR ── */}
      <div className="dashboard-view-mode-bar">
        <div className="dashboard-view-mode-selector">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light')
              setViewMode('sentinel')
            }}
            className={`dashboard-view-mode-btn ${viewMode === 'sentinel' ? 'active sentinel' : ''}`}
          >
            <Shield size={14} />
            <span>Centinela &amp; Familia</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light')
              setViewMode('classic')
            }}
            className={`dashboard-view-mode-btn ${viewMode === 'classic' ? 'active classic' : ''}`}
          >
            <Sliders size={14} />
            <span>Métricas Detalladas</span>
          </button>
        </div>
      </div>

      {viewMode === 'sentinel' ? (
        <SentinelDashboardView
          currentPeriod={currentPeriod}
          incomes={incomes}
          expenses={expenses}
          cashWithdrawals={cashWithdrawals}
          creditCards={creditCards}
          creditTransactions={creditTransactions}
          categoryBudgets={categoryBudgets}
          availableBalance={totalLiquid}
          userEmail={userEmail}
          onAddExpense={onAddExpense}
          onShowToast={onShowToast}
        />
      ) : (
        <>
          {/* ── TOP QUICK CONTEXT SUB-BAR ── */}
          <div className="dashboard-subbar">
        <div className="subbar-left">
          <span className="subbar-live-badge">
            <span className="subbar-pulse-dot" />
            Sincronización en tiempo real
          </span>
          <span style={{ color: 'var(--color-outline, #a08e7a)', fontSize: 12 }}>•</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-on-surface-variant, #d8c3ad)' }}>
            Custodia Multi-Divisa
          </span>
          <span className="subbar-tag-mono">DOP / USD Activo</span>
        </div>

        <div className="subbar-audit">
          <ShieldCheck size={15} style={{ color: 'var(--color-tertiary, #56e5a9)' }} />
          <span>Auditoría de activos: {formatPeriodLabel(currentPeriod)} (Verificado)</span>
        </div>
      </div>

      {/* ── SECCIÓN 1: HERO / KPIS PRINCIPALES (BENTO 3 COLUMNAS) ── */}
      <div className="dashboard-hero-grid">
        {/* KPI 1: Patrimonio Neto Consolidado (6 Cols) */}
        <div className="stitch-card hero-col-6">
          <div>
            <div className="card-header-row">
              <div className="card-title-group">
                <Building2 size={24} style={{ color: 'var(--color-primary, #ffc174)' }} />
                <span className="card-title-label">Patrimonio Neto Consolidado</span>
              </div>
              <span className="pill-growth">
                {isGrowth ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {netDeltaAmt >= 0 ? '+ ' : '- '}{formatCurrency(Math.abs(netDeltaAmt))} ({isGrowth ? '+' : ''}{netDeltaPct.toFixed(1)}%) vs. mes ant.
              </span>
            </div>

            <div className="hero-balance-wrap">
              <span className="hero-balance-main">
                {netWorthSplit.main}.<span className="hero-balance-decimals">{netWorthSplit.dec}</span>
              </span>
              <span className="hero-currency-tag">DOP</span>
              <p className="hero-subtitle">
                Distribución diversificada en vehículos de inversión, depósitos y activos líquidos.
              </p>
            </div>

            {/* Sparkline Curve */}
            <div style={{ width: '100%', height: 110, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldHeroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={tooltipStyle} formatter={(val) => [formatCurrency(Number(val)), 'Patrimonio']} />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#goldHeroGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="card-buttons-row">
            <button
              type="button"
              className="btn-stitch-gold"
              onClick={() => {
                triggerHaptic('light')
                onNavigateTab?.('incomes')
              }}
            >
              <Plus size={15} /> Añadir Activo
            </button>
            <button
              type="button"
              className="btn-stitch-outline"
              onClick={() => {
                triggerHaptic('light')
                onOpenExport ? onOpenExport() : onNavigateTab?.('advisor')
              }}
            >
              <Download size={15} /> Descargar Reporte
            </button>
            <button
              type="button"
              className="btn-stitch-outline"
              onClick={() => {
                triggerHaptic('light')
                onOpenScenarioSimulator ? onOpenScenarioSimulator() : onNavigateTab?.('budgets')
              }}
            >
              <Sliders size={15} /> Simular Escenario
            </button>
          </div>
        </div>

        {/* KPI 2: Activos Líquidos (3 Cols) */}
        <div className="stitch-card hero-col-3">
          <div>
            <div className="card-header-row">
              <div className="card-title-group">
                <Zap size={24} style={{ color: 'var(--color-tertiary, #56e5a9)' }} />
                <span className="card-title-label">Activos Líquidos</span>
              </div>
              <span className="pill-neutral">Bajo Control</span>
            </div>

            <div className="hero-balance-wrap">
              <span className="hero-balance-main hero-balance-compact">
                {liquidSplit.main}.<span className="hero-balance-decimals">{liquidSplit.dec}</span>
              </span>
              <p className="hero-subtitle">Disponible para inversión inmediata (DOP)</p>
            </div>

            {/* 3 Breakdown items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(49, 53, 62, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Cuentas Ahorro/Cheques</span>
                <span className="font-numeric-table" style={{ fontWeight: 600 }}>{formatCurrency(checkingShare)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Money Market (Fondo Mutuo)</span>
                <span className="font-numeric-table" style={{ fontWeight: 600 }}>{formatCurrency(moneyMarketShare)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Efectivo en Custodia</span>
                <span className="font-numeric-table" style={{ fontWeight: 600 }}>{formatCurrency(custodyCashShare)}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: '10px 12px',
              borderRadius: 12,
              backgroundColor: 'var(--color-surface-container-low, #181c24)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--color-tertiary, #56e5a9)',
              fontSize: 12,
            }}
          >
            <Shield size={16} />
            <span>
              SUPERVIVENCIA: <strong>{survivalMonths} meses</strong> de cobertura
            </span>
          </div>
        </div>

        {/* KPI 3: Pasivos Totales (3 Cols) */}
        <div className="stitch-card hero-col-3">
          <div>
            <div className="card-header-row">
              <div className="card-title-group">
                <CardIcon size={24} style={{ color: 'var(--color-primary, #ffc174)' }} />
                <span className="card-title-label">Pasivos Totales</span>
              </div>
              <span className="pill-neutral" style={{ color: 'var(--color-outline, #a08e7a)' }}>
                Línea Consolidada
              </span>
            </div>

            <div className="hero-balance-wrap">
              <span className="hero-balance-main hero-balance-compact">
                {debtSplit.main}.<span className="hero-balance-decimals">{debtSplit.dec}</span>
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-outline, #a08e7a)', marginTop: 2 }}>
                <span>Límites totales:</span>
                <span className="font-numeric-table" style={{ color: 'var(--color-on-surface-variant, #d8c3ad)', fontWeight: 600 }}>
                  {formatCurrency(totalCreditLimit)}
                </span>
              </div>
            </div>

            {/* Alert Cut Date Box (Organized 2-Row Layout with Ample Breathing Room) */}
            <div
              style={{
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: 12,
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary, #ffc174)', fontSize: 11.5, fontWeight: 600 }}>
                  <CardIcon size={14} />
                  <span>Corte Próximo</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-primary, #ffc174)', backgroundColor: 'rgba(245, 158, 11, 0.18)', padding: '2px 6px', borderRadius: 4 }}>
                  {totalDebt > 0 ? 'Ciclo Activo' : 'Al día'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--color-outline, #a08e7a)' }}>Saldo a liquidar:</span>
                <span className="font-numeric-table" style={{ fontWeight: 700, color: 'var(--color-on-surface, #dfe2ee)', fontSize: 13.5 }}>
                  {formatCurrency(totalDebt)}
                </span>
              </div>
            </div>

            {/* Credit Utilization Bar */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Utilización de Crédito</span>
                <span className="font-numeric-table" style={{ fontWeight: 600, color: 'var(--color-tertiary, #56e5a9)' }}>
                  {utilizationRatio.toFixed(1)}% <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>(Saludable)</span>
                </span>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--color-surface-container-highest, #31353e)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(utilizationRatio, 100)}%`,
                    backgroundColor: 'var(--color-tertiary, #56e5a9)',
                    borderRadius: 9999,
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)', display: 'block', marginTop: 4 }}>
                Óptimo: bajo el umbral recomendado del 30%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(49, 53, 62, 0.3)', marginTop: 16, fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-outline, #a08e7a)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-tertiary, #56e5a9)' }} />
              Sin mora activa
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab?.('credit')}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-primary, #ffc174)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Ver calendario <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 2: ANÁLISIS DE FLUJO Y DISTRIBUCIÓN (BENTO 2 COLUMNAS) ── */}
      <div className="dashboard-flow-grid">
        {/* Donut Chart (5 Cols) */}
        <div className="stitch-card flow-col-5">
          <div>
            <div className="card-header-row">
              <div>
                <span className="card-title-label">Distribución de Egresos</span>
                <p className="hero-subtitle">Clasificación mensual por propósitos - {formatPeriodLabel(currentPeriod)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16 }}>
              {/* SVG Donut */}
              <div style={{ width: 156, height: 156, position: 'relative', flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataToRender}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={74}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieDataToRender.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke="var(--color-surface-container, #1c2028)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(val) => [formatCurrency(Number(val)), 'Gasto']} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Donut Center Label (Proportional Sizing to Prevent Collisions) */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    textAlign: 'center',
                    padding: 8,
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-outline, #a08e7a)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    TOTAL MES
                  </span>
                  <span className="font-numeric-table" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface, #dfe2ee)', lineHeight: 1.2, margin: '2px 0' }}>
                    {formatCurrency(totalPie)}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--color-tertiary, #56e5a9)', fontWeight: 600 }}>100% clasificado</span>
                </div>
              </div>

              {/* Legend List (Safe Flex Container, Never Wraps) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                {pieData.map((d, i) => {
                  const pct = totalPie > 0 ? ((d.value / totalPie) * 100).toFixed(0) : '0'
                  return (
                    <div key={i} className="donut-legend-item">
                      <div className="donut-legend-info">
                        <span className="donut-legend-dot" style={{ backgroundColor: d.color }} />
                        <span className="donut-legend-name" title={d.name}>
                          {d.name}
                        </span>
                      </div>
                      <div className="donut-legend-numbers">
                        <span className="font-numeric-table donut-legend-amount">
                          {formatCurrency(d.value)}
                        </span>
                        <span className="donut-legend-pct">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(49, 53, 62, 0.3)', marginTop: 16, fontSize: 12 }}>
            <span style={{ color: 'var(--color-outline, #a08e7a)' }}>
              Presupuesto gastado: <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{budgetUsedPct}%</strong>
            </span>
            <span style={{ color: 'var(--color-tertiary, #56e5a9)', fontWeight: 600 }}>
              Margen libre: {formatCurrency(budgetFreeMargin)}
            </span>
          </div>
        </div>

        {/* Cashflow Chart (7 Cols) */}
        <div className="stitch-card flow-col-7">
          <div>
            <div className="card-header-row">
              <div>
                <span className="card-title-label">Histórico de Flujo de Fondos (6 Meses)</span>
                <p className="hero-subtitle">Comparativa consolidada de Entradas (Inflows) vs. Salidas (Outflows)</p>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-tertiary, #56e5a9)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--color-tertiary, #56e5a9)' }} /> Entradas
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-error, #ffb4ab)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--color-error, #ffb4ab)' }} /> Salidas
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: 210, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="flowInGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#56e5a9" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#56e5a9" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="flowOutGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffb4ab" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#ffb4ab" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    stroke="#56e5a9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#flowInGrad)"
                    name="Entradas"
                  />
                  <Area
                    type="monotone"
                    dataKey="outflow"
                    stroke="#ffb4ab"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#flowOutGrad)"
                    name="Salidas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(49, 53, 62, 0.3)', marginTop: 16, fontSize: 12, color: 'var(--color-outline, #a08e7a)' }}>
            <span>Flujo Neto Mensual: <strong style={{ color: 'var(--color-tertiary, #56e5a9)' }}>{netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}</strong></span>
            <button
              type="button"
              onClick={() => onNavigateTab?.('advisor')}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-primary, #ffc174)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
            >
              Auditoría Detallada <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 3: CANALES DE DESEMBOLSO & MÉTODOS DE PAGO ── */}
      <div className="dashboard-payment-methods">
        <div className="methods-header-row">
          <div>
            <h2 className="methods-title">Canales de Desembolso &amp; Métodos de Pago</h2>
            <p className="methods-subtitle">Análisis de orígenes de pago, comisiones optimizadas y recompensas generadas</p>
          </div>
          <span className="pill-growth">
            <Sparkles size={13} /> + {formatCurrency(cashbackEarned)} Cashback Acumulado
          </span>
        </div>

        <div className="methods-grid-4">
          {/* Canal 1: Wire / ACH */}
          <div className="method-card">
            <div className="method-card-top">
              <div className="method-icon-wrap" style={{ color: 'var(--color-primary, #ffc174)' }}>
                <Building2 size={16} />
              </div>
              <span className="method-share-tag">{wirePct}% del total</span>
            </div>
            <div>
              <div className="method-name">Transferencias Wire / ACH</div>
              <div className="method-amount">{formatCurrency(paymentTotals.wire)}</div>
              <span style={{ fontSize: 11, color: 'var(--color-outline, #a08e7a)' }}>{paymentTotals.wireCount} operaciones procesadas</span>
            </div>
            <div className="method-footer">
              <span>Comisiones: {formatCurrency(0)}</span>
              <span style={{ color: 'var(--color-tertiary, #56e5a9)', fontWeight: 600 }}>Sin costo</span>
            </div>
          </div>

          {/* Canal 2: Tarjeta Débito Black */}
          <div className="method-card">
            <div className="method-card-top">
              <div className="method-icon-wrap" style={{ color: 'var(--color-secondary, #c3c0ff)' }}>
                <CardIcon size={16} />
              </div>
              <span className="method-share-tag">{debitPct}% del total</span>
            </div>
            <div>
              <div className="method-name">Tarjeta Débito Black</div>
              <div className="method-amount">{formatCurrency(paymentTotals.debit)}</div>
              <span style={{ fontSize: 11, color: 'var(--color-outline, #a08e7a)' }}>{paymentTotals.debitCount} compras cotidianas</span>
            </div>
            <div className="method-footer">
              <span>Protección FX: 0%</span>
              <span style={{ color: 'var(--color-on-surface-variant, #d8c3ad)' }}>Interbancario</span>
            </div>
          </div>

          {/* Canal 3: Tarjeta Crédito Infinita */}
          <div className="method-card">
            <div className="method-card-top">
              <div className="method-icon-wrap" style={{ color: 'var(--color-tertiary, #56e5a9)' }}>
                <Zap size={16} />
              </div>
              <span className="method-share-tag">{creditPct}% del total</span>
            </div>
            <div>
              <div className="method-name">Tarjeta Crédito Infinita</div>
              <div className="method-amount">{formatCurrency(paymentTotals.credit)}</div>
              <span style={{ fontSize: 11, color: 'var(--color-outline, #a08e7a)' }}>{paymentTotals.creditCount} cargos facturados</span>
            </div>
            <div className="method-footer">
              <span>Puntos AUREUS:</span>
              <span style={{ color: 'var(--color-tertiary, #56e5a9)', fontWeight: 700 }}>+{pointsEarned.toLocaleString('es-DO')} pts</span>
            </div>
          </div>

          {/* Canal 4: Retiros ATM / Efectivo */}
          <div className="method-card">
            <div className="method-card-top">
              <div className="method-icon-wrap" style={{ color: 'var(--color-outline, #a08e7a)' }}>
                <Banknote size={16} />
              </div>
              <span className="method-share-tag">{cashPct}% del total</span>
            </div>
            <div>
              <div className="method-name">Retiros ATM / Efectivo</div>
              <div className="method-amount">{formatCurrency(paymentTotals.cash)}</div>
              <span style={{ fontSize: 11, color: 'var(--color-outline, #a08e7a)' }}>{paymentTotals.cashCount} movimientos en efectivo</span>
            </div>
            <div className="method-footer">
              <span>Límite mensual:</span>
              <span style={{ color: 'var(--color-on-surface-variant, #d8c3ad)', fontWeight: 600 }}>{formatCurrency(25000)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 4: ACCESOS RÁPIDOS A MODALES Y HERRAMIENTAS ── */}
      <div className="dashboard-tools-grid">
        {/* Tool 1: Calculadora FIRE */}
        <button
          type="button"
          className="tool-shortcut-card"
          onClick={() => {
            triggerHaptic('light')
            onOpenFireCalculator ? onOpenFireCalculator() : onNavigateTab?.('budgets')
          }}
        >
          <div className="tool-icon-box" style={{ color: 'var(--color-primary-container, #f59e0b)' }}>
            <Flame size={20} />
          </div>
          <div className="tool-info">
            <div className="tool-name-row">
              <span className="tool-name">Calculadora FIRE</span>
              <span className="tool-badge">Simulador</span>
            </div>
            <span className="tool-desc">Progreso a la independencia financiera</span>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--color-outline, #a08e7a)', marginLeft: 'auto' }} />
        </button>

        {/* Tool 3: Seguridad & 2FA */}
        <button
          type="button"
          className="tool-shortcut-card"
          onClick={() => {
            triggerHaptic('light')
            onOpenSecurity ? onOpenSecurity() : onNavigateTab?.('advisor')
          }}
        >
          <div className="tool-icon-box" style={{ color: 'var(--color-tertiary, #56e5a9)' }}>
            <ShieldCheck size={20} />
          </div>
          <div className="tool-info">
            <div className="tool-name-row">
              <span className="tool-name">Seguridad &amp; 2FA</span>
              <span className="tool-badge">Blindaje Activo</span>
            </div>
            <span className="tool-desc">YubiKey + Confirmación Biométrica</span>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--color-outline, #a08e7a)', marginLeft: 'auto' }} />
        </button>
          </div>
        </>
      )}
    </div>
  )
}
