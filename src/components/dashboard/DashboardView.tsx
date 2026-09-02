import { useState } from 'react'
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
  Info,
  X,
  Plus,
} from 'lucide-react'
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import type { Income, Expense, CreditCard as CreditCardType, CreditCardTransaction } from '../../types/finance'
import type { TabType } from '../../types/navigation'
import { formatCurrency } from '../../utils/formatters'
import { getPreviousPeriod, getMonthProgress, MONTH_SHORT_NAMES, calculateCumulativeBalance, formatPeriodLabel } from '../../utils/calendar'
import { getConsolidatedCreditSummary } from '../../utils/creditAdvisor'

interface DashboardViewProps {
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
  creditCards?: CreditCardType[]
  creditTransactions?: CreditCardTransaction[]
  userEmail?: string | null
  onNavigateTab?: (t: TabType) => void
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
  creditCards = [],
  creditTransactions = [],
  userEmail,
  onNavigateTab,
}: DashboardViewProps) {
  const userName = userEmail ? userEmail.split('@')[0] : 'Inversor'
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1)

  // Modal de cumplimiento de IA
  const [showComplianceModal, setShowComplianceModal] = useState(false)

  // 1. Datos estrictamente del período actual
  const cumulative = calculateCumulativeBalance(incomes, expenses, currentPeriod)
  const pInc = incomes.filter(i => (i.period && i.period.trim().length === 7 ? i.period.trim() : i.date?.slice(0, 7)) === currentPeriod)
  const pExp = expenses.filter(e => (e.period && e.period.trim().length === 7 ? e.period.trim() : e.date?.slice(0, 7)) === currentPeriod)
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

  // 4. Últimos Movimientos: ESTRICTAMENTE DEL PERÍODO ACTUAL
  const recentTx = [
    ...pInc.map(i => ({ ...i, kind: 'income' as const })),
    ...pExp.map(e => ({ ...e, kind: 'expense' as const })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)

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

  // 7. Liquidez No Comprometida (Unencumbered Liquidity - Sandbox Image 4)
  const unencumberedLiquidity = Math.max(0, cumulative.totalCumulativeBalance - creditSummary.totalDebt)
  const liquidityRatio = cumulative.totalCumulativeBalance > 0
    ? (unencumberedLiquidity / cumulative.totalCumulativeBalance) * 100
    : 0

  const liquidityTrendData = last5Periods.map(p => {
    const [, monthStr] = p.split('-')
    const mIdx = (parseInt(monthStr, 10) || 1) - 1
    const cum = calculateCumulativeBalance(incomes, expenses, p)
    return {
      label: MONTH_SHORT_NAMES[mIdx] || p,
      liquidez: Math.round(Math.max(0, cum.totalCumulativeBalance - creditSummary.totalDebt)),
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

  const paymentMethodsList = [
    { name: 'Transferencia', amount: paymentTotals.bank_transfer, icon: <Building2 size={13} />, color: '#34D399' },
    { name: 'Débito', amount: paymentTotals.debit_card, icon: <CreditCard size={13} />, color: '#60A5FA' },
    { name: 'Crédito', amount: paymentTotals.credit_card, icon: <CardIcon size={13} />, color: '#F3CA65' },
    { name: 'Efectivo', amount: paymentTotals.cash, icon: <Banknote size={13} />, color: '#FBBF24' },
  ]

  // Estado de selector de vista de gráfico Sandbox
  const [chartView, setChartView] = useState<'flow' | 'networth'>('flow')

  return (
    <div className="fade-in sandbox-dashboard">
      {/* ── TOP BANNER INSTITUCIONAL ── */}
      <div className="sandbox-header-strip">
        <div>
          <div className="sandbox-subhead">AUREUS WEALTH ADVISOR · {formatPeriodLabel(currentPeriod).toUpperCase()}</div>
          <h1 className="sandbox-title">Portfolio Overview</h1>
        </div>
        <div className="sandbox-header-actions">
          <button
            type="button"
            className="sandbox-btn-outline"
            onClick={() => onNavigateTab && onNavigateTab('chat-advisor')}
          >
            <Sparkles size={14} />
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

      {/* ── AVISO DE CUMPLIMIENTO REGULATORIO IA (GLOBAL STANDARDS) ── */}
      <div className="ai-compliance-banner">
        <div className="ai-compliance-text">
          <Shield size={14} className="text-gold" />
          <span>
            <strong>Marco Regulatorio IA:</strong> Cumplimiento normativo ético y de privacidad algorítmica (EU AI Act & Data Privacy).
          </span>
        </div>
        <button
          type="button"
          className="ai-compliance-link"
          onClick={() => setShowComplianceModal(true)}
        >
          <Info size={12} style={{ display: 'inline', marginRight: 4 }} />
          Ver Normativas de Uso
        </button>
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
          <div className="sandbox-kpi-value">{formatCurrency(cumulative.totalCumulativeBalance)}</div>
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
          <div className="sandbox-kpi-value text-emerald">{formatCurrency(totalIn)}</div>
          <div className="sandbox-kpi-sub">{pInc.length} entradas en {MONTH_SHORT_NAMES[(parseInt(currentPeriod.split('-')[1], 10) || 1) - 1]}</div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Pasivos / Tarjetas</span>
            <span className={`sandbox-kpi-pill ${creditSummary.utilizationRate > 30 ? 'neg' : 'neutral'}`}>
              {creditSummary.utilizationRate.toFixed(0)}% cupo
            </span>
          </div>
          <div className="sandbox-kpi-value text-gold">{formatCurrency(creditSummary.totalDebt)}</div>
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
          <div className="sandbox-kpi-value text-emerald">{formatCurrency(totalIn)}</div>
          <div className="sandbox-kpi-sub">Fijos: {formatCurrency(pInc.filter(i => i.type === 'salary').reduce((s, i) => s + i.amount, 0))}</div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Outflows (Salidas)</span>
            <span className={`sandbox-kpi-pill ${expDiff <= 0 ? 'pos' : 'neg'}`}>
              {expDiff >= 0 ? `+${expDiff.toFixed(1)}%` : `${expDiff.toFixed(1)}%`}
            </span>
          </div>
          <div className="sandbox-kpi-value text-rose">{formatCurrency(totalExp)}</div>
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
        <div className="sandbox-panel-title" style={{ marginBottom: 12 }}>
          <Activity size={15} className="text-gold" />
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
              >
                <span>Ver todos los movimientos</span>
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
                          <span className={`sandbox-type-pill ${isInc ? 'in' : 'out'}`}>
                            {isInc ? '+ INFLOW' : '- OUTFLOW'}
                          </span>
                        </td>
                        <td className={`cell-total ${isInc ? 'text-emerald' : 'text-rose'}`}>
                          {isInc ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="table-action-chevron"
                            onClick={() => onNavigateTab && onNavigateTab(isInc ? 'incomes' : 'expenses')}
                            title="Ver en detalle"
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

        {/* Columna Derecha: Unencumbered Liquidity (Sandbox Image 4) */}
        <div className="unencumbered-panel">
          <div>
            <div className="sandbox-panel-header" style={{ marginBottom: 4 }}>
              <div>
                <div className="sandbox-panel-title">Unencumbered Liquidity</div>
                <div className="sandbox-panel-sub">Capital libre neto sin compromisos de deuda</div>
              </div>
              <div className="sandbox-pills">
                <span className="sandbox-pill-btn active">5M</span>
              </div>
            </div>

            <div className="unencumbered-stat-row">
              <div className="unencumbered-val">{formatCurrency(unencumberedLiquidity)}</div>
              <div className="unencumbered-sub">
                {liquidityRatio.toFixed(0)}% libre
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#888898', marginBottom: 12 }}>
              Pasivos descontados: {formatCurrency(creditSummary.totalDebt)} en tarjetas
            </div>
          </div>

          <div style={{ width: '100%', height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liquidityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="unencumberedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E09F67" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#E09F67" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#555" fontSize={11} tickLine={false} />
                <YAxis stroke="#555" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: '#121217', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  formatter={(val) => [formatCurrency(Number(val) || 0), 'Liquidez Libre']}
                />
                <Area
                  type="monotone"
                  dataKey="liquidez"
                  stroke="#E09F67"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#unencumberedGrad)"
                  name="Liquidez No Comprometida"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── MODAL DE CUMPLIMIENTO Y NORMATIVAS GLOBALES DE IA ── */}
      {showComplianceModal && (
        <div className="modal-overlay" onClick={() => setShowComplianceModal(false)}>
          <div className="modal-card" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Shield size={18} className="text-gold" />
                <span>Normativas de Inteligencia Artificial & Transparencia</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowComplianceModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12.5, color: '#D0D0DC', lineHeight: 1.6 }}>
              <div style={{ background: 'rgba(201, 168, 76, 0.08)', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: 8, padding: 12 }}>
                <strong style={{ color: '#F3CA65' }}>Marco Regulatorio Internacional (EU AI Act & Global Digital Standards)</strong>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#D1D5DB' }}>
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

            <div className="modal-footer" style={{ marginTop: 18 }}>
              <button
                type="button"
                className="sandbox-btn-gold"
                style={{ width: '100%' }}
                onClick={() => setShowComplianceModal(false)}
              >
                Entendido y Aceptado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
