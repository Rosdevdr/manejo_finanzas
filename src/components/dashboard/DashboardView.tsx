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
  Activity,
  CreditCard,
  Banknote,
  Building2,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import type { Income, Expense, CreditCard as CreditCardType, CreditCardTransaction } from '../../types/finance'
import type { TabType } from '../../types/navigation'
import { formatCurrency } from '../../utils/formatters'
import { getPreviousPeriod, getMonthProgress, MONTH_SHORT_NAMES, calculateCumulativeBalance } from '../../utils/calendar'
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
  const userName = userEmail ? userEmail.split('@')[0] : 'Jesús'
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1)

  // Datos del período actual y acumulado histórico
  const cumulative = calculateCumulativeBalance(incomes, expenses, currentPeriod)
  const pInc  = incomes.filter(i  => i.period === currentPeriod)
  const pExp  = expenses.filter(e => e.period === currentPeriod)
  const totalIn  = pInc.reduce((s, i) => s + i.amount, 0)
  const totalExp = pExp.reduce((s, e) => s + e.amount, 0)
  const balance  = totalIn - totalExp
  const savingRate = totalIn > 0 ? ((totalIn - totalExp) / totalIn) * 100 : 0
  const fixedExp = pExp.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const varExp   = pExp.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)

  // Comparativa contra período anterior
  const prevPeriod = getPreviousPeriod(currentPeriod)
  const prevInc = incomes.filter(i => i.period === prevPeriod).reduce((s, i) => s + i.amount, 0)
  const prevExp = expenses.filter(e => e.period === prevPeriod).reduce((s, e) => s + e.amount, 0)
  const prevBal = prevInc - prevExp
  const prevSavingRate = prevInc > 0 ? (prevBal / prevInc) * 100 : 0

  const incDiff = prevInc > 0 ? ((totalIn - prevInc) / prevInc) * 100 : 0
  const expDiff = prevExp > 0 ? ((totalExp - prevExp) / prevExp) * 100 : 0
  const balDiff = prevBal !== 0 ? ((balance - prevBal) / Math.abs(prevBal)) * 100 : 0
  const rateDiff = savingRate - prevSavingRate

  const incTrend = prevInc > 0 ? `${incDiff >= 0 ? '+' : ''}${incDiff.toFixed(1)}% vs mes ant.` : undefined
  const incTrendDir = incDiff >= 0 ? 'up' : 'down'
  const expTrend = prevExp > 0 ? `${expDiff >= 0 ? '+' : ''}${expDiff.toFixed(1)}% vs mes ant.` : undefined
  const expTrendDir = expDiff <= 0 ? 'up' : 'down'
  const balTrend = prevBal !== 0 ? `${balDiff >= 0 ? '+' : ''}${balDiff.toFixed(1)}% vs mes ant.` : undefined
  const balTrendDir = balDiff >= 0 ? 'up' : 'down'
  const rateTrend = prevInc > 0 ? `${rateDiff >= 0 ? '+' : ''}${rateDiff.toFixed(1)} pp vs mes ant.` : undefined
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

  // Últimos 5 meses históricos
  const last5Periods: string[] = []
  let cursor = currentPeriod
  for (let i = 0; i < 5; i++) {
    last5Periods.unshift(cursor)
    cursor = getPreviousPeriod(cursor)
  }

  // 1. Gráfico de Barras: Ingresos vs Gastos
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

  // 2. Gráfico de Área: Curva de Balance Acumulado & Trayectoria Patrimonial
  const areaData = last5Periods.map(p => {
    const [, monthStr] = p.split('-')
    const mIdx = (parseInt(monthStr, 10) || 1) - 1
    const cum = calculateCumulativeBalance(incomes, expenses, p)
    const pIncomes = incomes.filter(i => i.period === p).reduce((s, i) => s + i.amount, 0)
    const pExpenses = expenses.filter(e => e.period === p).reduce((s, e) => s + e.amount, 0)
    return {
      label: MONTH_SHORT_NAMES[mIdx] || p,
      period: p,
      balance: Math.round(cum.totalCumulativeBalance),
      superavit: Math.round(Math.max(0, pIncomes - pExpenses)),
    }
  })

  // 3. Gráfico de Barras Apiladas: Composición de Gastos Fijos vs Variables
  const stackedData = last5Periods.map(p => {
    const [, monthStr] = p.split('-')
    const mIdx = (parseInt(monthStr, 10) || 1) - 1
    const pExpenses = expenses.filter(e => e.period === p)
    const f = pExpenses.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
    const v = pExpenses.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)
    return {
      label: MONTH_SHORT_NAMES[mIdx] || p,
      period: p,
      fijos: Math.round(f),
      variables: Math.round(v),
    }
  })

  // 4. Métodos de Pago del Período
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
    { name: 'Tarjeta Débito', amount: paymentTotals.debit_card, icon: <CreditCard size={13} />, color: '#60A5FA' },
    { name: 'Tarjeta Crédito', amount: paymentTotals.credit_card, icon: <CardIcon size={13} />, color: '#F3CA65' },
    { name: 'Efectivo', amount: paymentTotals.cash, icon: <Banknote size={13} />, color: '#FBBF24' },
  ]

  // Mostrar transacciones del período actual; si está vacío usar las más recientes de cualquier período
  const periodTxAll = [
    ...pInc.map(i => ({ ...i, kind: 'income' as const })),
    ...pExp.map(e => ({ ...e, kind: 'expense' as const })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const recentTx = periodTxAll.length > 0
    ? periodTxAll.slice(0, 5)
    : [
        ...incomes.map(i => ({ ...i, kind: 'income' as const })),
        ...expenses.map(e => ({ ...e, kind: 'expense' as const })),
      ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

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
      sub: `${creditSummary.utilizationRate.toFixed(1)}% de cupo utilizado`,
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

      {/* Personalized Welcome Card */}
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

      {/* Calendar Progress */}
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
                  : ` Período financiero en curso con métricas actualizadas al instante.`}
              </div>
            </div>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigateTab('advisor')}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'rgba(201, 168, 76, 0.15)',
                border: '1px solid rgba(201, 168, 76, 0.35)',
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

      {/* Charts Section: Wealth Advisor 4-Quadrant Matrix */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* 1. Bar Chart — Historico 5 Meses */}
        <div className="chart-card" style={{ background: '#12121A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#F5F5F5' }}>Históricos (Ingresos vs Gastos)</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Flujo de caja de los últimos 5 meses</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 210 }}>
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

        {/* 2. Pie Chart — Distribucion de Gastos */}
        <div className="chart-card" style={{ background: '#12121A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#F5F5F5' }}>Distribución de Gastos</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Por categoría en {currentPeriod}</div>
            </div>
          </div>
          {pieData.length === 0 ? (
            <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: 12 }}>
              Sin gastos registrados en {currentPeriod}
            </div>
          ) : (
            <div style={{ width: '100%', height: 210, display: 'flex', alignItems: 'center' }}>
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
              <div style={{ width: '50%', paddingLeft: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 190, overflowY: 'auto' }}>
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

        {/* 3. Area Chart — Trayectoria de Patrimonio y Balance Acumulado */}
        <div className="chart-card" style={{ background: '#12121A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#F5F5F5' }}>Evolución del Balance Acumulado</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Trayectoria del patrimonio líquido mes a mes</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F3CA65" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F3CA65" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="superavitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: '#1A1A24', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [formatCurrency(Number(value) || 0), '']}
                />
                <Area type="monotone" dataKey="balance" stroke="#F3CA65" strokeWidth={2.5} fillOpacity={1} fill="url(#balanceGrad)" name="Balance Acumulado" />
                <Area type="monotone" dataKey="superavit" stroke="#34D399" strokeWidth={1.5} fillOpacity={1} fill="url(#superavitGrad)" name="Superávit del Mes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Stacked Bar Chart — Estructura de Gastos Fijos vs Variables */}
        <div className="chart-card" style={{ background: '#12121A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#F5F5F5' }}>Composición de Gastos (Fijos vs Variables)</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Rigidez vs Flexibilidad estructural de egresos</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: '#1A1A24', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [formatCurrency(Number(value) || 0), '']}
                />
                <Bar dataKey="fijos" stackId="a" fill="#C9A84C" radius={[0, 0, 0, 0]} name="Gastos Fijos" />
                <Bar dataKey="variables" stackId="a" fill="#FBBF24" radius={[4, 4, 0, 0]} name="Gastos Variables" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Canales de Pago del Período */}
      <div style={{
        background: '#12121A',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#F5F5F5', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} style={{ color: '#F3CA65' }} />
          <span>Canales de Pago y Flujo de Liquidez ({currentPeriod})</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {paymentMethodsList.map((pm, i) => {
            const pct = totalExp > 0 ? (pm.amount / totalExp) * 100 : 0
            return (
              <div key={i} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#9CA3AF', fontSize: 11.5, marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: pm.color, fontWeight: 600 }}>
                    {pm.icon} {pm.name}
                  </span>
                  <span style={{ fontFamily: 'Space Mono', fontWeight: 700 }}>{pct.toFixed(0)}%</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', fontFamily: 'Space Mono' }}>
                  {formatCurrency(pm.amount)}
                </div>
                <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pm.color, borderRadius: 2 }} />
                </div>
              </div>
            )
          })}
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
