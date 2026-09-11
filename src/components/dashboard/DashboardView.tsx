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
  DollarSign,
  Layers,
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
      pillLabel: '+ INGRESO',
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
      pillLabel: '- GASTO',
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
    .slice(0, 7)

  // 5. Pie chart data
  const categoryTotals: Record<string, number> = {}
  pExp.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount })
  const pieData = Object.entries(categoryTotals).map(([cat, val]) => ({
    name: CATEGORY_LABELS[cat] ?? cat,
    value: val,
    color: CATEGORY_COLORS[cat] ?? '#C9A84C',
  }))

  // Top Fuentes de Ingreso (Mercury Money In)
  const topSourcesIn = [...pInc]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  // Top Gastos por Categoría (Mercury Money Out)
  const topSpendOut = Object.entries(categoryTotals)
    .map(([cat, val]) => ({
      category: cat,
      name: CATEGORY_LABELS[cat] ?? cat,
      amount: val,
      color: CATEGORY_COLORS[cat] ?? '#C9A84C',
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

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

  // 7. Liquidez No Comprometida (Unencumbered Liquidity)
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

  // 8. Métodos de Pago del Período
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
  const cardTxsSum = pCardTxs.reduce((s, t) => s + t.amount, 0)
  if (cardTxsSum > paymentTotals.credit_card) {
    paymentTotals.credit_card = cardTxsSum
  }
  const cashWithdrawalsSum = pCash.reduce((s, c) => s + c.amount, 0)
  if (cashWithdrawalsSum > paymentTotals.cash) {
    paymentTotals.cash = cashWithdrawalsSum
  }

  const paymentMethodsList = [
    { name: 'Transferencia Bancaria', amount: paymentTotals.bank_transfer, icon: <Building2 size={13} />, color: '#34D399' },
    { name: 'Tarjeta Débito', amount: paymentTotals.debit_card, icon: <CreditCard size={13} />, color: '#60A5FA' },
    { name: 'Tarjeta Crédito', amount: paymentTotals.credit_card, icon: <CardIcon size={13} />, color: '#F3CA65' },
    { name: 'Efectivo', amount: paymentTotals.cash, icon: <Banknote size={13} />, color: '#FBBF24' },
  ]

  // Estado de selector de vista de gráficos
  const [chartView, setChartView] = useState<'flow' | 'networth'>('flow')
  const [unencumberedView, setUnencumberedView] = useState<'trend' | 'breakdown'>('trend')

  return (
    <div className="fade-in sandbox-dashboard">

      {/* ── 1. MERCURY-STYLE EDITORIAL HEADER & ACTION PILLS ── */}
      <div className="mercury-editorial-header">
        <div className="mercury-header-left">
          <div className="mercury-badge-tag">
            <span className="badge-dot-gold" />
            AUREUS WEALTH ADVISOR · {formatPeriodLabel(currentPeriod).toUpperCase()}
          </div>
          <h1 className="mercury-greeting">Bienvenido, {capitalizedName}</h1>
          <p className="mercury-subgreeting">
            Patrimonio neto consolidado, solvencia libre y supervisión de capital en tiempo real.
          </p>
        </div>

        <div className="mercury-header-actions">
          <button
            type="button"
            className="mercury-pill-action gold-solid"
            onClick={() => {
              triggerHaptic('light')
              onNavigateTab && onNavigateTab('expenses')
            }}
          >
            <Plus size={15} />
            <span>Registrar Movimiento</span>
          </button>
          <button
            type="button"
            className="mercury-pill-action outline"
            onClick={() => {
              triggerHaptic('light')
              onNavigateTab && onNavigateTab('incomes')
            }}
          >
            <ArrowUpRight size={14} style={{ color: '#22C55E' }} />
            <span>Ingreso</span>
          </button>
          <button
            type="button"
            className="mercury-pill-action outline"
            onClick={() => {
              triggerHaptic('light')
              onNavigateTab && onNavigateTab('credit')
            }}
          >
            <CardIcon size={14} style={{ color: '#F3CA65' }} />
            <span>Tarjetas</span>
          </button>
          <button
            type="button"
            className="mercury-pill-action outline"
            onClick={() => {
              triggerHaptic('light')
              onNavigateTab && onNavigateTab('chat-advisor')
            }}
          >
            <Sparkles size={14} className="text-gold" />
            <span>Asesor IA</span>
          </button>
          <button
            type="button"
            className="mercury-pill-action outline compliance-pill"
            onClick={() => setShowComplianceModal(true)}
            title="Normativas de Inteligencia Artificial & Transparencia"
          >
            <Shield size={13} />
            <span>Normativa IA</span>
          </button>
        </div>
      </div>

      {/* ── 2. MERCURY TOP HERO: BALANCE CARD CON CHART INTEGRADO + LISTA DE CUENTAS ── */}
      <div className="mercury-hero-layout">
        
        {/* Left: Balance Hero con Gráfico Integrado (Mercury Image 2) */}
        <div className="mercury-balance-card">
          <div className="mercury-balance-top">
            <div>
              <div className="balance-label-tag">PATRIMONIO NETO CONSOLIDADO</div>
              <div className="mercury-balance-figure">
                <span className="balance-curr">RD$</span>
                <span className="balance-val">
                  {Math.floor(Math.abs(cumulative.totalCumulativeBalance)).toLocaleString('es-DO')}
                </span>
                <span className="balance-cents">
                  .{Math.round((Math.abs(cumulative.totalCumulativeBalance) % 1) * 100).toString().padStart(2, '0')}
                </span>
                {balDiff !== 0 && (
                  <span className={`balance-badge ${balDiff >= 0 ? 'pos' : 'neg'}`}>
                    {balDiff >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(balDiff).toFixed(1)}% vs mes ant.
                  </span>
                )}
              </div>
            </div>

            <div className="chart-view-toggles">
              <button
                type="button"
                className={`chart-view-btn ${chartView === 'flow' ? 'active' : ''}`}
                onClick={() => setChartView('flow')}
              >
                Flujo Mensual
              </button>
              <button
                type="button"
                className={`chart-view-btn ${chartView === 'networth' ? 'active' : ''}`}
                onClick={() => setChartView('networth')}
              >
                Patrimonio
              </button>
            </div>
          </div>

          {/* Quick Cash Flow Pulse Strip */}
          <div className="mercury-cash-pulse">
            <div className="pulse-item">
              <span className="pulse-dot inflow" />
              <span className="pulse-label">Inflows:</span>
              <strong className="pulse-amount text-emerald">+{formatCurrency(totalIn)}</strong>
            </div>
            <div className="pulse-item">
              <span className="pulse-dot outflow" />
              <span className="pulse-label">Outflows:</span>
              <strong className="pulse-amount text-rose">-{formatCurrency(totalExp)}</strong>
            </div>
            <div className="pulse-item">
              <span className="pulse-dot net" />
              <span className="pulse-label">Neto Operativo:</span>
              <strong className={`pulse-amount ${balance >= 0 ? 'text-emerald' : 'text-rose'}`}>
                {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
              </strong>
            </div>
          </div>

          {/* Embedded Smooth Chart directly in card (Mercury style) */}
          <div className="mercury-embedded-chart">
            <ResponsiveContainer width="100%" height={160}>
              {chartView === 'flow' ? (
                <AreaChart data={waveData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heroInflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="heroOutflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#555" fontSize={11} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(val) => [formatCurrency(Number(val) || 0), '']}
                  />
                  <Area type="monotone" dataKey="inflows" stroke="#22C55E" strokeWidth={2.5} fillOpacity={1} fill="url(#heroInflowGrad)" name="Ingresos (Inflows)" />
                  <Area type="monotone" dataKey="outflows" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#heroOutflowGrad)" name="Gastos (Outflows)" />
                </AreaChart>
              ) : (
                <AreaChart data={waveData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heroPatrimonioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#555" fontSize={11} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(val) => [formatCurrency(Number(val) || 0), '']}
                  />
                  <Area type="monotone" dataKey="netWorth" stroke="#F3CA65" strokeWidth={3} fillOpacity={1} fill="url(#heroPatrimonioGrad)" name="Patrimonio Acumulado" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="mercury-balance-footer">
            <div className="footer-meta-chip">
              <ShieldCheck size={13} style={{ color: '#22C55E' }} />
              <span>Soberanía RLS Activa</span>
            </div>
            <div className="footer-meta-chip">
              <Calendar size={13} style={{ color: '#C9A84C' }} />
              <span>Día <strong>{monthProgress.currentDay}</strong> de <strong>{monthProgress.totalDays}</strong> ({monthProgress.percentPassed}%)</span>
            </div>
            {cumulative.carriedOverBalance !== 0 && (
              <div className="footer-meta-chip">
                <Activity size={13} style={{ color: '#94A3B8' }} />
                <span>Arrastre: <strong>{formatCurrency(cumulative.carriedOverBalance)}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Accounts & Positions Card (Mercury Image 2 Accounts layout) */}
        <div className="mercury-accounts-card">
          <div className="accounts-card-header">
            <div>
              <div className="accounts-title">Posiciones & Cuentas</div>
              <div className="accounts-sub">Distribución del balance activo</div>
            </div>
            <button
              type="button"
              className="accounts-action-btn"
              onClick={() => onNavigateTab && onNavigateTab('budgets')}
              title="Ver Presupuestos"
            >
              <Layers size={14} />
            </button>
          </div>

          <div className="accounts-list">
            {/* Row 1: Liquidez Libre */}
            <div
              className="account-row clickable"
              onClick={() => onNavigateTab && onNavigateTab('expenses')}
            >
              <div className="account-icon-seal gold">
                <ShieldCheck size={16} />
              </div>
              <div className="account-info">
                <div className="account-name">Liquidez No Comprometida</div>
                <div className="account-type">Capital libre sin pasivos</div>
              </div>
              <div className="account-balance-group">
                <div className="account-balance-val">{formatCurrency(unencumberedLiquidity)}</div>
                <span className="account-pill-tag gold">{liquidityRatio.toFixed(0)}% libre</span>
              </div>
            </div>

            {/* Row 2: Superávit / Balance Operativo */}
            <div
              className="account-row clickable"
              onClick={() => onNavigateTab && onNavigateTab('incomes')}
            >
              <div className="account-icon-seal green">
                <TrendingUp size={16} />
              </div>
              <div className="account-info">
                <div className="account-name">Superávit del Período</div>
                <div className="account-type">Ingresos vs Gastos del mes</div>
              </div>
              <div className="account-balance-group">
                <div className="account-balance-val text-emerald">
                  {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                </div>
                <span className="account-pill-tag green">Tasa {savingRate.toFixed(0)}%</span>
              </div>
            </div>

            {/* Row 3: Pasivos en Tarjetas */}
            <div
              className="account-row clickable"
              onClick={() => onNavigateTab && onNavigateTab('credit')}
            >
              <div className="account-icon-seal rose">
                <CardIcon size={16} />
              </div>
              <div className="account-info">
                <div className="account-name">Pasivos en Tarjetas</div>
                <div className="account-type">{creditCards.length} tarjeta{creditCards.length !== 1 ? 's' : ''} activas</div>
              </div>
              <div className="account-balance-group">
                <div className="account-balance-val text-rose">
                  {formatCurrency(creditSummary.totalDebt)}
                </div>
                <span className={`account-pill-tag ${creditSummary.utilizationRate > 30 ? 'rose' : 'neutral'}`}>
                  {creditSummary.utilizationRate.toFixed(0)}% uso
                </span>
              </div>
            </div>

            {/* Row 4: Retiros / Efectivo */}
            <div
              className="account-row clickable"
              onClick={() => onNavigateTab && onNavigateTab('cash')}
            >
              <div className="account-icon-seal amber">
                <Banknote size={16} />
              </div>
              <div className="account-info">
                <div className="account-name">Caja Chica & Efectivo</div>
                <div className="account-type">Retiros controlados</div>
              </div>
              <div className="account-balance-group">
                <div className="account-balance-val">{formatCurrency(paymentTotals.cash)}</div>
                <span className="account-pill-tag neutral">{pCash.length} movs</span>
              </div>
            </div>

            {/* Row 5: Compromisos Fijos */}
            <div
              className="account-row clickable"
              onClick={() => onNavigateTab && onNavigateTab('expenses')}
            >
              <div className="account-icon-seal slate">
                <Building2 size={16} />
              </div>
              <div className="account-info">
                <div className="account-name">Gastos Fijos Esenciales</div>
                <div className="account-type">Vivienda, cuotas, servicios</div>
              </div>
              <div className="account-balance-group">
                <div className="account-balance-val">{formatCurrency(fixedExp)}</div>
                <span className="account-pill-tag neutral">
                  {totalIn > 0 ? ((fixedExp / totalIn) * 100).toFixed(0) : 0}% de ingresos
                </span>
              </div>
            </div>

            {/* Row 6: Presupuestos Asignados */}
            <div
              className="account-row clickable"
              onClick={() => onNavigateTab && onNavigateTab('budgets')}
            >
              <div className="account-icon-seal gold">
                <Layers size={16} />
              </div>
              <div className="account-info">
                <div className="account-name">Presupuestos de Control</div>
                <div className="account-type">{categoryBudgets.length} límites configurados</div>
              </div>
              <div className="account-balance-group">
                <div className="account-balance-val">{categoryBudgets.length} activos</div>
                <span className="account-pill-tag gold">Control</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. AGENCYANALYTICS 2-ROW HIGH-DENSITY METRICS GRID (IMAGE 1) ── */}
      <div className="agency-kpi-grid">
        
        {/* Row 1, Card 1: Ingresos Totales */}
        <div className="agency-kpi-card" onClick={() => onNavigateTab && onNavigateTab('incomes')}>
          <div className="agency-kpi-top">
            <span className="agency-kpi-title">INGRESOS DEL PERÍODO</span>
            <span className={`agency-kpi-badge ${incDiff >= 0 ? 'pos' : 'neg'}`}>
              {incDiff >= 0 ? '+' : ''}{incDiff.toFixed(1)}%
            </span>
          </div>
          <div className="agency-kpi-val text-emerald">
            <AnimatedCurrency value={totalIn} />
          </div>
          <div className="agency-kpi-sub">
            {pInc.length} abonos registrados · {formatPeriodLabel(currentPeriod)}
          </div>
        </div>

        {/* Row 1, Card 2: Gastos Totales */}
        <div className="agency-kpi-card" onClick={() => onNavigateTab && onNavigateTab('expenses')}>
          <div className="agency-kpi-top">
            <span className="agency-kpi-title">GASTOS DEL PERÍODO</span>
            <span className={`agency-kpi-badge ${expDiff <= 0 ? 'pos' : 'neg'}`}>
              {expDiff >= 0 ? '+' : ''}{expDiff.toFixed(1)}%
            </span>
          </div>
          <div className="agency-kpi-val text-rose">
            <AnimatedCurrency value={totalExp} />
          </div>
          <div className="agency-kpi-sub">
            {pExp.length} transacciones registradas
          </div>
        </div>

        {/* Row 1, Card 3: Liquidez No Comprometida */}
        <div className="agency-kpi-card">
          <div className="agency-kpi-top">
            <span className="agency-kpi-title">LIQUIDEZ NO COMPROMETIDA</span>
            <span className="agency-kpi-badge gold">
              {liquidityRatio.toFixed(0)}% libre
            </span>
          </div>
          <div className="agency-kpi-val">
            <AnimatedCurrency value={unencumberedLiquidity} />
          </div>
          <div className="agency-kpi-sub">
            Capital soberano sin gravámenes de deuda
          </div>
        </div>

        {/* Row 1, Card 4: Tasa de Ahorro */}
        <div className="agency-kpi-card">
          <div className="agency-kpi-top">
            <span className="agency-kpi-title">TASA DE AHORRO</span>
            <span className={`agency-kpi-badge ${savingRate >= 30 ? 'pos' : savingRate >= 15 ? 'gold' : 'neg'}`}>
              {savingRate >= 30 ? 'Óptima' : savingRate >= 15 ? 'Moderada' : 'Ajustada'}
            </span>
          </div>
          <div className="agency-kpi-val text-gold">
            {savingRate.toFixed(1)}%
          </div>
          <div className="agency-kpi-sub">
            {savingRate >= 20 ? 'Excelente capacidad de retención' : 'Margen institucional a optimizar'}
          </div>
        </div>

        {/* Row 2, Card 5: Deuda Total Tarjetas */}
        <div className="agency-kpi-card" onClick={() => onNavigateTab && onNavigateTab('credit')}>
          <div className="agency-kpi-top">
            <span className="agency-kpi-title">DEUDA CONSOLIDADA TARJETAS</span>
            <span className={`agency-kpi-badge ${creditSummary.utilizationRate > 30 ? 'neg' : 'pos'}`}>
              {creditSummary.utilizationRate.toFixed(0)}% uso
            </span>
          </div>
          <div className="agency-kpi-val">
            <AnimatedCurrency value={creditSummary.totalDebt} />
          </div>
          <div className="agency-kpi-sub">
            Límite disponible: {formatCurrency(creditSummary.totalLimit - creditSummary.totalDebt)}
          </div>
        </div>

        {/* Row 2, Card 6: Compromiso Fijo */}
        <div className="agency-kpi-card">
          <div className="agency-kpi-top">
            <span className="agency-kpi-title">GASTOS FIJOS ESENCIALES</span>
            <span className="agency-kpi-badge neutral">
              {totalIn > 0 ? ((fixedExp / totalIn) * 100).toFixed(0) : 0}% in
            </span>
          </div>
          <div className="agency-kpi-val">
            <AnimatedCurrency value={fixedExp} />
          </div>
          <div className="agency-kpi-sub">
            Vivienda, compromisos fijos y servicios
          </div>
        </div>

        {/* Row 2, Card 7: Cobertura de Deuda */}
        <div className="agency-kpi-card">
          <div className="agency-kpi-top">
            <span className="agency-kpi-title">COBERTURA DE DEUDA</span>
            <span className="agency-kpi-badge pos">
              Solvencia
            </span>
          </div>
          <div className="agency-kpi-val text-emerald">
            {debtCoverage === 'Sin deuda' ? '100%' : `${debtCoverage}x`}
          </div>
          <div className="agency-kpi-sub">
            Ratio de respaldo patrimonio / pasivos
          </div>
        </div>

        {/* Row 2, Card 8: Progreso del Período */}
        <div className="agency-kpi-card">
          <div className="agency-kpi-top">
            <span className="agency-kpi-title">PROGRESO DEL PERÍODO</span>
            <span className="agency-kpi-badge gold">
              Día {monthProgress.currentDay}/{monthProgress.totalDays}
            </span>
          </div>
          <div className="agency-kpi-val">
            {monthProgress.percentPassed}%
          </div>
          <div className="agency-kpi-sub">
            {monthProgress.totalDays - monthProgress.currentDay} días restantes en el ciclo
          </div>
        </div>

      </div>

      {/* ── 4. ANALYTICS ROW: DONUT (AGENCYANALYTICS) + CANALES DE PAGO (HORIZONTAL BARS) + SOLVENCIA ── */}
      <div className="agency-analytics-row">
        
        {/* Card 1: Donut Gastos por Categoría con Centro Métrico (AgencyAnalytics Image 1) */}
        <div className="analytics-box">
          <div className="analytics-box-header">
            <div>
              <div className="analytics-box-title">Gastos por Categoría</div>
              <div className="analytics-box-sub">Distribución proporcional de egresos</div>
            </div>
          </div>

          {pieData.length === 0 ? (
            <div className="sandbox-empty">Sin egresos registrados en este período</div>
          ) : (
            <div className="agency-donut-container">
              <div className="donut-chart-wrapper">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color} stroke="#111319" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                      formatter={(val) => [formatCurrency(Number(val) || 0), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Metric in the center of the Donut (AgencyAnalytics style) */}
                <div className="donut-center-metric">
                  <span className="center-amount">${(totalExp / 1000).toFixed(1)}k</span>
                  <span className="center-label">Total Gastos</span>
                </div>
              </div>

              {/* Vertical Legend (AgencyAnalytics Image 1 style) */}
              <div className="agency-legend-col">
                {pieData.slice(0, 5).map((d, i) => (
                  <div key={i} className="agency-legend-item">
                    <span className="legend-bullet" style={{ background: d.color }} />
                    <span className="legend-label">{d.name}</span>
                    <strong className="legend-num">{formatCurrency(d.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Canales de Liquidez & Métodos de Pago (AgencyAnalytics "New MRR by Price" style) */}
        <div className="analytics-box">
          <div className="analytics-box-header">
            <div>
              <div className="analytics-box-title">Canales de Pago & Liquidez</div>
              <div className="analytics-box-sub">Consumo consolidado por vía de liquidación</div>
            </div>
          </div>

          <div className="agency-progress-bars">
            {paymentMethodsList.map((pm, i) => {
              const pct = totalExp > 0 ? (pm.amount / totalExp) * 100 : 0
              return (
                <div key={i} className="agency-bar-group">
                  <div className="bar-header-row">
                    <span className="bar-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: pm.color }}>{pm.icon}</span>
                      {pm.name}
                    </span>
                    <strong className="bar-amount">{formatCurrency(pm.amount)}</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.min(100, pct)}%`, background: pm.color }}
                    />
                  </div>
                  <div className="bar-footer-row">
                    <span>Participación</span>
                    <span>{pct.toFixed(1)}% del egreso</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card 3: Solvencia & Liquidez No Comprometida */}
        <div className="analytics-box">
          <div className="analytics-box-header">
            <div>
              <div className="analytics-box-title">Solvencia & Ratio Libre</div>
              <div className="analytics-box-sub">Equilibrio entre activos libres y pasivos</div>
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
                <span className="ratio-name">Libre</span>
                <strong className="ratio-amount">{formatCurrency(unencumberedLiquidity)}</strong>
              </div>
              <div className="ratio-legend-item">
                <span className="ratio-dot debt" />
                <span className="ratio-name">Tarjetas</span>
                <strong className="ratio-amount">{formatCurrency(creditSummary.totalDebt)}</strong>
              </div>
            </div>
          </div>

          <div className="solvency-mini-chart">
            <ResponsiveContainer width="100%" height={105}>
              {unencumberedView === 'trend' ? (
                <AreaChart data={liquidityTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="solvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F3CA65" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F3CA65" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#555" fontSize={10} tickLine={false} />
                  <YAxis stroke="#555" fontSize={9} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    formatter={(val) => [formatCurrency(Number(val) || 0), '']}
                  />
                  <Area type="monotone" dataKey="liquidez" stroke="#F3CA65" strokeWidth={2} fillOpacity={1} fill="url(#solvGrad)" name="Liquidez Libre" />
                </AreaChart>
              ) : (
                <BarChart data={liquidityTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#555" fontSize={10} tickLine={false} />
                  <YAxis stroke="#555" fontSize={9} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Bar dataKey="liquidez" fill="#34D399" radius={[3, 3, 0, 0]} name="Libre" />
                  <Bar dataKey="deuda" fill="#EF4444" radius={[3, 3, 0, 0]} name="Deuda" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── 5. SPLIT DATA: AGENCYANALYTICS TRANSACTIONS TABLE + MERCURY MONEY MOVEMENT ── */}
      <div className="mercury-bottom-split">
        
        {/* Left: Clean Transactions Table (AgencyAnalytics Table Style) */}
        <div className="analytics-box table-box">
          <div className="analytics-box-header">
            <div>
              <div className="analytics-box-title">Últimos Movimientos Certificados</div>
              <div className="analytics-box-sub">Transacciones consolidadas en {formatPeriodLabel(currentPeriod)}</div>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                className="mercury-pill-action outline small"
                onClick={() => onNavigateTab('expenses')}
                title="Ver todos los movimientos"
              >
                <span>Ver todos</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>

          {recentTx.length === 0 ? (
            <div className="sandbox-empty">
              No hay movimientos registrados en {formatPeriodLabel(currentPeriod)}.
            </div>
          ) : (
            <div className="agency-table-wrapper">
              <table className="agency-table">
                <thead>
                  <tr>
                    <th>FECHA</th>
                    <th>CONCEPTO / ITEM</th>
                    <th>TIPO</th>
                    <th style={{ textAlign: 'right' }}>TOTAL</th>
                    <th style={{ textAlign: 'center', width: 40 }}>IR</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx, idx) => {
                    const isInc = tx.kind === 'income'
                    return (
                      <tr key={idx}>
                        <td className="table-date">{tx.date}</td>
                        <td className="table-item">
                          <span className="item-name">{tx.description}</span>
                        </td>
                        <td>
                          {/* Vivid status pills inspired by AgencyAnalytics Image 1 */}
                          <span className={`agency-status-pill ${tx.tag.toLowerCase()}`}>
                            {tx.tag}
                          </span>
                        </td>
                        <td className={`table-amount ${isInc ? 'text-emerald' : 'text-rose'}`} style={{ textAlign: 'right' }}>
                          {isInc ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="table-row-jump"
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

        {/* Right: Mercury Money Movement (Money In & Money Out Cards - Image 2) */}
        <div className="mercury-money-movement-panel">
          
          {/* Card A: Money In */}
          <div className="money-movement-box">
            <div className="money-box-top">
              <div>
                <span className="movement-label">MONEY IN (INGRESOS)</span>
                <div className="movement-figure text-emerald">+{formatCurrency(totalIn)}</div>
              </div>
              <div className="movement-icon-tag green">
                <ArrowUpRight size={18} />
              </div>
            </div>

            <div className="movement-section-title">Principales Fuentes</div>
            <div className="movement-items-list">
              {topSourcesIn.length === 0 ? (
                <div className="empty-mini">Sin ingresos este mes</div>
              ) : (
                topSourcesIn.map((inc, i) => (
                  <div key={i} className="movement-row">
                    <div className="movement-row-left">
                      <div className="movement-row-badge green">
                        <DollarSign size={13} />
                      </div>
                      <div className="movement-row-name">{inc.description}</div>
                    </div>
                    <strong className="movement-row-val text-emerald">+{formatCurrency(inc.amount)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card B: Money Out */}
          <div className="money-movement-box">
            <div className="money-box-top">
              <div>
                <span className="movement-label">MONEY OUT (GASTOS)</span>
                <div className="movement-figure text-rose">-{formatCurrency(totalExp)}</div>
              </div>
              <div className="movement-icon-tag rose">
                <ArrowDownRight size={18} />
              </div>
            </div>

            <div className="movement-section-title">Principales Egresos</div>
            <div className="movement-items-list">
              {topSpendOut.length === 0 ? (
                <div className="empty-mini">Sin gastos este mes</div>
              ) : (
                topSpendOut.map((sp, i) => (
                  <div key={i} className="movement-row">
                    <div className="movement-row-left">
                      <div className="movement-row-badge" style={{ background: `${sp.color}22`, color: sp.color }}>
                        <Layers size={13} />
                      </div>
                      <div className="movement-row-name">{sp.name}</div>
                    </div>
                    <strong className="movement-row-val text-rose">-{formatCurrency(sp.amount)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── 6. MODAL DE CUMPLIMIENTO Y NORMATIVAS GLOBALES DE IA (PORTAL VIEWPORT) ── */}
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

            {/* BOTONES DE ACCIÓN: DESCARGA DE NORMATIVA & TÉRMINOS Y CONDICIONES */}
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
