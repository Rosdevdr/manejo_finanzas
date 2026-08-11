import { TrendingUp, TrendingDown, Wallet, PiggyBank, Shuffle, Lock } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts'
import type { Income, Expense } from '../../types/finance'
import type { TabType } from '../../types/navigation'
import { formatCurrency } from '../../utils/formatters'

interface DashboardViewProps {
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
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

const MONTHS = ['En', 'Fe', 'Ma', 'Ab', 'My', 'Jn', 'Jl', 'Ag', 'Se', 'Oc', 'No', 'Di']

export function DashboardView({ currentPeriod, incomes, expenses }: DashboardViewProps) {
  const pInc  = incomes.filter(i  => i.period === currentPeriod)
  const pExp  = expenses.filter(e => e.period === currentPeriod)
  const totalIn  = pInc.reduce((s, i) => s + i.amount, 0)
  const totalExp = pExp.reduce((s, e) => s + e.amount, 0)
  const balance  = totalIn - totalExp
  const savingRate = totalIn > 0 ? ((balance / totalIn) * 100) : 0
  const fixedExp   = pExp.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const varExp     = pExp.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)

  // Pie chart data — by category
  const categoryTotals: Record<string, number> = {}
  pExp.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount })
  const pieData = Object.entries(categoryTotals).map(([cat, val]) => ({ name: CATEGORY_LABELS[cat] ?? cat, value: val, color: CATEGORY_COLORS[cat] ?? '#555' }))

  // Bar chart — last 5 periods (simulate)
  const [, month] = currentPeriod.split('-').map(Number)
  const barData = Array.from({ length: 5 }).map((_, i) => {
    const m = ((month - 1 - (4 - i) + 12) % 12)
    const label = MONTHS[m]
    const isCurrentMonth = i === 4
    const totI = isCurrentMonth ? totalIn  : totalIn  * (0.7 + Math.random() * 0.5)
    const totE = isCurrentMonth ? totalExp : totalExp * (0.7 + Math.random() * 0.5)
    return { label, ingresos: Math.round(totI), gastos: Math.round(totE) }
  })

  const recentTx = [...pInc.slice(0, 2).map(i => ({ ...i, kind: 'income' as const })),
                    ...pExp.slice(0, 3).map(e => ({ ...e, kind: 'expense' as const }))]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const kpis = [
    {
      label: 'Ingresos Totales', value: formatCurrency(totalIn),
      sub: `${pInc.length} fuente${pInc.length !== 1 ? 's' : ''}`,
      color: 'emerald', icon: <TrendingUp size={14} />,
      trend: '+12%', trendDir: 'up',
    },
    {
      label: 'Gastos Totales', value: formatCurrency(totalExp),
      sub: `${pExp.length} registro${pExp.length !== 1 ? 's' : ''}`,
      color: 'red', icon: <TrendingDown size={14} />,
      trend: '+4%', trendDir: 'down',
    },
    {
      label: 'Balance Neto', value: formatCurrency(balance),
      sub: balance >= 0 ? 'Saldo positivo' : 'Saldo negativo',
      color: balance >= 0 ? 'emerald' : 'red', icon: <Wallet size={14} />,
      trend: balance >= 0 ? 'Saludable' : 'Déficit', trendDir: balance >= 0 ? 'up' : 'down',
    },
    {
      label: 'Tasa de Ahorro', value: `${savingRate.toFixed(1)}%`,
      sub: 'Del ingreso total',
      color: savingRate >= 20 ? 'emerald' : savingRate >= 10 ? 'amber' : 'red',
      icon: <PiggyBank size={14} />, trend: savingRate >= 20 ? 'Óptimo' : 'Mejorable', trendDir: 'up',
    },
    {
      label: 'Gastos Fijos', value: formatCurrency(fixedExp),
      sub: totalIn > 0 ? `${((fixedExp / totalIn) * 100).toFixed(0)}% del ingreso` : '—',
      color: 'gold', icon: <Lock size={14} />,
      trend: undefined, trendDir: 'up',
    },
    {
      label: 'Gastos Variables', value: formatCurrency(varExp),
      sub: totalIn > 0 ? `${((varExp / totalIn) * 100).toFixed(0)}% del ingreso` : '—',
      color: 'amber', icon: <Shuffle size={14} />,
      trend: undefined, trendDir: 'up',
    },
  ]

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Dashboard</span></div>
        <h1 className="page-title">Panorama Financiero</h1>
      </div>

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
          <div className="chart-title">Ingresos vs Gastos</div>
          <div className="chart-sub">Comparativa de los últimos 5 meses</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barSize={14} barGap={4}>
              <XAxis dataKey="label" tick={{ fill: '#444454', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#16161E', border: '1px solid #2A2A34', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#888898' }}
                formatter={(v: unknown) => [formatCurrency(v as number), '']}
              />
              <Bar dataKey="ingresos" fill="#34D399" radius={[3, 3, 0, 0]} />
              <Bar dataKey="gastos"   fill="#F87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Distribución de Gastos</div>
          <div className="chart-sub">Por categoría este período</div>
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#16161E', border: '1px solid #2A2A34', borderRadius: 8, fontSize: 12 }}
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

      {/* Recent Transactions */}
      <div className="section-header">
        <div className="section-label">ACTIVIDAD RECIENTE</div>
        <div className="section-title">Últimos movimientos</div>
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
