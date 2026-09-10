import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  TrendingUp,
  CreditCard as CardIcon,
  Calendar,
  Sparkles,
  Activity,
  CreditCard,
  Banknote,
  Building2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Shield,
  X,
  Plus,
  Download,
  FileText,
} from 'lucide-react'
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area,
  BarChart, Bar
} from 'recharts'
import type { Income, Expense, CreditCard as CreditCardType, CreditCardTransaction, CashWithdrawal, CategoryBudget } from '../../types/finance'
import type { TabType } from '../../types/navigation'
import { formatCurrency } from '../../utils/formatters'
import { getPreviousPeriod, getMonthProgress, MONTH_SHORT_NAMES, calculateCumulativeBalance, formatPeriodLabel } from '../../utils/calendar'
import { getConsolidatedCreditSummary } from '../../utils/creditAdvisor'
import { downloadAiRegulationDocument } from '../../utils/aiRegulationDocument'
import { AnimatedCurrency } from '../ui/AnimatedCurrency'
import { triggerHaptic } from '../../utils/haptics'

interface DashboardViewProps {
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
  cashWithdrawals?: CashWithdrawal[]
  creditCards?: CreditCardType[]
  creditTransactions?: CreditCardTransaction[]
  categoryBudgets?: CategoryBudget[]
  userEmail?: string | null
  onNavigateTab?: (t: TabType) => void
  onOpenTerms?: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  housing: 'Vivienda', food: 'Alimentación', transport: 'Transporte',
  utilities: 'Servicios', health: 'Salud', entertainment: 'Ocio',
  education: 'Educación', debt: 'Deudas', other: 'Otros',
}

