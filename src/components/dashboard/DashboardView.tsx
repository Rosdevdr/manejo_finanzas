import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Shuffle,
  Lock,
  CreditCard as CardIcon,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts'
import type { Income, Expense, CreditCard, CreditCardTransaction } from '../../types/finance'
import type { TabType } from '../../types/navigation'
import { formatCurrency } from '../../utils/formatters'
import { getPreviousPeriod, getMonthProgress, MONTH_SHORT_NAMES } from '../../utils/calendar'
import { getConsolidatedCreditSummary } from '../../utils/creditAdvisor'

interface DashboardViewProps {
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
  creditCards?: CreditCard[]
  creditTransactions?: CreditCardTransaction[]
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
  onNavigateTab,
}: DashboardViewProps) {
  // Datos del período actual
  const pInc  = incomes.filter(i  => i.period === currentPeriod)
  const pExp  = expenses.filter(e => e.period === currentPeriod)
  const totalIn  = pInc.reduce((s, i) => s + i.amount, 0)
  const totalExp = pExp.reduce((s, e) => s + e.amount, 0)
  const balance  = totalIn - totalExp
  const savingRate = totalIn > 0 ? ((balance / totalIn) * 100) : 0
  const fixedExp   = pExp.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const varExp     = pExp.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)

  // Datos del período anterior (Cálculo matemático con calendario)
  const prevPeriod = getPreviousPeriod(currentPeriod)
  const prevInc = incomes.filter(i => i.period === prevPeriod)
  const prevExp = expenses.filter(e => e.period === prevPeriod)
  const prevTotalIn = prevInc.reduce((s, i) => s + i.amount, 0)
  const prevTotalExp = prevExp.reduce((s, e) => s + e.amount, 0)
  const prevBalance = prevTotalIn - prevTotalExp
  const prevSavingRate = prevTotalIn > 0 ? ((prevBalance / prevTotalIn) * 100) : 0

  // Comparativas estadísticas Mes vs Mes Anterior
  const incDiff = totalIn - prevTotalIn
  const incPct = prevTotalIn > 0 ? (incDiff / prevTotalIn) * 100 : (totalIn > 0 ? 100 : 0)
  const incTrend = prevTotalIn > 0 || totalIn > 0
    ? `${incPct >= 0 ? '+' : ''}${incPct.toFixed(1)}% vs mes ant.`
    : undefined
  const incTrendDir = incPct >= 0 ? 'up' : 'down'

  const expDiff = totalExp - prevTotalExp
  const expPct = prevTotalExp > 0 ? (expDiff / prevTotalExp) * 100 : (totalExp > 0 ? 100 : 0)
  const expTrend = prevTotalExp > 0 || totalExp > 0
    ? `${expPct >= 0 ? '+' : ''}${expPct.toFixed(1)}% vs mes ant.`
    : undefined
  // En gastos: si baja es favorable (trend-up verde), si sube es desfavorable (trend-down rojo)
  const expTrendDir = expPct <= 0 ? 'up' : 'down'

  const balDiff = balance - prevBalance
  const balTrend = prevTotalIn > 0 || totalIn > 0
    ? `${balDiff >= 0 ? '+' : ''}${formatCurrency(balDiff)} vs mes ant.`
    : undefined
  const balTrendDir = balDiff >= 0 ? 'up' : 'down'

  const rateDiff = savingRate - prevSavingRate
  const rateTrend = prevTotalIn > 0 || totalIn > 0
    ? `${rateDiff >= 0 ? '+' : ''}${rateDiff.toFixed(1)}% vs mes ant.`
    : undefined
  const rateTrendDir = rateDiff >= 0 ? 'up' : 'down'

  // Resumen de Tarjetas de Crédito
  const creditSummary = getConsolidatedCreditSummary(creditCards, creditTransactions)

  // Diagnóstico de calendario del mes
  const monthProgress = getMonthProgress(currentPeriod)

  // Pie chart data — by category
  const categoryTotals: Record<string, number> = {}
  pExp.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount })
  const pieData = Object.entries(categoryTotals).map(([cat, val]) => ({
    name: CATEGORY_LABELS[cat] ?? cat,
    value: val,
    color: CATEGORY_COLORS[cat] ?? '#555'
  }))

  // Bar chart — 5 meses históricos reales desde el almacenamiento
  const last5Periods: string[] = []
  let cursor = currentPeriod
  for (let i = 0; i < 5; i++) {
    last5Periods.unshift(cursor)
    cursor = getPreviousPeriod(cursor)
  }

  const barData = last5Periods.map(p => {
    const [, monthStr] = p.split('-')
    const mIdx = (parseInt(monthStr, 10) || 1) - 1
    const pIncomes = incomes.filter(i => i.period === p)
    const pExpenses = expenses.filter(e => e.period === p)
    const totI = pIncomes.reduce((s, i) => s + i.amount, 0)
    const totE = pExpenses.reduce((s, e) => s + e.amount, 0)
    return {
      label: MONTH_SHORT_NAMES[mIdx] || p,
      period: p,
      ingresos: Math.round(totI),
      gastos: Math.round(totE),
    }
  })

  const recentTx = [
    ...pInc.slice(0, 3).map(i => ({ ...i, kind: 'income' as const })),
    ...pExp.slice(0, 4).map(e => ({ ...e, kind: 'expense' as const })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  // Canales de liquidez y métodos de pago (mes)
  const channelData = [
    {
      id: 'bank_transfer',
      label: 'Transferencia Bancaria',
      amount: pExp.filter(e => e.paymentMethod === 'bank_transfer').reduce((s, e) => s + e.amount, 0),
      color: '#60A5FA',
      icon: '🏦',
    },
    {
      id: 'debit_card',
      label: 'Tarjeta de Débito',
      amount: pExp.filter(e => e.paymentMethod === 'debit_card').reduce((s, e) => s + e.amount, 0),
      color: '#34D399',
      icon: '💳',
    },
    {
      id: 'credit_card',
      label: 'Tarjeta de Crédito',
      amount: pExp.filter(e => e.paymentMethod === 'credit_card').reduce((s, e) => s + e.amount, 0),
      color: '#C9A84C',
      icon: '💳',
    },
    {
      id: 'cash',
      label: 'Efectivo / Cajero',
      amount: pExp.filter(e => e.paymentMethod === 'cash').reduce((s, e) => s + e.amount, 0),
      color: '#FBBF24',
      icon: '💵',
    },
  ]

  const kpis = [
    {
      label: 'Ingresos Totales',
      value: formatCurrency(totalIn),
      sub: `${pInc.length} fuente${pInc.length !== 1 ? 's' : ''}`,
      color: 'emerald',
      icon: <TrendingUp size={14} />,
      trend: incTrend,
      trendDir: incTrendDir,
    },
    {
      label: 'Gastos Totales',
      value: formatCurrency(totalExp),
      sub: `${pExp.length} registro${pExp.length !== 1 ? 's' : ''}`,
      color: 'red',
      icon: <TrendingDown size={14} />,
      trend: expTrend,
      trendDir: expTrendDir,
    },
    {
      label: 'Balance Neto',
      value: formatCurrency(balance),
      sub: balance >= 0 ? 'Saldo superavitario' : 'Déficit presupuestario',
      color: balance >= 0 ? 'emerald' : 'red',
      icon: <Wallet size={14} />,
      trend: balTrend,
      trendDir: balTrendDir,
    },
    {
      label: 'Tasa de Ahorro',
      value: `${savingRate.toFixed(1)}%`,
      sub: 'Del ingreso total',
      color: savingRate >= 20 ? 'emerald' : savingRate >= 10 ? 'amber' : 'red',
      icon: <PiggyBank size={14} />,
      trend: rateTrend,
      trendDir: rateTrendDir,
    },
    {
      label: 'Deuda Tarjetas',
      value: formatCurrency(creditSummary.totalDebt),
      sub: `${creditSummary.utilizationRate.toFixed(1)}% de cupo utilizado`,
      color: creditSummary.utilizationRate > 50 ? 'red' : creditSummary.utilizationRate > 30 ? 'amber' : 'gold',
      icon: <CardIcon size={14} />,
      trend: creditSummary.cardsCount > 0 ? `${creditSummary.cardsCount} tarjeta${creditSummary.cardsCount > 1 ? 's' : ''}` : undefined,
      trendDir: creditSummary.utilizationRate <= 30 ? 'up' : 'down',
    },
    {
      label: 'Gastos Fijos',
      value: formatCurrency(fixedExp),
      sub: totalIn > 0 ? `${((fixedExp / totalIn) * 100).toFixed(0)}% del ingreso` : 'Compromisos',
      color: 'gold',
      icon: <Lock size={14} />,
      trend: undefined,
      trendDir: 'up',
    },
    {
      label: 'Gastos Variables',
      value: formatCurrency(varExp),
      sub: totalIn > 0 ? `${((varExp / totalIn) * 100).toFixed(0)}% del ingreso` : '—',
      color: 'amber',
      icon: <Shuffle size={14} />,
      trend: undefined,
      trendDir: 'up',
    },
  ]


  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Dashboard</span></div>
        <h1 className="page-title">Panorama Financiero</h1>
      </div>

      {/* Calendar Progress & End of Month Alert Banner */}
      {monthProgress.isCurrentMonth && (
        <div style={{
          background: monthProgress.isMonthEndingSoon
            ? 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(20,20,28,0.8) 100%)'
            : 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(20,20,28,0.8) 100%)',
          border: `1px solid ${monthProgress.isMonthEndingSoon ? 'rgba(239,68,68,0.3)' : 'rgba(201,168,76,0.25)'}`,
          borderRadius: 14,
          padding: '12px 18px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: monthProgress.isMonthEndingSoon ? 'rgba(239,68,68,0.15)' : 'rgba(201,168,76,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: monthProgress.isMonthEndingSoon ? '#F87171' : '#C9A84C',
            }}>
              {monthProgress.isMonthEndingSoon ? <AlertCircle size={16} /> : <Calendar size={16} />}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF' }}>
                {monthProgress.isMonthEndingSoon
                  ? `⚡ ¡Cierre de Mes en Curso! Quedan solo ${monthProgress.daysRemaining} día${monthProgress.daysRemaining !== 1 ? 's' : ''} para finalizar el ciclo.`
                  : `📅 Calendario Real: Día ${monthProgress.currentDay} de ${monthProgress.totalDays} (${monthProgress.percentPassed}% transcurrido).`}
              </div>
              <div style={{ fontSize: 11.5, color: '#888898', marginTop: 2 }}>
                Quedan {monthProgress.daysRemaining} días calendario para cerrar este mes.
                {creditCards.length > 0 && ` Recuerda revisar tus fechas de corte y límites de pago.`}
              </div>
            </div>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('advisor')}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: 11.5 }}
            >
              <Sparkles size={13} />
              <span>Ver Asesor IA</span>
            </button>
          )}
        </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className={`kpi-card ${k.color}`}>
            <div className="kpi-top">
              <span className="kpi-label">{k.label}</span>
              <span className="kpi-icon">{k.icon}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
            {k.trend && (
              <div className={`kpi-trend ${k.trendDir === 'up' ? 'trend-up' : 'trend-down'}`}>
                {k.trendDir === 'up' ? '↑' : '↓'} {k.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Ingresos vs Gastos Históricos</div>
          <div className="chart-sub">Datos reales de los últimos 5 meses</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barSize={14} barGap={4}>
              <XAxis dataKey="label" tick={{ fill: '#444454', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#16161E', border: '1px solid #2A2A38', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#888898' }}
                formatter={(v: unknown) => [formatCurrency(v as number), '']}
              />
              <Bar dataKey="ingresos" fill="#34D399" radius={[3, 3, 0, 0]} name="Ingresos" />
              <Bar dataKey="gastos"   fill="#F87171" radius={[3, 3, 0, 0]} name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Distribución de Gastos</div>
          <div className="chart-sub">Por categoría en este período</div>
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#16161E', border: '1px solid #2A2A38', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: unknown) => [formatCurrency(v as number), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 120, overflowY: 'auto' }}>
                {pieData.slice(0, 5).map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ color: '#888898' }}>{d.name}</span>
                    </div>
                    <span style={{ color: '#D0D0DC', fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>
                      {formatCurrency(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state"><p className="empty-text">Sin datos de gastos para graficar</p></div>
          )}
        </div>
      </div>

      {/* Canales de Liquidez y Métodos de Pago Card (Mes) */}
      <div className="liquidity-channels-card">
        <div className="liquidity-channels-header">
          <div className="liquidity-title-group">
            <span className="pulse-indicator-dot" />
            <div>
              <div className="liquidity-card-title">Canales de Liquidez y Métodos de Pago (Mes)</div>
              <div className="liquidity-card-sub">Monitoreo en tiempo real de salidas según vía de pago en {currentPeriod}</div>
            </div>
          </div>
          <div className="liquidity-total-badge">
            Total en canales: {formatCurrency(totalExp)}
          </div>
        </div>

        {/* Multi-segment distribution bar */}
        <div className="liquidity-progress-bar">
          {totalExp > 0 ? (
            channelData.map(ch => {
              const pct = (ch.amount / totalExp) * 100
              if (pct <= 0) return null
              return (
                <div
                  key={ch.id}
                  className="liquidity-bar-segment"
                  style={{ width: `${pct}%`, backgroundColor: ch.color }}
                  title={`${ch.label}: ${formatCurrency(ch.amount)} (${pct.toFixed(1)}%)`}
                />
              )
            })
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
          )}
        </div>

        {/* Channels Grid */}
        <div className="liquidity-channels-grid">
          {channelData.map(ch => {
            const pct = totalExp > 0 ? (ch.amount / totalExp) * 100 : 0
            return (
              <div key={ch.id} className="liquidity-channel-item">
                <div className="liquidity-channel-top">
                  <span className="liquidity-channel-icon">{ch.icon}</span>
                  <span className="liquidity-channel-pct" style={{ color: ch.color, backgroundColor: `${ch.color}15` }}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="liquidity-channel-name">{ch.label}</div>
                <div className="liquidity-channel-amount">{formatCurrency(ch.amount)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="section-header">
        <div className="section-label">ACTIVIDAD RECIENTE</div>
        <div className="section-title">Últimos movimientos del período</div>
      </div>
      <div className="tx-list">
        <div className="tx-header">
          <span className="tx-title">Transacciones</span>
          <span className="tx-count">{recentTx.length} movimientos</span>
        </div>
        {recentTx.length === 0 ? (
          <div className="empty-state"><p className="empty-text">Sin movimientos para este período</p></div>
        ) : recentTx.map(tx => (
          <div key={tx.id} className="tx-row">
            <div className="tx-icon"
              style={{ background: tx.kind === 'income' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
              {tx.kind === 'income' ? '↓' : '↑'}
            </div>
            <div className="tx-body">
              <div className="tx-name">{tx.description}</div>
              <div className="tx-meta">
                <span className={`tx-badge ${tx.kind === 'income' ? 'badge-ingreso' : 'badge-variable'}`}>
                  {tx.kind === 'income' ? 'Ingreso' : 'Gasto'}
                </span>
                <span className="tx-date">{tx.date}</span>
              </div>
            </div>
            <div className="tx-right">
              <div className={`tx-amount ${tx.kind === 'income' ? 'amount-green' : 'amount-red'}`}>
                {tx.kind === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}




