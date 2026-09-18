import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useCountUp } from '../../hooks/useCountUp'
import {
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
  Zap,
  Target,
  ArrowRight,
  Compass,
} from 'lucide-react'
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import type { Income, Expense, CreditCard as CreditCardType, CreditCardTransaction, CashWithdrawal, CategoryBudget } from '../../types/finance'
import type { TabType } from '../../types/navigation'
import { formatCurrency } from '../../utils/formatters'
import { getPreviousPeriod, getMonthProgress, MONTH_SHORT_NAMES, calculateCumulativeBalance, formatPeriodLabel } from '../../utils/calendar'
import { getConsolidatedCreditSummary } from '../../utils/creditAdvisor'
import { downloadAiRegulationDocument } from '../../utils/aiRegulationDocument'
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
  userName?: string | null
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
  categoryBudgets: _categoryBudgets = [],
  userEmail,
  userName,
  onNavigateTab,
  onOpenTerms,
}: DashboardViewProps) {
  // Obtener nombre formateado del usuario (evitando siempre 'Inversor')
  const resolvedUserName = (() => {
    if (userName && userName.trim()) return userName.trim()
    if (userEmail && userEmail.trim()) {
      const prefix = userEmail.split('@')[0]
      const formatted = prefix
        .replace(/[._-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
      if (formatted.toLowerCase().includes('jesus')) {
        return formatted.replace(/Jesus/i, 'Jesús')
      }
      return formatted || 'Jesús Rosario'
    }
    return 'Jesús Rosario'
  })()

  // Tarjeta de Crédito Principal (si existe al menos una en el sistema)
  const primaryCard = creditCards && creditCards.length > 0 ? creditCards[0] : null
  const cardThemeClass = primaryCard?.color ? `theme-card-${primaryCard.color}` : ''

  // Estado de inclinación 3D (Mouse Tilt Parallax) para la tarjeta Titanium
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false, flareX: 50, flareY: 50 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rotX = (0.5 - y) * 14
    const rotY = (x - 0.5) * 14
    setTilt({
      x: rotX,
      y: rotY,
      active: true,
      flareX: Math.round(x * 100),
      flareY: Math.round(y * 100),
    })
  }

  const handleCardMouseLeave = () => {
    setTilt({ x: 0, y: 0, active: false, flareX: 50, flareY: 50 })
  }

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

  // 1. Datos consolidados del período actual
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

  const balDiff = prevInc - prevExp !== 0 ? ((balance - (prevInc - prevExp)) / Math.abs(prevInc - prevExp)) * 100 : 0

  // 3. Resumen de Deuda y Tarjetas
  const creditSummary = getConsolidatedCreditSummary(creditCards, creditTransactions)
  const monthProgress = getMonthProgress(currentPeriod)

  // 4. Métricas de Liquidez y Pista Financiera (Financial Runway)
  const unencumberedLiquidity = Math.max(0, cumulative.totalCumulativeBalance - creditSummary.totalDebt)
  const liquidityRatio = cumulative.totalCumulativeBalance > 0
    ? (unencumberedLiquidity / cumulative.totalCumulativeBalance) * 100
    : 0
  
  const runwayMonths = fixedExp > 0 
    ? (unencumberedLiquidity / fixedExp).toFixed(1) 
    : '12+'
  
  const debtCoverage = creditSummary.totalDebt > 0
    ? (cumulative.totalCumulativeBalance / creditSummary.totalDebt).toFixed(1)
    : '100% Solvente'

  // 5. Últimos Movimientos Consolidados de TODOS los Módulos
  const recentTx = [
    ...pInc.map(i => ({
      id: i.id,
      date: i.date,
      description: i.description,
      amount: i.amount,
      kind: 'income' as const,
      tag: 'INGRESO',
      typePillClass: 'ingreso',
      targetTab: 'incomes' as TabType,
    })),
    ...pExp.map(e => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      kind: 'expense' as const,
      tag: 'GASTO',
      typePillClass: 'gasto',
      targetTab: 'expenses' as TabType,
    })),
    ...pCardTxs.map(t => ({
      id: t.id,
      date: t.date,
      description: `[Tarjeta] ${t.description}`,
      amount: t.amount,
      kind: 'expense' as const,
      tag: 'TARJETA',
      typePillClass: 'tarjeta',
      targetTab: 'credit' as TabType,
    })),
    ...pCash.map(c => ({
      id: c.id,
      date: c.date,
      description: `[Efectivo] ${c.note || 'Retiro en efectivo'}`,
      amount: c.amount,
      kind: 'expense' as const,
      tag: 'EFECTIVO',
      typePillClass: 'efectivo',
      targetTab: 'cash' as TabType,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)

  // 6. Pie chart data (Desglose categórico)
  const categoryTotals: Record<string, number> = {}
  pExp.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount })
  const pieData = Object.entries(categoryTotals).map(([cat, val]) => ({
    name: CATEGORY_LABELS[cat] ?? cat,
    value: val,
    color: CATEGORY_COLORS[cat] ?? '#C9A84C',
  }))

  // 7. Línea de tiempo histórica de 5 meses
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
      inflows: Math.round(totI),
      outflows: Math.round(totE),
      netWorth: Math.round(cum.totalCumulativeBalance),
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

  // Proporciones para el Espectro de Capital
  const totalAssets = Math.max(1, cumulative.totalCumulativeBalance)
  const freeCapPct = Math.min(100, Math.max(0, (unencumberedLiquidity / totalAssets) * 100))
  const fixedCommitPct = Math.min(100, Math.max(0, (fixedExp / totalAssets) * 100))
  const debtPct = Math.min(100, Math.max(0, (creditSummary.totalDebt / totalAssets) * 100))

  return (
    <div className="fade-in fintech-vault-container">

      {/* ── 1. RAMP / APPLE TOP COMMAND HEADER ── */}
      <div className="fintech-top-header">
        <div className="header-greeting-block">
          <div className="institutional-eyebrow">
            <span className="eyebrow-pulsar" />
            <span>AUREUS PRIVATE WEALTH · {formatPeriodLabel(currentPeriod).toUpperCase()}</span>
          </div>
          <h1 className="fintech-main-title">Consola Patrimonial, {resolvedUserName}</h1>
          <p className="fintech-main-sub">
            Arquitectura de liquidez no gravada, pista de solvencia y ejecución en tiempo real.
          </p>
        </div>

        <div className="header-action-capsules">
          <button
            type="button"
            className="action-capsule-gold"
            onClick={() => {
              triggerHaptic('light')
              onNavigateTab && onNavigateTab('expenses')
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Registrar Movimiento</span>
          </button>
          
          <button
            type="button"
            className="action-capsule-glass"
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
            className="action-capsule-glass compliance-badge"
            onClick={() => setShowComplianceModal(true)}
            title="Normativas de Inteligencia Artificial & Transparencia"
          >
            <Shield size={13} />
            <span>Normativa IA</span>
          </button>
        </div>
      </div>

      {/* ── 2. THE MASTER VAULT HERO (APPLE WALLET TITANIUM CARD + CAPITAL ENGINE) ── */}
      <div className="vault-hero-grid">

        {/* Left: Apple Wallet Inspired Titanium Black Card con Física 3D */}
        <div className="apple-wallet-card-container">
          <div
            ref={cardRef}
            className={`apple-titanium-card ${cardThemeClass} ${tilt.active ? 'is-tilting' : ''}`}
            onClick={() => {
              triggerHaptic('light')
              onNavigateTab && onNavigateTab('credit')
            }}
            title={primaryCard ? `Tarjeta Principal: ${primaryCard.name} (${primaryCard.bank || 'AUREUS'}) · Clic para administrar` : 'Gestionar Tarjetas de Crédito'}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            style={{
              transform: tilt.active
                ? `perspective(1000px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
                : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            }}
          >
            {/* Haz holográfico y destello reactivo centrado en el cursor */}
            <div className="card-hologram-sweep" />
            <div
              className="card-specular-glare"
              style={{
                background: `radial-gradient(circle 140px at ${tilt.flareX}% ${tilt.flareY}%, rgba(243, 202, 101, 0.25) 0%, rgba(255, 255, 255, 0.08) 35%, transparent 70%)`,
                opacity: tilt.active ? 1 : 0.35,
              }}
            />

            <div className="card-header-line">
              <div className="card-brand-tag">
                {primaryCard ? (primaryCard.bank ? primaryCard.bank.toUpperCase() : primaryCard.name.toUpperCase()) : 'AUREUS'}
              </div>
              <div className="card-nfc-indicator" title="Contactless Active">
                <span className="nfc-arc a1" />
                <span className="nfc-arc a2" />
                <span className="nfc-arc a3" />
              </div>
            </div>

            <div className="card-emv-chip">
              <div className="chip-line horizontal" />
              <div className="chip-line vertical" />
            </div>

            <div className="card-digits-embossed">
              <span>••••</span>
              <span>••••</span>
              <span>••••</span>
              <span className="last-four">
                {primaryCard ? primaryCard.lastFourDigits : '4821'}
              </span>
            </div>

            <div className="card-footer-line">
              <div className="card-client-info">
                <span className="card-tier-label">
                  {primaryCard ? primaryCard.name.toUpperCase() : 'TITANIUM BLACK SIGNATURE'}
                </span>
                <span className="card-holder-name">{resolvedUserName.toUpperCase()}</span>
              </div>
              <div className="card-footer-meta">
                {primaryCard && primaryCard.creditLimit > 0 && (
                  <span className="card-limit-chip" title={`Límite de Crédito: ${formatCurrency(primaryCard.creditLimit)}`}>
                    LÍM {formatCurrency(primaryCard.creditLimit)}
                  </span>
                )}
                <div className="card-security-seal" title="Cifrado RLS & Protección de Tarjeta">
                  <ShieldCheck size={17} className="text-gold" />
                </div>
              </div>
            </div>
          </div>

          {/* Runway Meter underneath Card (Ramp style runway) */}
          <div className="card-runway-capsule">
            <div className="runway-header">
              <span className="runway-label">PISTA DE SOLVENCIA (RUNWAY)</span>
              <strong className="runway-val text-emerald">{runwayMonths} Meses</strong>
            </div>
            <div className="runway-track">
              <div
                className="runway-bar"
                style={{ width: `${Math.min(100, Math.max(10, (parseFloat(runwayMonths) / 12) * 100))}%` }}
              />
            </div>
            <div className="runway-caption">
              Capacidad de cobertura de compromisos fijos sin ingresos adicionales.
            </div>
          </div>
        </div>

        {/* Right: Master Sovereign Balance & Visual Area Chart */}
        <div className="vault-balance-engine">
          <div className="engine-top-bar">
            <div>
              <span className="engine-eyebrow">PATRIMONIO NETO DISPONIBLE</span>
              <div className="engine-balance-display">
                <span className="currency-prefix">RD$</span>
                <span className="balance-integer">
                  {Math.floor(Math.abs(useCountUp(cumulative.totalCumulativeBalance, 650))).toLocaleString('es-DO')}
                </span>
                <span className="balance-decimal">
                  .{Math.round((Math.abs(cumulative.totalCumulativeBalance) % 1) * 100).toString().padStart(2, '0')}
                </span>
                {balDiff !== 0 && (
                  <span className={`engine-delta-pill ${balDiff >= 0 ? 'positive' : 'negative'}`}>
                    {balDiff >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {Math.abs(balDiff).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            <div className="engine-chart-toggles">
              <button
                type="button"
                className={`toggle-tab ${chartView === 'flow' ? 'active' : ''}`}
                onClick={() => setChartView('flow')}
              >
                Flujo Mensual
              </button>
              <button
                type="button"
                className={`toggle-tab ${chartView === 'networth' ? 'active' : ''}`}
                onClick={() => setChartView('networth')}
              >
                Patrimonio
              </button>
            </div>
          </div>

          {/* Cash Pulse Bar */}
          <div className="engine-pulse-strip">
            <div className="pulse-metric">
              <span className="indicator-dot inflow" />
              <span className="pulse-tag">Inflows:</span>
              <strong className="pulse-num text-emerald">+{formatCurrency(totalIn)}</strong>
            </div>
            <div className="pulse-metric">
              <span className="indicator-dot outflow" />
              <span className="pulse-tag">Outflows:</span>
              <strong className="pulse-num text-rose">-{formatCurrency(totalExp)}</strong>
            </div>
            <div className="pulse-metric">
              <span className="indicator-dot net" />
              <span className="pulse-tag">Superávit Neto:</span>
              <strong className={`pulse-num ${balance >= 0 ? 'text-emerald' : 'text-rose'}`}>
                {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
              </strong>
            </div>
          </div>

          {/* Dynamic Recharts Area Chart */}
          <div className="engine-chart-viewport">
            <ResponsiveContainer width="100%" height={155}>
              {chartView === 'flow' ? (
                <AreaChart data={waveData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vaultInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="vaultOutflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#4B5563" fontSize={11} tickLine={false} />
                  <YAxis stroke="#4B5563" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#0B0C10', border: '1px solid rgba(243,202,101,0.2)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [formatCurrency(Number(v) || 0), '']}
                  />
                  <Area type="monotone" dataKey="inflows" stroke="#22C55E" strokeWidth={2.5} fillOpacity={1} fill="url(#vaultInflow)" name="Ingresos" />
                  <Area type="monotone" dataKey="outflows" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#vaultOutflow)" name="Gastos" />
                </AreaChart>
              ) : (
                <AreaChart data={waveData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vaultNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F3CA65" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F3CA65" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#4B5563" fontSize={11} tickLine={false} />
                  <YAxis stroke="#4B5563" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#0B0C10', border: '1px solid rgba(243,202,101,0.2)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [formatCurrency(Number(v) || 0), '']}
                  />
                  <Area type="monotone" dataKey="netWorth" stroke="#F3CA65" strokeWidth={3} fillOpacity={1} fill="url(#vaultNetWorth)" name="Patrimonio" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="engine-meta-footer">
            <div className="meta-capsule">
              <ShieldCheck size={13} className="text-emerald" />
              <span>Soberanía RLS Activa</span>
            </div>
            <div className="meta-capsule">
              <Calendar size={13} className="text-gold" />
              <span>Día <strong>{monthProgress.currentDay}</strong>/{monthProgress.totalDays} ({monthProgress.percentPassed}%)</span>
            </div>
            {cumulative.carriedOverBalance !== 0 && (
              <div className="meta-capsule">
                <Activity size={13} style={{ color: '#94A3B8' }} />
                <span>Arrastre: <strong>{formatCurrency(cumulative.carriedOverBalance)}</strong></span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── 3. RAMP SMART ACTION QUEUE (WORK QUEUE / COPILOT PRIORITIES) ── */}
      <div className="ramp-action-section">
        <div className="section-title-strip">
          <div className="title-with-pill">
            <Compass size={15} className="text-gold" />
            <h2 className="section-heading">Cola de Acciones Prioritarias · Asesor Inteligente</h2>
            <span className="queue-counter">3 Tareas Hoy</span>
          </div>
          <button
            type="button"
            className="action-view-all"
            onClick={() => onNavigateTab && onNavigateTab('chat-advisor')}
          >
            <span>Consultar Asesor</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="ramp-cards-queue">
          
          {/* Action 1: Golden Window Credit Card Strategy */}
          <div
            className="ramp-queue-card"
            onClick={() => {
              triggerHaptic('light')
              onNavigateTab && onNavigateTab('credit')
            }}
          >
            <div className="queue-card-badge gold">
              <Zap size={14} />
              <span>Ventana de Apalancamiento</span>
            </div>
            <h3 className="queue-card-title">
              {creditCards.length > 0 ? `${creditCards[0].name}: Ciclo Activo` : 'Optimización de Crédito'}
            </h3>
            <p className="queue-card-desc">
              Deuda consolidada en {formatCurrency(creditSummary.totalDebt)} ({creditSummary.utilizationRate.toFixed(0)}% del límite). Mantén el uso por debajo del 30% para proteger solvencia.
            </p>
            <div className="queue-card-footer">
              <span className="queue-cta-link">
                <span>Gestionar Tarjetas</span>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* Action 2: Unencumbered Capital Deployment */}
          <div
            className="ramp-queue-card"
            onClick={() => {
              triggerHaptic('light')
              onNavigateTab && onNavigateTab('budgets')
            }}
          >
            <div className="queue-card-badge green">
              <ShieldCheck size={14} />
              <span>Excedente No Gravado</span>
            </div>
            <h3 className="queue-card-title">
              {formatCurrency(unencumberedLiquidity)} 100% Libre
            </h3>
            <p className="queue-card-desc">
              El {liquidityRatio.toFixed(0)}% de tu capital está completamente blindado sin gravámenes de pasivos. Tienes solvencia para destinar excedente al fondo FIRE.
            </p>
            <div className="queue-card-footer">
              <span className="queue-cta-link">
                <span>Ver Metas de Ahorro</span>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* Action 3: Savings Target Milestone */}
          <div
            className="ramp-queue-card"
            onClick={() => {
              triggerHaptic('light')
              onNavigateTab && onNavigateTab('incomes')
            }}
          >
            <div className="queue-card-badge purple">
              <Target size={14} />
              <span>Tasa de Retención {savingRate.toFixed(1)}%</span>
            </div>
            <h3 className="queue-card-title">
              {savingRate >= 30 ? 'Desempeño Institucional Óptimo' : 'Capacidad de Ahorro Moderada'}
            </h3>
            <p className="queue-card-desc">
              Superávit operativo de {formatCurrency(balance)} con {pInc.length} abonos. Compromiso de gastos fijos controlado al {totalIn > 0 ? ((fixedExp / totalIn) * 100).toFixed(0) : 0}%.
            </p>
            <div className="queue-card-footer">
              <span className="queue-cta-link">
                <span>Supervisar Ingresos</span>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ── 4. FLUID CAPITAL ARCHITECTURE SPECTRUM ── */}
      <div className="fluid-spectrum-panel">
        <div className="spectrum-header">
          <div>
            <div className="spectrum-title">Arquitectura de Capital & Cobertura</div>
            <div className="spectrum-sub">Distribución proporcional entre activos libres, compromisos fijos y pasivos</div>
          </div>
          <div className="spectrum-coverage-chip">
            <span className="coverage-label">Cobertura de Pasivos:</span>
            <strong className="coverage-val text-emerald">{debtCoverage === 'Sin deuda' ? '100%' : `${debtCoverage}x`}</strong>
          </div>
        </div>

        {/* The Multi-Tier Spectrum Bar */}
        <div className="spectrum-bar-track">
          <div
            className="spectrum-slice free"
            style={{ width: `${Math.max(5, freeCapPct)}%` }}
            title={`Capital Libre: ${formatCurrency(unencumberedLiquidity)} (${freeCapPct.toFixed(1)}%)`}
          />
          <div
            className="spectrum-slice fixed"
            style={{ width: `${Math.max(3, fixedCommitPct)}%` }}
            title={`Compromisos Fijos: ${formatCurrency(fixedExp)} (${fixedCommitPct.toFixed(1)}%)`}
          />
          <div
            className="spectrum-slice debt"
            style={{ width: `${Math.max(3, debtPct)}%` }}
            title={`Pasivos Tarjetas: ${formatCurrency(creditSummary.totalDebt)} (${debtPct.toFixed(1)}%)`}
          />
        </div>

        {/* Interactive Legend & Stats */}
        <div className="spectrum-stats-grid">
          <div className="spectrum-stat-item">
            <div className="stat-dot free" />
            <div>
              <div className="stat-name">Capital Libre Inmediato</div>
              <div className="stat-figure text-emerald">{formatCurrency(unencumberedLiquidity)}</div>
              <div className="stat-sub">{liquidityRatio.toFixed(0)}% del total</div>
            </div>
          </div>

          <div className="spectrum-stat-item">
            <div className="stat-dot fixed" />
            <div>
              <div className="stat-name">Compromisos Fijos</div>
              <div className="stat-figure">{formatCurrency(fixedExp)}</div>
              <div className="stat-sub">{totalIn > 0 ? ((fixedExp / totalIn) * 100).toFixed(0) : 0}% de ingresos</div>
            </div>
          </div>

          <div className="spectrum-stat-item">
            <div className="stat-dot debt" />
            <div>
              <div className="stat-name">Pasivos en Tarjetas</div>
              <div className="stat-figure text-rose">{formatCurrency(creditSummary.totalDebt)}</div>
              <div className="stat-sub">{creditSummary.utilizationRate.toFixed(0)}% utilización</div>
            </div>
          </div>

          <div className="spectrum-stat-item">
            <div className="stat-dot gold" />
            <div>
              <div className="stat-name">Límite Total Disponible</div>
              <div className="stat-figure text-gold">{formatCurrency(creditSummary.totalLimit - creditSummary.totalDebt)}</div>
              <div className="stat-sub">{creditCards.length} tarjetas activas</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. SPLIT ANALYTICS: CATEGORY DONUT & PAYMENT CHANNELS ── */}
      <div className="fintech-dual-analytics">
        
        {/* Box A: Gastos por Categoría con Centro Métrico */}
        <div className="analytics-card-vault">
          <div className="card-vault-header">
            <div>
              <div className="card-vault-title">Distribución Categórica</div>
              <div className="card-vault-sub">Egresos del período actual</div>
            </div>
            <span className="card-vault-badge">{pieData.length} categorías</span>
          </div>

          {pieData.length === 0 ? (
            <div className="sandbox-empty">Sin egresos registrados en {formatPeriodLabel(currentPeriod)}</div>
          ) : (
            <div className="donut-master-layout">
              <div className="donut-graphic-area">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={86}
                      paddingAngle={3}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color} stroke="#0E1015" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                      formatter={(val) => [formatCurrency(Number(val) || 0), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-core-metric">
                  <span className="core-amount">${(totalExp / 1000).toFixed(1)}k</span>
                  <span className="core-label">Total Egresos</span>
                </div>
              </div>

              <div className="donut-legend-stream">
                {pieData.slice(0, 5).map((d, i) => (
                  <div key={i} className="donut-legend-row">
                    <span className="legend-indicator" style={{ background: d.color }} />
                    <span className="legend-category-name">{d.name}</span>
                    <strong className="legend-category-amount">{formatCurrency(d.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Box B: Canales de Pago & Consumo */}
        <div className="analytics-card-vault">
          <div className="card-vault-header">
            <div>
              <div className="card-vault-title">Canales de Liquidación</div>
              <div className="card-vault-sub">Desglose por método de pago</div>
            </div>
            <span className="card-vault-badge">4 canales</span>
          </div>

          <div className="payment-channels-stream">
            {paymentMethodsList.map((pm, i) => {
              const pct = totalExp > 0 ? (pm.amount / totalExp) * 100 : 0
              return (
                <div key={i} className="channel-bar-group">
                  <div className="channel-bar-header">
                    <span className="channel-name" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ color: pm.color }}>{pm.icon}</span>
                      {pm.name}
                    </span>
                    <strong className="channel-amount">{formatCurrency(pm.amount)}</strong>
                  </div>
                  <div className="channel-track">
                    <div
                      className="channel-fill"
                      style={{ width: `${Math.min(100, pct)}%`, background: pm.color }}
                    />
                  </div>
                  <div className="channel-footer">
                    <span>Participación</span>
                    <span>{pct.toFixed(1)}% del egreso</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ── 6. CERTIFIED TRANSACTIONS FEED (RAMP DATA STREAM) ── */}
      <div className="transactions-stream-panel">
        <div className="stream-panel-header">
          <div>
            <div className="stream-title">Flujo de Movimientos Certificados</div>
            <div className="stream-sub">Últimas transacciones sincronizadas con hash de integridad en {formatPeriodLabel(currentPeriod)}</div>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              className="stream-view-all"
              onClick={() => onNavigateTab('expenses')}
              title="Ver todos los movimientos"
            >
              <span>Ver Libro Completo</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {recentTx.length === 0 ? (
          <div className="sandbox-empty">No hay transacciones registradas en este período.</div>
        ) : (
          <div className="stream-table-container">
            <table className="stream-table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>CONCEPTO / ITEM</th>
                  <th>TIPO</th>
                  <th style={{ textAlign: 'right' }}>TOTAL</th>
                  <th style={{ textAlign: 'center', width: 44 }}>IR</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map((tx, idx) => {
                  const isInc = tx.kind === 'income'
                  return (
                    <tr key={idx} className="stream-table-row">
                      <td className="stream-date">{tx.date}</td>
                      <td className="stream-concept">
                        <span className="concept-text">{tx.description}</span>
                      </td>
                      <td>
                        <span className={`stream-pill ${tx.typePillClass}`}>
                          {tx.tag}
                        </span>
                      </td>
                      <td className={`stream-total ${isInc ? 'text-emerald' : 'text-rose'}`} style={{ textAlign: 'right' }}>
                        {isInc ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="stream-row-action"
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

      {/* ── 7. MODAL DE CUMPLIMIENTO Y NORMATIVAS GLOBALES DE IA ── */}
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
                className="action-capsule-gold"
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
