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
  UserCheck,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts'
import type { Income, Expense, CreditCard, CreditCardTransaction } from '../../types/finance'
import type { TabType } from '../../types/navigation'
import { formatCurrency } from '../../utils/formatters'
import { getPreviousPeriod, getMonthProgress, MONTH_SHORT_NAMES, calculateCumulativeBalance } from '../../utils/calendar'
import { getConsolidatedCreditSummary } from '../../utils/creditAdvisor'

interface DashboardViewProps {
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
  creditCards?: CreditCard[]
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
  const userName = userEmail ? userEmail.split('@')[0] : 'Jesús'
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1)

  // Datos del período actual y acumulado histórico
  const cumulative = calculateCumulativeBalance(incomes, expenses, currentPeriod)
  const pInc  = incomes.filter(i  => i.period === currentPeriod)
  const pExp  = expenses.filter(e => e.period === currentPeriod)
  const totalIn  = pInc.reduce((s, i) => s + i.amount, 0)
  const totalExp = pExp.reduce((s, e) => s + e.amount, 0)
  const balance  = totalIn - totalExp
  const savingRate = totalIn > 0 ? ((balance / totalIn) * 100) : 0
  const fixedExp   = pExp.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const varExp     = pExp.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)

  // Comparativa contra período anterior
  const prevPeriod  = getPreviousPeriod(currentPeriod)
  const prevInc     = incomes.filter(i => i.period === prevPeriod)
  const prevExp     = expenses.filter(e => e.period === prevPeriod)
  const prevTotalIn  = prevInc.reduce((s, i) => s + i.amount, 0)
  const prevTotalExp = prevExp.reduce((s, e) => s + e.amount, 0)
  const prevBalance  = prevTotalIn - prevTotalExp
  const prevSavingRate = prevTotalIn > 0 ? ((prevBalance / prevTotalIn) * 100) : 0

  const incDiff  = totalIn - prevTotalIn
  const incTrend = prevTotalIn > 0
    ? `${incDiff >= 0 ? '+' : ''}${((incDiff / prevTotalIn) * 100).toFixed(1)}% vs mes ant.`
    : undefined
  const incTrendDir = incDiff >= 0 ? 'up' : 'down'

  const expDiff  = totalExp - prevTotalExp
  const expTrend = prevTotalExp > 0
    ? `${expDiff >= 0 ? '+' : ''}${((expDiff / prevTotalExp) * 100).toFixed(1)}% vs mes ant.`
    : undefined
  const expTrendDir = expDiff <= 0 ? 'up' : 'down' // menor gasto es mejor ('up')

  const balDiff  = cumulative.totalCumulativeBalance - prevBalance
  const balTrend = prevTotalIn > 0 || totalIn > 0 || cumulative.carriedOverBalance !== 0
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
      label: 'Balance Total',
      value: formatCurrency(cumulative.totalCumulativeBalance),
      sub: cumulative.carriedOverBalance !== 0
        ? `Incluye ${formatCurrency(cumulative.carriedOverBalance)} de arrastre anterior`
        : (balance >= 0 ? 'Saldo superavitario del mes' : 'Déficit del mes'),
      color: cumulative.totalCumulativeBalance >= 0 ? 'emerald' : 'red',
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
      sub: `${creditSummary.utilizationRate}% de cupo utilizado`,
      color: creditSummary.utilizationRate > 30 ? 'red' : 'gold',
      icon: <CardIcon size={14} />,
      trend: undefined,
      trendDir: 'up',
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

      {/* Personalized Welcome Card with Variable Daily Financial Tip */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.14) 0%, rgba(18, 18, 26, 0.85) 100%)',
        border: '1px solid rgba(201, 168, 76, 0.3)',
        borderRadius: 14,
        padding: '14px 18px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserCheck size={22} style={{ color: '#F3CA65' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F3CA65' }}>
              ¡Bienvenido de nuevo, {capitalizedName}! 👋
            </div>
            <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>
              Resumen operativo para el período {currentPeriod} · Datos en vivo
            </div>
          </div>
        </div>

        {cumulative.carriedOverBalance !== 0 && (
          <div style={{
            width: '100%',
            marginTop: 4,
            padding: '7px 12px',
            borderRadius: 8,
            background: 'rgba(243, 202, 101, 0.07)',
            border: '1px solid rgba(243, 202, 101, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11.5,
          }}>
            <span style={{ color: '#D1D5DB' }}>
              💼 <strong>Saldo Arrastrado del Mes Anterior:</strong> Remanente acumulado transferido a {currentPeriod}:
            </span>
            <strong style={{ color: cumulative.carriedOverBalance >= 0 ? '#34D399' : '#F87171', fontFamily: 'Space Mono' }}>
              {cumulative.carriedOverBalance >= 0 ? '+' : ''}{formatCurrency(cumulative.carriedOverBalance)}
            </strong>
          </div>
        )}
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
            {monthProgress.isMonthEndingSoon ? (
              <AlertCircle size={18} style={{ color: '#EF4444' }} />
            ) : (
              <Calendar size={18} style={{ color: '#F3CA65' }} />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: monthProgress.isMonthEndingSoon ? '#EF4444' : '#F3CA65' }}>
                📅 Calendario Real: Día {monthProgress.currentDay} de {monthProgress.totalDays} ({monthProgress.percentPassed}% transcurrido).
              </div>
              <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>
                {monthProgress.isMonthEndingSoon
                  ? ` Quedan solo ${monthProgress.daysRemaining} días para cerrar el mes. ¡Revisa tus gastos variables pendientes!`
                  : ` Quedan ${monthProgress.daysRemaining} días calendario para cerrar este mes.`}
              </div>
            </div>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigateTab('chat-advisor')}
              style={{
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, rgba(243, 202, 101, 0.15) 0%, rgba(201, 168, 76, 0.25) 100%)',
                border: '1px solid rgba(243, 202, 101, 0.35)',
                color: '#F3CA65',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles size={14} />
              <span>Ver Asesor IA</span>
            </button>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {kpis.map((k, idx) => (
          <div key={idx} className={`kpi-card ${k.color}`}>
            <div className="kpi-header">
              <span className="kpi-label">{k.label}</span>
              <span className="kpi-icon-badge">{k.icon}</span>
            </div>

            <div className="kpi-value">{k.value}</div>

            <div className="kpi-footer">
              <span className="kpi-sub">{k.sub}</span>
              {k.trend && (
                <span className={`kpi-trend ${k.trendDir}`}>
                  {k.trendDir === 'up' ? '↑' : '↓'} {k.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* Bar Chart — Historico 5 Meses */}
        <div className="chart-card" style={{ background: '#12121A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F5' }}>Históricos (Ingresos vs Gastos)</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Últimos 5 meses acumulados en base de datos</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: '#1A1A24', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [formatCurrency(Number(value) || 0), '']}
                />
                <Bar dataKey="ingresos" fill="#34D399" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="gastos"   fill="#F87171" radius={[4, 4, 0, 0]} name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart — Distribucion de Gastos */}
        <div className="chart-card" style={{ background: '#12121A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F5' }}>Distribución de Gastos</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Por categoría en este período</div>
            </div>
          </div>
          {pieData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: 12 }}>
              Sin gastos registrados en {currentPeriod}
            </div>
          ) : (
            <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1A1A24', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                      formatter={(value) => [formatCurrency(Number(value) || 0), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', paddingLeft: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ color: '#BBB', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                    <span style={{ color: '#FFF', fontWeight: 600 }}>{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Movimientos Recientes */}
      <div className="recent-card" style={{ background: '#12121A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F5' }}>Últimos Movimientos ({currentPeriod})</div>
          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigateTab('expenses')}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                padding: '5px 14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(243, 202, 101, 0.25)',
                color: '#F3CA65',
                borderRadius: 7,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Ver todos los gastos →
            </button>
          )}
        </div>

        {recentTx.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#666', fontSize: 12 }}>
            No hay movimientos registrados en {currentPeriod}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTx.map((tx, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: tx.kind === 'income' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                    color: tx.kind === 'income' ? '#34D399' : '#F87171',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {tx.kind === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#FFF' }}>{tx.description}</div>
                    <div style={{ fontSize: 10.5, color: '#888' }}>{tx.date}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tx.kind === 'income' ? '#34D399' : '#F87171', fontFamily: 'Space Mono' }}>
                  {tx.kind === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