const CATEGORY_COLORS: Record<string, string> = {
  housing: '#60A5FA', food: '#34D399', transport: '#FBBF24',
  utilities: '#A78BFA', health: '#F87171', entertainment: '#EC4899',
  education: '#22D3EE', debt: '#F97316', other: '#9CA3AF',
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
  onNavigateTab,
  onOpenTerms,
}: DashboardViewProps) {
  const userName = userEmail ? userEmail.split('@')[0] : 'Inversor'
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1)

  // Modal de cumplimiento de IA
  const [showComplianceModal, setShowComplianceModal] = useState(false)

  // Cierre de modal con Escape
  useEffect(() => {
    if (!showComplianceModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowComplianceModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showComplianceModal])

  // 1. Datos de TODOS los módulos estrictamente del período actual
  const cumulative = calculateCumulativeBalance(incomes, expenses, currentPeriod)
  const pInc = incomes.filter(i => (i.period && i.period.trim().length === 7 ? i.period.trim() : i.date?.slice(0, 7)) === currentPeriod)
  const pExp = expenses.filter(e => (e.period && e.period.trim().length === 7 ? e.period.trim() : e.date?.slice(0, 7)) === currentPeriod)
  const pCash = cashWithdrawals.filter(c => (c.period && c.period.trim().length === 7 ? c.period.trim() : c.date?.slice(0, 7)) === currentPeriod)
  const pCardTxs = creditTransactions.filter(t => (t.period && t.period.trim().length === 7 ? t.period.trim() : t.date?.slice(0, 7)) === currentPeriod)

  const totalIn = pInc.reduce((s, i) => s + i.amount, 0)
  const totalExp = pExp.reduce((s, e) => s + e.amount, 0)
  const balance = totalIn - totalExp
  const savingRate = totalIn > 0 ? ((totalIn - totalExp) / totalIn) * 100 : 0
  const fixedExp = pExp.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const varExp = pExp.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)

  // 2. Comparativa contra período anterior
  const prevPeriod = getPreviousPeriod(currentPeriod)
  const prevInc = incomes.filter(i => (i.period && i.period.trim().length === 7 ? i.period.trim() : i.date?.slice(0, 7)) === prevPeriod).reduce((s, i) => s + i.amount, 0)
  const prevExp = expenses.filter(e => (e.period && e.period.trim().length === 7 ? e.period.trim() : e.date?.slice(0, 7)) === prevPeriod).reduce((s, e) => s + e.amount, 0)

  const incDiff = prevInc > 0 ? ((totalIn - prevInc) / prevInc) * 100 : 0
  const expDiff = prevExp > 0 ? ((totalExp - prevExp) / prevExp) * 100 : 0
  const balDiff = prevInc - prevExp !== 0 ? ((balance - (prevInc - prevExp)) / Math.abs(prevInc - prevExp)) * 100 : 0

  // 3. Resumen de Deuda y Tarjetas
  const creditSummary = getConsolidatedCreditSummary(creditCards, creditTransactions)
  const monthProgress = getMonthProgress(currentPeriod)

  // 4. Últimos Movimientos Consolidados de TODOS los Módulos
  const recentTx = [
    ...pInc.map(i => ({
      id: i.id,
      date: i.date,
      description: i.description,
      amount: i.amount,
      kind: 'income' as const,
      tag: 'INGRESO',
      typePillClass: 'in',
      pillLabel: '+ INFLOW',
      targetTab: 'incomes' as TabType,
    })),
    ...pExp.map(e => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      kind: 'expense' as const,
      tag: 'GASTO',
      typePillClass: 'out',
      pillLabel: '- OUTFLOW',
      targetTab: 'expenses' as TabType,
    })),
    ...pCardTxs.map(t => ({
      id: t.id,
      date: t.date,
      description: `[Tarjeta] ${t.description}`,
      amount: t.amount,
      kind: 'expense' as const,
      tag: 'TARJETA',
      typePillClass: 'card',
      pillLabel: '💳 TARJETA',
      targetTab: 'credit' as TabType,
    })),
    ...pCash.map(c => ({
      id: c.id,
      date: c.date,
      description: `[Efectivo] ${c.note || 'Retiro en efectivo'}`,
      amount: c.amount,
      kind: 'expense' as const,
      tag: 'EFECTIVO',
      typePillClass: 'cash',
      pillLabel: '💵 EFECTIVO',
      targetTab: 'cash' as TabType,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)

  // 5. Pie chart data
  const categoryTotals: Record<string, number> = {}
  pExp.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount })
  const pieData = Object.entries(categoryTotals).map(([cat, val]) => ({
    name: CATEGORY_LABELS[cat] ?? cat,
    value: val,
    color: CATEGORY_COLORS[cat] ?? '#C9A84C',
  }))

  // 6. Línea de tiempo histórica de 5 meses para gráficos Sandbox
  const last5Periods: string[] = []
  let cursor = currentPeriod
  for (let i = 0; i < 5; i++) {
    last5Periods.unshift(cursor)
    cursor = getPreviousPeriod(cursor)
  }

  const waveData = last5Periods.map(p => {
    const [, monthStr] = p.split('-')
    const mIdx = (parseInt(monthStr, 10) || 1) - 1
    const pIncomes = incomes.filter(i => (i.period && i.period.trim().length === 7 ? i.period.trim() : i.date?.slice(0, 7)) === p)
    const pExpenses = expenses.filter(e => (e.period && e.period.trim().length === 7 ? e.period.trim() : e.date?.slice(0, 7)) === p)
    const totI = pIncomes.reduce((s, i) => s + i.amount, 0)
    const totE = pExpenses.reduce((s, e) => s + e.amount, 0)
    const cum = calculateCumulativeBalance(incomes, expenses, p)
    return {
      label: MONTH_SHORT_NAMES[mIdx] || p,
      period: p,
      inflows: Math.round(totI),
      outflows: Math.round(totE),
      netWorth: Math.round(cum.totalCumulativeBalance),
    }
  })

  // 7. Liquidez No Comprometida (Unencumbered Liquidity - Fintech Intelligence)
  const unencumberedLiquidity = Math.max(0, cumulative.totalCumulativeBalance - creditSummary.totalDebt)
  const liquidityRatio = cumulative.totalCumulativeBalance > 0
    ? (unencumberedLiquidity / cumulative.totalCumulativeBalance) * 100
    : 0
  const debtCoverage = creditSummary.totalDebt > 0
    ? (cumulative.totalCumulativeBalance / creditSummary.totalDebt).toFixed(1)
    : 'Sin deuda'

  const liquidityTrendData = last5Periods.map(p => {
    const [, monthStr] = p.split('-')
    const mIdx = (parseInt(monthStr, 10) || 1) - 1
    const cum = calculateCumulativeBalance(incomes, expenses, p)
    const tot = Math.round(cum.totalCumulativeBalance)
    const free = Math.round(Math.max(0, cum.totalCumulativeBalance - creditSummary.totalDebt))
    const debt = Math.round(Math.min(tot, creditSummary.totalDebt))
    return {
      label: MONTH_SHORT_NAMES[mIdx] || p,
      liquidez: free,
      totalCapital: tot,
      deuda: debt,
    }
  })

  // 8. Métodos de Pago del Período (Consolidando Gastos, Tarjetas y Efectivo)
  const paymentTotals = {
    debit_card: 0,
    credit_card: 0,
    bank_transfer: 0,
    cash: 0,
  }
  pExp.forEach(e => {
    if (paymentTotals[e.paymentMethod] !== undefined) {
      paymentTotals[e.paymentMethod] += e.amount
    }
  })
  // Reflejar consumos del módulo de tarjetas
  const cardTxsSum = pCardTxs.reduce((s, t) => s + t.amount, 0)
  if (cardTxsSum > paymentTotals.credit_card) {
    paymentTotals.credit_card = cardTxsSum
  }
  // Reflejar retiros del módulo de efectivo
  const cashWithdrawalsSum = pCash.reduce((s, c) => s + c.amount, 0)
  if (cashWithdrawalsSum > paymentTotals.cash) {
    paymentTotals.cash = cashWithdrawalsSum
  }

  const paymentMethodsList = [
    { name: 'Transferencia', amount: paymentTotals.bank_transfer, icon: <Building2 size={13} />, color: '#34D399' },
    { name: 'Débito', amount: paymentTotals.debit_card, icon: <CreditCard size={13} />, color: '#60A5FA' },
    { name: 'Crédito', amount: paymentTotals.credit_card, icon: <CardIcon size={13} />, color: '#F3CA65' },
    { name: 'Efectivo', amount: paymentTotals.cash, icon: <Banknote size={13} />, color: '#FBBF24' },
  ]

  // Estado de selector de vista de gráficos
  const [chartView, setChartView] = useState<'flow' | 'networth'>('flow')
  const [unencumberedView, setUnencumberedView] = useState<'trend' | 'breakdown'>('trend')

  return (
    <div className="fade-in sandbox-dashboard">
      {/* ── UNIFIED MERCURY-STYLE COMMAND CENTER ── */}
      <div className="sandbox-command-center">
        <div className="command-left">
          <div className="command-branding">
            <div className="command-subhead">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F3CA65', display: 'inline-block' }} />
              AUREUS WEALTH · {formatPeriodLabel(currentPeriod).toUpperCase()}
            </div>
            <h1 className="command-title">Portfolio Overview</h1>
          </div>

          <div className="command-sync-pills">
            <button
              type="button"
              className="sync-module-pill"
              onClick={() => {
                triggerHaptic('light')
                onNavigateTab && onNavigateTab('incomes')
              }}
              title="Ver Ingresos"
            >
              <span>Ingresos</span>
              <strong>{pInc.length}</strong>
            </button>
            <button
              type="button"
              className="sync-module-pill"
              onClick={() => {
                triggerHaptic('light')
                onNavigateTab && onNavigateTab('expenses')
              }}
              title="Ver Gastos"
            >
              <span>Gastos</span>
              <strong>{pExp.length}</strong>
            </button>
            <button
              type="button"
              className="sync-module-pill"
              onClick={() => {
                triggerHaptic('light')
                onNavigateTab && onNavigateTab('credit')
              }}
              title="Ver Tarjetas"
            >
              <span>Tarjetas</span>
              <strong>{pCardTxs.length}</strong>
            </button>
            <button
              type="button"
              className="sync-module-pill"
              onClick={() => {
                triggerHaptic('light')
                onNavigateTab && onNavigateTab('cash')
              }}
              title="Ver Efectivo"
            >
              <span>Efectivo</span>
              <strong>{pCash.length}</strong>
            </button>
            <button
              type="button"
              className="sync-module-pill"
              onClick={() => {
                triggerHaptic('light')
                onNavigateTab && onNavigateTab('budgets')
              }}
              title="Ver Presupuestos"
            >
              <span>Presupuestos</span>
              <strong>{categoryBudgets.length}</strong>
            </button>
            <button
              type="button"
              className="sync-module-pill"
              onClick={() => {
                triggerHaptic('light')
                onNavigateTab && onNavigateTab('chat-advisor')
              }}
              title="Ir a Asesor IA"
            >
              <span>Asesor IA</span>
              <strong style={{ color: '#34D399' }}>Activo</strong>
            </button>
          </div>
        </div>

        <div className="command-right">
          <button
            type="button"
            className="ai-compliance-link"
            onClick={() => setShowComplianceModal(true)}
            title="Normativas de Inteligencia Artificial & Transparencia"
          >
            <Shield size={13} />
            <span>Normativa IA</span>
          </button>
          <button
            type="button"
            className="sandbox-btn-outline"
            onClick={() => onNavigateTab && onNavigateTab('chat-advisor')}
          >
            <Sparkles size={14} className="text-gold" />
            <span>Asesor IA</span>
          </button>
          <button
            type="button"
            className="sandbox-btn-gold"
            onClick={() => onNavigateTab && onNavigateTab('expenses')}
          >
            <Plus size={14} />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      {/* ── 5-METRIC INSTITUTIONAL KPI STRIP (SANDBOX IMAGE 4) ── */}
      <div className="sandbox-kpi-row">
        <div className="sandbox-kpi-card gold-glow">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Patrimonio Neto</span>
            <span className={`sandbox-kpi-pill ${balDiff >= 0 ? 'pos' : 'neg'}`}>
              {balDiff >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {Math.abs(balDiff).toFixed(1)}%
            </span>
          </div>
          <div className="sandbox-kpi-value">
            <AnimatedCurrency value={cumulative.totalCumulativeBalance} />
          </div>
          <div className="sandbox-kpi-sub">
            {cumulative.carriedOverBalance !== 0
              ? `Arrastre: ${formatCurrency(cumulative.carriedOverBalance)}`
              : 'Balance acumulado auditado'}
          </div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Activos / Liquidez</span>
            <span className="sandbox-kpi-pill pos">
              <ArrowUpRight size={11} />
              {incDiff >= 0 ? `+${incDiff.toFixed(1)}%` : `${incDiff.toFixed(1)}%`}
            </span>
          </div>
          <div className="sandbox-kpi-value text-emerald">
            <AnimatedCurrency value={totalIn} />
          </div>
          <div className="sandbox-kpi-sub">{pInc.length} entradas en {MONTH_SHORT_NAMES[(parseInt(currentPeriod.split('-')[1], 10) || 1) - 1]}</div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Pasivos / Tarjetas</span>
            <span className={`sandbox-kpi-pill ${creditSummary.utilizationRate > 30 ? 'neg' : 'neutral'}`}>
              {creditSummary.utilizationRate.toFixed(0)}% cupo
            </span>
          </div>
          <div className="sandbox-kpi-value text-gold">
            <AnimatedCurrency value={creditSummary.totalDebt} />
          </div>
          <div className="sandbox-kpi-sub">{creditCards.length} tarjetas asociadas</div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Inflows (Entradas)</span>
            <span className="sandbox-kpi-pill pos">
              <TrendingUp size={11} />
              100%
            </span>
          </div>
          <div className="sandbox-kpi-value text-emerald">
            <AnimatedCurrency value={totalIn} />
          </div>
          <div className="sandbox-kpi-sub">Fijos: {formatCurrency(pInc.filter(i => i.type === 'salary').reduce((s, i) => s + i.amount, 0))}</div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Outflows (Salidas)</span>
            <span className={`sandbox-kpi-pill ${expDiff <= 0 ? 'pos' : 'neg'}`}>
              {expDiff >= 0 ? `+${expDiff.toFixed(1)}%` : `${expDiff.toFixed(1)}%`}
            </span>
          </div>
          <div className="sandbox-kpi-value text-rose">
            <AnimatedCurrency value={totalExp} />
          </div>
          <div className="sandbox-kpi-sub">Fijos: {formatCurrency(fixedExp)} · Var: {formatCurrency(varExp)}</div>
        </div>
      </div>

      {/* ── DUAL HERO SHOWCASE CARDS (SANDBOX IMAGE 4 HERO) ── */}
      <div className="sandbox-dual-hero">
        <div className="sandbox-hero-card">
          <div className="sandbox-hero-content">
            <div className="sandbox-badge-gold">AUREUS GLOBAL · WEALTH CLIENT</div>
            <h2 className="sandbox-hero-title">Gestión de Liquidez Institucional</h2>
            <p className="sandbox-hero-desc">
              Control integral multi-cuenta, tarjetas activas y supervisión de fondos con tasa de ahorro del {savingRate.toFixed(1)}%.
            </p>
            <div className="sandbox-hero-meta">
              <span className="sandbox-meta-item">
                <ShieldCheck size={14} className="text-emerald" /> Cuenta Protegida RLS
              </span>
              <span className="sandbox-meta-item">
                <Calendar size={14} className="text-gold" /> Día {monthProgress.currentDay} de {monthProgress.totalDays} ({monthProgress.percentPassed}%)
              </span>
            </div>
          </div>
          <div className="sandbox-card-mockup">
            <div className="sandbox-metal-card">
              <div className="metal-chip" />
              <div className="metal-brand">AUREUS</div>
              <div className="metal-digits">•••• •••• •••• 4821</div>
              <div className="metal-footer">
                <span>{capitalizedName}</span>
                <span className="metal-gold-badge">SIGNATURE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sandbox-hero-card strategy">
          <div className="sandbox-hero-content">
            <div className="sandbox-badge-sand">ESTRATEGIA PATRIMONIAL</div>
            <h2 className="sandbox-hero-title">Rendimiento & Optimización</h2>
            <div className="sandbox-strategy-metrics">
              <div className="strategy-metric-item">
                <div className="strat-label">Tasa de Ahorro</div>
                <div className="strat-val">{savingRate.toFixed(1)}%</div>
                <div className="strat-bar">
                  <div className="strat-fill" style={{ width: `${Math.min(100, Math.max(0, savingRate))}%` }} />
                </div>
              </div>
              <div className="strategy-metric-item">
                <div className="strat-label">Compromiso Fijo</div>
                <div className="strat-val">
                  {totalIn > 0 ? ((fixedExp / totalIn) * 100).toFixed(1) : 0}%
                </div>
                <div className="strat-bar">
                  <div className="strat-fill gold" style={{ width: `${Math.min(100, totalIn > 0 ? (fixedExp / totalIn) * 100 : 0)}%` }} />
                </div>
              </div>
            </div>
            <p className="sandbox-strategy-tip">
              💡 {savingRate >= 20 ? 'Excelente capacidad de ahorro institucional.' : 'Se recomienda optimizar gastos variables para mantener tasa > 20%.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── MATRIX GRÁFICOS SANDBOX (IMAGE 4) ── */}
      <div className="sandbox-grid-2">
        {/* Gráfico 1: Assets : Liabilities Wave Stream */}
        <div className="sandbox-panel">
          <div className="sandbox-panel-header">
            <div>
              <div className="sandbox-panel-title">Inflows vs Outflows (Evolución)</div>
              <div className="sandbox-panel-sub">Flujo de capital histórico consolidado</div>
            </div>
            <div className="sandbox-pills">
              <button
                type="button"
                className={`sandbox-pill-btn ${chartView === 'flow' ? 'active' : ''}`}
                onClick={() => setChartView('flow')}
              >
                Inflows/Outflows
              </button>
              <button
                type="button"
                className={`sandbox-pill-btn ${chartView === 'networth' ? 'active' : ''}`}
                onClick={() => setChartView('networth')}
              >
                Patrimonio
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'flow' ? (
                <AreaChart data={waveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E09F67" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E09F67" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#555" fontSize={11} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#121217', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(val) => [formatCurrency(Number(val) || 0), '']}
                  />
                  <Area type="monotone" dataKey="inflows" stroke="#34D399" strokeWidth={2.5} fillOpacity={1} fill="url(#inflowGrad)" name="Inflows (Entradas)" />
                  <Area type="monotone" dataKey="outflows" stroke="#E09F67" strokeWidth={2} fillOpacity={1} fill="url(#outflowGrad)" name="Outflows (Salidas)" />
                </AreaChart>
              ) : (
                <AreaChart data={waveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="patrimonioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#555" fontSize={11} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#121217', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(val) => [formatCurrency(Number(val) || 0), '']}
                  />
                  <Area type="monotone" dataKey="netWorth" stroke="#C9A84C" strokeWidth={3} fillOpacity={1} fill="url(#patrimonioGrad)" name="Patrimonio Acumulado" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Asset / Expense Allocation (Donut Sandbox Style) */}
        <div className="sandbox-panel">
          <div className="sandbox-panel-header">
            <div>
              <div className="sandbox-panel-title">Asset & Expense Allocation</div>
              <div className="sandbox-panel-sub">Distribución categórica en {formatPeriodLabel(currentPeriod)}</div>
            </div>
          </div>

          {pieData.length === 0 ? (
            <div className="sandbox-empty">Sin egresos registrados para categorizar en este período</div>
          ) : (
            <div className="sandbox-allocation-body">
              <div style={{ width: '50%', height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={4}>
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color} stroke="#14141B" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#121217', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                      formatter={(val) => [formatCurrency(Number(val) || 0), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="sandbox-allocation-legend">
                {pieData.map((d, i) => (
                  <div key={i} className="sandbox-legend-row">
                    <span className="legend-dot" style={{ background: d.color }} />
                    <span className="legend-name">{d.name}</span>
                    <span className="legend-val">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CANALES DE PAGO & LIQUIDEZ STRIP ── */}
      <div className="sandbox-panel payment-channels">
        <div className="sandbox-panel-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={15} className="text-gold" style={{ flexShrink: 0 }} />
          <span>Canales de Liquidez & Métodos de Pago ({formatPeriodLabel(currentPeriod)})</span>
        </div>
        <div className="sandbox-payment-grid">
          {paymentMethodsList.map((pm, i) => {
            const pct = totalExp > 0 ? (pm.amount / totalExp) * 100 : 0
            return (
              <div key={i} className="sandbox-payment-card">
                <div className="pay-card-top">
                  <span className="pay-card-name" style={{ color: pm.color }}>
                    {pm.icon} {pm.name}
                  </span>
                  <span className="pay-card-pct">{pct.toFixed(0)}%</span>
                </div>
                <div className="pay-card-amount">{formatCurrency(pm.amount)}</div>
                <div className="pay-progress-bg">
                  <div className="pay-progress-fill" style={{ width: `${pct}%`, background: pm.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── BOTTOM GRID: TRANSACTIONS + UNENCUMBERED LIQUIDITY (SANDBOX IMAGE 4) ── */}
      <div className="sandbox-bottom-grid">
        {/* Columna Izquierda: Tabla de Transacciones */}
        <div className="sandbox-panel transactions-table-panel">
          <div className="sandbox-panel-header">
            <div>
              <div className="sandbox-panel-title">Transactions · {formatPeriodLabel(currentPeriod)}</div>
              <div className="sandbox-panel-sub">Movimientos certificados de capital en el período seleccionado</div>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                className="sandbox-btn-outline"
                onClick={() => onNavigateTab('expenses')}
                title="Ver todos los movimientos"
                style={{ flexShrink: 0 }}
              >
                <span>Ver todos</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {recentTx.length === 0 ? (
            <div className="sandbox-empty">
              No hay movimientos registrados en {formatPeriodLabel(currentPeriod)}.
            </div>
          ) : (
            <div className="sandbox-table-wrapper">
              <table className="sandbox-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>ITEM / CONCEPTO</th>
                    <th>TIPO</th>
                    <th>TOTAL</th>
                    <th style={{ textAlign: 'right' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx, idx) => {
                    const isInc = tx.kind === 'income'
                    return (
                      <tr key={idx}>
                        <td className="cell-date">{tx.date}</td>
                        <td className="cell-item">
                          <div className="item-title">{tx.description}</div>
                        </td>
                        <td>
                          <span className={`sandbox-type-pill ${tx.typePillClass}`}>
                            {tx.pillLabel}
                          </span>
                        </td>
                        <td className={`cell-total ${isInc ? 'text-emerald' : 'text-rose'}`}>
                          {isInc ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="table-action-chevron"
                            onClick={() => onNavigateTab && onNavigateTab(tx.targetTab)}
                            title={`Ir a ${tx.tag}`}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Columna Derecha: Unencumbered Liquidity (Fintech Command Hub) */}
        <div className="unencumbered-panel">
          <div className="sandbox-panel-header" style={{ marginBottom: 2 }}>
            <div>
              <div className="sandbox-panel-title">Unencumbered Liquidity</div>
              <div className="sandbox-panel-sub">Capital libre neto sin compromisos de deuda</div>
            </div>
            <div className="sandbox-pills">
              <button
                type="button"
                className={`sandbox-pill-btn ${unencumberedView === 'trend' ? 'active' : ''}`}
                onClick={() => setUnencumberedView('trend')}
              >
                Evolución
              </button>
              <button
                type="button"
                className={`sandbox-pill-btn ${unencumberedView === 'breakdown' ? 'active' : ''}`}
                onClick={() => setUnencumberedView('breakdown')}
              >
                Solvencia
              </button>
            </div>
          </div>

          <div className="unencumbered-stat-row">
            <div className="unencumbered-val">
              <AnimatedCurrency value={unencumberedLiquidity} />
            </div>
            <span className={`sandbox-kpi-pill ${liquidityRatio >= 60 ? 'pos' : 'neutral'}`}>
              {liquidityRatio.toFixed(0)}% libre
            </span>
          </div>

          {/* Barra de Distribución Proporcional (Ramp / Mercury style) */}
          <div className="unencumbered-allocation-block">
            <div className="unencumbered-ratio-bar">
              <div
                className="unencumbered-bar-fill free"
                style={{ width: `${Math.min(100, Math.max(0, liquidityRatio))}%` }}
                title={`Capital Libre: ${formatCurrency(unencumberedLiquidity)} (${liquidityRatio.toFixed(1)}%)`}
              />
              <div
                className="unencumbered-bar-fill debt"
                style={{ width: `${Math.min(100, Math.max(0, 100 - liquidityRatio))}%` }}
                title={`Pasivos Tarjetas: ${formatCurrency(creditSummary.totalDebt)} (${(100 - liquidityRatio).toFixed(1)}%)`}
              />
            </div>
            <div className="unencumbered-ratio-legend">
              <div className="ratio-legend-item">
                <span className="ratio-dot free" />
                <span className="ratio-name">Libre disponible</span>
                <strong className="ratio-amount">{formatCurrency(unencumberedLiquidity)}</strong>
              </div>
              <div className="ratio-legend-item">
                <span className="ratio-dot debt" />
                <span className="ratio-name">Pasivos tarjetas</span>
                <strong className="ratio-amount">{formatCurrency(creditSummary.totalDebt)}</strong>
              </div>
            </div>
          </div>

          {/* Fichas de Indicadores Clave */}
          <div className="unencumbered-metrics-row">
            <div className="unencumbered-metric-chip">
              <span className="chip-label">Patrimonio Total</span>
              <span className="chip-val">{formatCurrency(cumulative.totalCumulativeBalance)}</span>
            </div>
            <div className="unencumbered-metric-chip">
              <span className="chip-label">Cobertura Deuda</span>
              <span className="chip-val text-emerald">
                {debtCoverage === 'Sin deuda' ? '100% Solvente' : `${debtCoverage}x`}
              </span>
            </div>
            <div className="unencumbered-metric-chip">
              <span className="chip-label">Estado</span>
              <span className="chip-val text-gold">
                {liquidityRatio >= 70 ? 'Óptimo' : liquidityRatio >= 40 ? 'Estable' : 'Ajustado'}
              </span>
            </div>
          </div>

          {/* Gráfico Dinámico que llena el espacio restante */}
          <div className="unencumbered-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              {unencumberedView === 'trend' ? (
                <AreaChart data={liquidityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="unencumberedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F3CA65" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#F3CA65" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="totalCapGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#555" fontSize={11} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#121217', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(val, name) => [
                      formatCurrency(Number(val) || 0),
                      name === 'liquidez' ? 'Liquidez Libre' : 'Patrimonio Total'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalCapital"
                    stroke="rgba(255,255,255,0.25)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#totalCapGrad)"
                    name="totalCapital"
                  />
                  <Area
                    type="monotone"
                    dataKey="liquidez"
                    stroke="#F3CA65"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#unencumberedGrad)"
                    name="liquidez"
                  />
                </AreaChart>
              ) : (
                <BarChart data={liquidityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#555" fontSize={11} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#121217', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(val, name) => [
                      formatCurrency(Number(val) || 0),
                      name === 'liquidez' ? 'Capital Libre' : 'Pasivos Tarjeta'
                    ]}
                  />
                  <Bar dataKey="liquidez" fill="#34D399" radius={[4, 4, 0, 0]} name="liquidez" />
                  <Bar dataKey="deuda" fill="#FB7185" radius={[4, 4, 0, 0]} name="deuda" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── MODAL DE CUMPLIMIENTO Y NORMATIVAS GLOBALES DE IA (PORTAL VIEWPORT) ── */}
      {showComplianceModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowComplianceModal(false)}>
          <div className="modal-card" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Shield size={20} className="text-gold" />
                <span>Normativas de Inteligencia Artificial & Transparencia</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowComplianceModal(false)}
                aria-label="Cerrar modal"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12.5, color: '#D0D0DC', lineHeight: 1.6 }}>
              <div style={{ background: 'rgba(201, 168, 76, 0.08)', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: 10, padding: 14 }}>
                <strong style={{ color: '#F3CA65', display: 'block', marginBottom: 4 }}>
                  Marco Regulatorio Internacional (EU AI Act & Global Digital Standards)
                </strong>
                <p style={{ margin: 0, fontSize: 12, color: '#D1D5DB' }}>
                  El Asesor IA de AUREUS opera bajo los principios del Reglamento Europeo de Inteligencia Artificial (Reglamento UE 2024/1689), clasificado como sistema de propósito específico de <strong>riesgo limitado</strong> con obligaciones de transparencia algorítmica estricta.
                </p>
              </div>

              <div>
                <strong style={{ color: '#FFFFFF' }}>1. Privacidad y Soberanía de Datos</strong>
                <p style={{ margin: '4px 0 0', color: '#9CA3AF' }}>
                  Tus transacciones y estados financieros se procesan mediante Row Level Security (RLS) en memoria. La información nunca se utiliza para entrenar modelos LLM públicos ni se comparte con redes publicitarias de terceros.
                </p>
              </div>

              <div>
                <strong style={{ color: '#FFFFFF' }}>2. Exención de Asesoría Financiera Automatizada (Disclaimer)</strong>
                <p style={{ margin: '4px 0 0', color: '#9CA3AF' }}>
                  Los diagnósticos, presupuestos sugeridos y simulaciones matemáticas son herramientas educativas y de orientación presupuestaria personal. No constituyen asesoramiento de inversión regulada, intermediación de valores ni captación financiera.
                </p>
              </div>

              <div>
                <strong style={{ color: '#FFFFFF' }}>3. Supervisión Humana y Control Absoluto</strong>
                <p style={{ margin: '4px 0 0', color: '#9CA3AF' }}>
                  El Asesor IA jamás ejecuta pagos, transferencias o cargos automáticos en tus tarjetas. Cada decisión de registro, abono o eliminación permanece 100% bajo el control soberano del usuario.
                </p>
              </div>
            </div>

            {/* ── BOTONES DE ACCIÓN: DESCARGA DE NORMATIVA & TÉRMINOS Y CONDICIONES ── */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                className="sandbox-btn-outline"
                style={{ flex: 1, minWidth: 220, justifyContent: 'center' }}
                onClick={downloadAiRegulationDocument}
              >
                <Download size={14} />
                <span>Bajar Normativa Global IA (.txt)</span>
              </button>

              {onOpenTerms && (
                <button
                  type="button"
                  className="sandbox-btn-outline"
                  style={{ flex: 1, minWidth: 220, justifyContent: 'center', borderColor: 'rgba(201, 168, 76, 0.3)', color: '#F1D97E' }}
                  onClick={() => {
                    setShowComplianceModal(false)
                    onOpenTerms()
                  }}
                >
                  <FileText size={14} />
                  <span>Ver Términos y Condiciones</span>
                </button>
              )}
            </div>

            <div className="modal-footer" style={{ marginTop: 14, borderTop: 'none', paddingTop: 0 }}>
              <button
                type="button"
                className="sandbox-btn-gold"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setShowComplianceModal(false)}
              >
                Entendido y Aceptado
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
