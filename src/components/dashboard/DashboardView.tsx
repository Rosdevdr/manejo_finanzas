import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  TrendingUp,
  CreditCard as CardIcon,
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
  Download,
  FileText,
} from 'lucide-react'
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import type { Income, Expense, CreditCard as CreditCardType, CreditCardTransaction, CashWithdrawal, CategoryBudget } from '../../types/finance'
import type { TabType } from '../../types/navigation'
import { formatCurrency } from '../../utils/formatters'
import { getPreviousPeriod, MONTH_SHORT_NAMES, calculateCumulativeBalance, formatPeriodLabel } from '../../utils/calendar'
import { getConsolidatedCreditSummary } from '../../utils/creditAdvisor'
import { downloadAiRegulationDocument } from '../../utils/aiRegulationDocument'
import { AnimatedCurrency } from '../ui/AnimatedCurrency'
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

const luxuryTooltipStyle: React.CSSProperties = {
  background: 'rgba(15, 15, 23, 0.94)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(212, 175, 55, 0.28)',
  borderRadius: '12px',
  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  fontSize: '12px',
  color: '#FFFFFF',
  fontFamily: "'Inter', sans-serif",
}

export function DashboardView({
  currentPeriod,
  incomes,
  expenses,
  cashWithdrawals = [],
  creditCards = [],
  creditTransactions = [],
  onNavigateTab,
  onOpenTerms,
}: DashboardViewProps) {

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

  // 2. Comparativa contra período anterior
  const prevPeriod = getPreviousPeriod(currentPeriod)
  const prevInc = incomes.filter(i => (i.period && i.period.trim().length === 7 ? i.period.trim() : i.date?.slice(0, 7)) === prevPeriod).reduce((s, i) => s + i.amount, 0)
  const prevExp = expenses.filter(e => (e.period && e.period.trim().length === 7 ? e.period.trim() : e.date?.slice(0, 7)) === prevPeriod).reduce((s, e) => s + e.amount, 0)

  const balDiff = prevInc - prevExp !== 0 ? ((balance - (prevInc - prevExp)) / Math.abs(prevInc - prevExp)) * 100 : 0

  // 3. Resumen de Deuda y Tarjetas
  const creditSummary = getConsolidatedCreditSummary(creditCards, creditTransactions)

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

  // 7. Liquidez No Comprometida (Unencumbered Liquidity - Sandbox Image 4)
  const unencumberedLiquidity = Math.max(0, cumulative.totalCumulativeBalance - creditSummary.totalDebt)


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

  // Estado de selector de vista de gráfico Sandbox
  const [chartView, setChartView] = useState<'flow' | 'networth'>('flow')

  return (
    <div className="dashboard-obsidian-root fade-in">
      {/* ── BENTO HEADER ── */}
      <header className="bento-header">
        <div>
          <div className="subtitle">AUREUS WEALTH ADVISOR · {formatPeriodLabel(currentPeriod)}</div>
          <h1>Terminal de Mando</h1>
        </div>
        <div className="bento-header-actions">
          <button type="button" className="sandbox-btn-outline" onClick={() => onNavigateTab && onNavigateTab('chat-advisor')}>
            <Sparkles size={14} /> Asesor IA
          </button>
          <button type="button" className="sandbox-btn-gold" onClick={() => onNavigateTab && onNavigateTab('expenses')}>
            <Plus size={14} /> Transacción
          </button>
        </div>
      </header>

      {/* ── AI COMPLIANCE BANNER ── */}
      <div className="ai-compliance-bento">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={14} className="text-gold" />
          <span><strong>Regulación IA:</strong> Operación bajo privacidad algorítmica y RLS local.</span>
        </div>
        <button type="button" className="ai-compliance-link" onClick={() => setShowComplianceModal(true)} style={{ background: 'transparent', border: 'none', color: '#F3CA65', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Info size={13} /> Detalles
        </button>
      </div>

      {/* ── SYNCRONIZED MODULES PILLS ── */}
      <div className="sync-bento">
        <Activity size={14} className="text-emerald" style={{ flexShrink: 0, marginRight: 4 }} />
        <button type="button" className="sync-module-pill" onClick={() => { triggerHaptic('light'); onNavigateTab && onNavigateTab('incomes') }}>
          <span>Ingresos</span><strong>{pInc.length}</strong>
        </button>
        <button type="button" className="sync-module-pill" onClick={() => { triggerHaptic('light'); onNavigateTab && onNavigateTab('expenses') }}>
          <span>Gastos</span><strong>{pExp.length}</strong>
        </button>
        <button type="button" className="sync-module-pill" onClick={() => { triggerHaptic('light'); onNavigateTab && onNavigateTab('credit') }}>
          <span>Tarjetas</span><strong>{pCardTxs.length}</strong>
        </button>
        <button type="button" className="sync-module-pill" onClick={() => { triggerHaptic('light'); onNavigateTab && onNavigateTab('cash') }}>
          <span>Efectivo</span><strong>{pCash.length}</strong>
        </button>
      </div>

      {/* ── MAIN BENTO GRID ── */}
      <div className="bento-grid-main">
        
        {/* HERO CARD (Net Worth) */}
        <div className="bento-card hero-card span-2-col">
          <div>
            <div className="bento-panel-title">
              Patrimonio Neto Institucional
              <span className={`sandbox-kpi-pill ${balDiff >= 0 ? 'pos' : 'neg'}`} style={{ marginLeft: 'auto' }}>
                {balDiff >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {Math.abs(balDiff).toFixed(1)}%
              </span>
            </div>
            <div className="hero-value tabular-nums">
              <AnimatedCurrency value={cumulative.totalCumulativeBalance} />
            </div>
          </div>
          <div className="hero-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#34D399' }}>
              <ShieldCheck size={14} /> Capital Protegido
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#C9A84C' }}>
              <TrendingUp size={14} /> Tasa Ahorro: {savingRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* DONUT CHART CARD */}
        <div className="bento-card span-2-col" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-panel-title"><Activity size={15} className="text-gold"/> Distribución de Egresos</div>
          {pieData.length === 0 ? (
            <div className="sandbox-empty" style={{ flex: 1 }}>Sin egresos en este período</div>
          ) : (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 20 }}>
              <div style={{ width: 140, height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="#0C0D14" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={luxuryTooltipStyle} formatter={(val) => [formatCurrency(Number(val)), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 130, overflowY: 'auto', paddingRight: 4 }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D1D5DB' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                      {d.name}
                    </span>
                    <span className="tabular-nums" style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* KPI MATRIX */}
        <div className="bento-card kpi-matrix span-2-col">
          <div className="kpi-cell">
            <span className="kpi-cell-title">Activos Liquidos (Inflows)</span>
            <span className="kpi-cell-value text-emerald tabular-nums"><AnimatedCurrency value={totalIn} /></span>
          </div>
          <div className="kpi-cell">
            <span className="kpi-cell-title">Pasivos Tarjetas</span>
            <span className="kpi-cell-value tabular-nums" style={{ color: '#FB7185' }}><AnimatedCurrency value={creditSummary.totalDebt} /></span>
          </div>
          <div className="kpi-cell">
            <span className="kpi-cell-title">Salidas (Outflows)</span>
            <span className="kpi-cell-value text-rose tabular-nums"><AnimatedCurrency value={totalExp} /></span>
          </div>
          <div className="kpi-cell">
            <span className="kpi-cell-title">Capital Libre (Unencumbered)</span>
            <span className="kpi-cell-value text-gold tabular-nums"><AnimatedCurrency value={unencumberedLiquidity} /></span>
          </div>
        </div>

        {/* WAVE CHART */}
        <div className="bento-card span-2-col">
          <div className="bento-panel-title" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span><Activity size={15} className="text-gold"/> Histórico de Flujo</span>
            <div style={{ display: 'flex', gap: 6 }}>
               <button type="button" style={{ background: chartView === 'flow' ? 'rgba(212,175,55,0.15)' : 'transparent', border: '1px solid rgba(212,175,55,0.2)', color: chartView === 'flow' ? '#F3CA65' : '#888', borderRadius: 6, padding: '2px 8px', fontSize: 10, cursor: 'pointer' }} onClick={() => setChartView('flow')}>FLUX</button>
               <button type="button" style={{ background: chartView === 'networth' ? 'rgba(212,175,55,0.15)' : 'transparent', border: '1px solid rgba(212,175,55,0.2)', color: chartView === 'networth' ? '#F3CA65' : '#888', borderRadius: 6, padding: '2px 8px', fontSize: 10, cursor: 'pointer' }} onClick={() => setChartView('networth')}>NW</button>
            </div>
          </div>
          <div style={{ height: 180, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'flow' ? (
                <AreaChart data={waveData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.4}/><stop offset="95%" stopColor="#34D399" stopOpacity={0.0}/></linearGradient>
                    <linearGradient id="outG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E09F67" stopOpacity={0.4}/><stop offset="95%" stopColor="#E09F67" stopOpacity={0.0}/></linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#555" fontSize={10} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip contentStyle={luxuryTooltipStyle} formatter={(val) => [formatCurrency(Number(val)), '']} />
                  <Area type="monotone" dataKey="inflows" stroke="#34D399" fill="url(#inG)" />
                  <Area type="monotone" dataKey="outflows" stroke="#E09F67" fill="url(#outG)" />
                </AreaChart>
              ) : (
                <AreaChart data={waveData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="nwG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C9A84C" stopOpacity={0.4}/><stop offset="95%" stopColor="#C9A84C" stopOpacity={0.0}/></linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#555" fontSize={10} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip contentStyle={luxuryTooltipStyle} formatter={(val) => [formatCurrency(Number(val)), '']} />
                  <Area type="monotone" dataKey="netWorth" stroke="#C9A84C" strokeWidth={2} fill="url(#nwG)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* PAYMENT CHANNELS */}
        <div className="bento-card">
          <div className="bento-panel-title"><CreditCard size={15} className="text-gold"/> Canales de Pago</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {paymentMethodsList.map((pm, i) => {
              const pct = totalExp > 0 ? (pm.amount / totalExp) * 100 : 0
              return (
                <div key={i} className="pay-card-bento">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: pm.color }}>{pm.icon} {pm.name}</span>
                    <span style={{ color: '#888', fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="tabular-nums" style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{formatCurrency(pm.amount)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="bento-card span-3-col">
          <div className="bento-panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><FileText size={15} className="text-gold" /> Transacciones Recientes</span>
            {onNavigateTab && (
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#C9A84C', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => onNavigateTab('expenses')}>
                Ver todo <ChevronRight size={12} />
              </button>
            )}
          </div>
          
          {recentTx.length === 0 ? (
            <div className="sandbox-empty" style={{ marginTop: 20 }}>No hay movimientos registrados.</div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table className="table-bento">
                <thead>
                  <tr>
                    <th>FECHA</th>
                    <th>CONCEPTO</th>
                    <th>TIPO</th>
                    <th style={{ textAlign: 'right' }}>MONTO</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx, idx) => (
                    <tr key={idx}>
                      <td style={{ color: '#888', fontSize: 11 }}>{tx.date}</td>
                      <td style={{ fontWeight: 500 }}>{tx.description}</td>
                      <td><span className={`sandbox-type-pill ${tx.typePillClass}`}>{tx.pillLabel}</span></td>
                      <td className={`tabular-nums ${tx.kind === 'income' ? 'text-emerald' : 'text-rose'}`} style={{ textAlign: 'right', fontWeight: 600 }}>
                        {tx.kind === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── MODAL COMPLIANCE ── */}
      {showComplianceModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowComplianceModal(false)}>
          <div className="modal-card" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Shield size={20} className="text-gold" />
                <span>Normativas IA & Transparencia</span>
              </h2>
              <button type="button" className="modal-close" onClick={() => setShowComplianceModal(false)}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12.5, color: '#D0D0DC', lineHeight: 1.6, marginTop: 10 }}>
              <div style={{ background: 'rgba(201, 168, 76, 0.08)', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: 10, padding: 14 }}>
                <strong style={{ color: '#F3CA65' }}>Reglamento EU AI Act & Global Digital Standards</strong>
                <p style={{ margin: '4px 0 0', color: '#D1D5DB' }}>Sistema de propósito específico de riesgo limitado con obligaciones de transparencia.</p>
              </div>
              <p>1. <strong>Privacidad:</strong> Procesamiento vía Row Level Security (RLS) en memoria. Sin entrenamiento de LLM público.</p>
              <p>2. <strong>Exención:</strong> Diagnósticos educativos, no asesoramiento regulado.</p>
              <p>3. <strong>Supervisión:</strong> 100% bajo control del usuario.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" className="sandbox-btn-outline" style={{ flex: 1 }} onClick={downloadAiRegulationDocument}>
                <Download size={14} /> Bajar Normativa (.txt)
              </button>
              {onOpenTerms && (
                <button type="button" className="sandbox-btn-outline" style={{ flex: 1, borderColor: 'rgba(201,168,76,0.3)', color: '#F1D97E' }} onClick={() => { setShowComplianceModal(false); onOpenTerms() }}>
                  <FileText size={14} /> Términos
                </button>
              )}
            </div>
            <button type="button" className="sandbox-btn-gold" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => setShowComplianceModal(false)}>Aceptado</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
