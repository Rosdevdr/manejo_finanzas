import { useState } from 'react'
import './SmartAnalysisPanel.css'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard as CardIcon,
  Home,
  Briefcase,
  Lightbulb,
  ShieldCheck,
  Zap,
  BarChart3,
} from 'lucide-react'
import type { Income, Expense, CashWithdrawal, CreditCard, CreditCardTransaction } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { getPreviousPeriod, getMonthProgress, formatPeriodLabel } from '../../utils/calendar'
import { getConsolidatedCreditSummary } from '../../utils/creditAdvisor'

interface SmartAnalysisPanelProps {
  currentPeriod:       string
  incomes:             Income[]
  expenses:            Expense[]
  cashWithdrawals:     CashWithdrawal[]
  creditCards?:        CreditCard[]
  creditTransactions?: CreditCardTransaction[]
}

function ProgressBar({ value, max, color = 'gold' }: { value: number; max: number; color?: string }) {
  const pct = Math.min((value / (max || 1)) * 100, 100)
  return (
    <div className="progress-bar">
      <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function SmartAnalysisPanel({
  currentPeriod,
  incomes,
  expenses,
  cashWithdrawals,
  creditCards = [],
  creditTransactions = [],
}: SmartAnalysisPanelProps) {
  const [profileMode, setProfileMode] = useState<'personal' | 'business'>('personal')

  // Datos del período actual
  const pInc   = incomes.filter(i => i.period === currentPeriod)
  const pExp   = expenses.filter(e => e.period === currentPeriod)
  const pCash  = cashWithdrawals.filter(c => c.period === currentPeriod)

  const totalIncome   = pInc.reduce((s, i) => s + i.amount, 0)
  const totalExpense  = pExp.reduce((s, e) => s + e.amount, 0)
  const balance       = totalIncome - totalExpense
  const savingsRate   = totalIncome > 0 ? (balance / totalIncome) * 100 : 0
  const fixedExp      = pExp.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const varExp        = pExp.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)
  const fixedPct      = totalIncome > 0 ? (fixedExp / totalIncome) * 100 : 0
  const varPct        = totalIncome > 0 ? (varExp / totalIncome) * 100 : 0
  const unassignedCash = pCash.filter(c => c.reason === 'unassigned')

  // Datos del período anterior para análisis comparativo
  const prevPeriod = getPreviousPeriod(currentPeriod)
  const prevInc = incomes.filter(i => i.period === prevPeriod)
  const prevExp = expenses.filter(e => e.period === prevPeriod)
  const prevTotalIncome = prevInc.reduce((s, i) => s + i.amount, 0)
  const prevTotalExpense = prevExp.reduce((s, e) => s + e.amount, 0)
  const prevBalance = prevTotalIncome - prevTotalExpense
  const prevSavingsRate = prevTotalIncome > 0 ? (prevBalance / prevTotalIncome) * 100 : 0

  const incDiff = totalIncome - prevTotalIncome
  const expDiff = totalExpense - prevTotalExpense
  const incPctDiff = prevTotalIncome > 0 ? (incDiff / prevTotalIncome) * 100 : 0
  const expPctDiff = prevTotalExpense > 0 ? (expDiff / prevTotalExpense) * 100 : 0

  // Diagnóstico del Calendario & Proyecciones
  const monthProgress = getMonthProgress(currentPeriod)
  const dailyBurnRate = monthProgress.currentDay > 0 ? totalExpense / monthProgress.currentDay : 0
  const projectedMonthExpense = dailyBurnRate * monthProgress.totalDays

  // Diagnóstico de Crédito
  const creditSummary = getConsolidatedCreditSummary(creditCards, creditTransactions)

  // Veredicto amigable
  const isHealthy = savingsRate >= 20 && balance > 0
  const isModerate = savingsRate >= 5 && savingsRate < 20
  const isAlert = savingsRate < 5 || balance <= 0

  return (
    <div className="fade-in analysis-container">
      {/* Page Header */}
      <div className="page-header analysis-header">
        <div>
          <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Asesor Financiero IA</span></div>
          <h1 className="page-title">Diagnóstico & Recomendaciones Inteligentes</h1>
        </div>

        {/* Dual Mode Switcher (Personal vs Emprendedor) */}
        <div className="analysis-mode-switcher">
          <button
            type="button"
            onClick={() => setProfileMode('personal')}
            className={`analysis-mode-btn ${profileMode === 'personal' ? 'active' : ''}`}
          >
            <Home size={14} />
            <span>Finanzas Personales</span>
          </button>
          <button
            type="button"
            onClick={() => setProfileMode('business')}
            className={`analysis-mode-btn ${profileMode === 'business' ? 'active' : ''}`}
          >
            <Briefcase size={14} />
            <span>Visión Emprendedor</span>
          </button>
        </div>
      </div>

      {/* Mode Orientation Banner */}
      <div className="analysis-orientation-banner">
        <div className="analysis-banner-left">
          <div className="analysis-banner-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="analysis-banner-title">
              {profileMode === 'personal' ? 'Enfoque: Salud Financiera del Hogar y Tranquilidad Personal' : 'Enfoque: Gestión de Negocio, Proyectos y Flujo de Caja'}
            </div>
            <div className="analysis-banner-subtitle">
              {profileMode === 'personal'
                ? 'Consejos directos y sin tecnicismos para que tu dinero rinda más y ahorres con seguridad.'
                : 'Métricas prácticas para controlar tus ingresos variables, márgenes y reinversión de proyectos.'}
            </div>
          </div>
        </div>
      </div>

      {/* Month-over-Month Comparative Insight Card */}
      <div className="analysis-comparative-card">
        <div className="analysis-comparative-header">
          <BarChart3 size={15} />
          <span>Comparativa: {formatPeriodLabel(currentPeriod)} vs. {formatPeriodLabel(prevPeriod)}</span>
        </div>

        <div className="analysis-comparative-grid">
          {/* Income Comparison */}
          <div className="analysis-metric-box">
            <div className="analysis-metric-top">
              <span>Tus Ingresos</span>
              {incDiff >= 0 ? <TrendingUp size={13} style={{ color: 'var(--emerald-success)' }} /> : <TrendingDown size={13} style={{ color: 'var(--rose-danger)' }} />}
            </div>
            <div className="analysis-metric-val" style={{ color: incDiff >= 0 ? '#34D399' : '#F87171' }}>
              {incDiff >= 0 ? '+' : ''}{formatCurrency(incDiff)} ({incPctDiff >= 0 ? '+' : ''}{incPctDiff.toFixed(1)}%)
            </div>
            <div className="analysis-metric-sub">
              {prevTotalIncome > 0 ? `Mes ant: ${formatCurrency(prevTotalIncome)}` : 'Primer mes'}
            </div>
          </div>

          {/* Expense Comparison */}
          <div className="analysis-metric-box">
            <div className="analysis-metric-top">
              <span>Tus Gastos</span>
              {expDiff <= 0 ? <TrendingDown size={13} style={{ color: 'var(--emerald-success)' }} /> : <TrendingUp size={13} style={{ color: 'var(--rose-danger)' }} />}
            </div>
            <div className="analysis-metric-val" style={{ color: expDiff <= 0 ? '#34D399' : '#F87171' }}>
              {expDiff >= 0 ? '+' : ''}{formatCurrency(expDiff)} ({expPctDiff >= 0 ? '+' : ''}{expPctDiff.toFixed(1)}%)
            </div>
            <div className="analysis-metric-sub">
              {expDiff <= 0 ? 'Gastaste menos que el mes pasado' : 'Aumentaron tus gastos'}
            </div>
          </div>

          {/* Savings Rate Comparison */}
          <div className="analysis-metric-box">
            <div className="analysis-metric-top">
              <span>Tasa de Ahorro</span>
              <span>{savingsRate.toFixed(1)}%</span>
            </div>
            <div className="analysis-metric-val" style={{ color: savingsRate >= prevSavingsRate ? '#34D399' : '#FBBF24' }}>
              {savingsRate >= prevSavingsRate ? '+' : ''}{(savingsRate - prevSavingsRate).toFixed(1)}% de cambio
            </div>
            <div className="analysis-metric-sub">
              {prevSavingsRate > 0 ? `Mes ant: ${prevSavingsRate.toFixed(1)}%` : 'Sin datos previos'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Actionable Cards */}
      <div className="analysis-cards-grid">
        {/* Card 1: Diagnóstico Central */}
        <div className="analysis-advisor-card">
          <div className="analysis-card-header">
            <ShieldCheck size={18} style={{ color: isHealthy ? '#34D399' : isModerate ? '#FBBF24' : '#F87171' }} />
            <div className="analysis-card-title">Diagnóstico de Tu Dinero</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Porcentaje de Ahorro del Mes:</span>
              <strong style={{ color: isHealthy ? '#34D399' : isModerate ? '#FBBF24' : '#F87171' }}>{savingsRate.toFixed(1)}%</strong>
            </div>
            <ProgressBar value={savingsRate} max={30} color={isHealthy ? 'emerald' : isModerate ? 'gold' : 'red'} />
          </div>

          <div className="analysis-advice-box">
            {isHealthy && 'Excelente trabajo. Estás ahorrando más del 20% de tus ingresos, lo que te otorga un sólido respaldo para imprevistos y metas.'}
            {isModerate && 'Buen progreso, pero con margen de mejora. Ajustar pequeños consumos variables te permitirá alcanzar el 20% de ahorro recomendado.'}
            {isAlert && 'Atención: Tu tasa de ahorro es reducida o los egresos superan los ingresos este mes. Conviene revisar gastos variables para restablecer el balance.'}
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Gastos Fijos (Innegociables):</span>
              <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(fixedExp)} ({fixedPct.toFixed(0)}%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Gastos Variables (Día a Día):</span>
              <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(varExp)} ({varPct.toFixed(0)}%)</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Recomendación Práctica Inmediata */}
        <div className="analysis-advisor-card">
          <div className="analysis-card-header">
            <Lightbulb size={18} style={{ color: 'var(--gold-hover)' }} />
            <div className="analysis-card-title">Recomendaciones Prácticas</div>
          </div>

          {profileMode === 'personal' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Zap size={15} style={{ color: 'var(--gold-hover)', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Regla de 72 horas:</strong> Antes de compras no esenciales, espera 3 días para evaluar si realmente lo necesitas.</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Zap size={15} style={{ color: 'var(--emerald-success)', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Fondo de Paz Mental:</strong> Destina siempre los primeros RD$2,000 o RD$5,000 a tu meta de emergencia nada más cobrar.</span>
              </div>
              {unassignedCash.length > 0 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: 'var(--amber-warning)' }}>
                  <Zap size={15} style={{ color: 'var(--amber-warning)', flexShrink: 0, marginTop: 2 }} />
                  <span>Tienes <strong>{unassignedCash.length} retiros de efectivo</strong> sin asignar motivo. ¡Asígnale categoría para no perder el rastro!</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Zap size={15} style={{ color: 'var(--gold-hover)', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Separación de Cuentas:</strong> Asigna un sueldo fijo personal y evita mezclar finanzas personales con proyectos de negocio.</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Zap size={15} style={{ color: 'var(--emerald-success)', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Colchón Operativo:</strong> Reserva entre el 15% y 20% de cada cobro para imprevistos operativos o contingencias.</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Zap size={15} style={{ color: '#60A5FA', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Cobros Pendientes:</strong> Monitorea tus fechas estimadas de cobro para evitar baches de liquidez a 30 días.</span>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Proyección del Mes & Calendario */}
        <div className="analysis-advisor-card">
          <div className="analysis-card-header">
            <Calendar size={18} style={{ color: '#60A5FA' }} />
            <div className="analysis-card-title">Ritmo de Gastos del Mes</div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 8px 0' }}>
              Día <strong>{monthProgress.currentDay} de {monthProgress.totalDays}</strong> ({monthProgress.percentPassed}% del mes transcurrido).
            </p>
            <div className="analysis-daily-burn-box">
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gasto Promedio Diario:</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold-hover)', fontFamily: 'Space Mono' }}>
                {formatCurrency(dailyBurnRate)} / día
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Al ritmo actual, proyectas cerrar el mes con un gasto estimado de <strong>{formatCurrency(projectedMonthExpense)}</strong>.
            </div>
          </div>
        </div>

        {/* Card 4: Salud de Tarjetas de Crédito */}
        <div className="analysis-advisor-card">
          <div className="analysis-card-header">
            <CardIcon size={18} style={{ color: creditSummary.utilizationRate > 30 ? '#F87171' : '#34D399' }} />
            <div className="analysis-card-title">Salud de Tarjetas de Crédito</div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Deuda Actual Acumulada:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(creditSummary.totalDebt)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: 'var(--text-muted)' }}>Cupo Utilizado:</span>
              <strong style={{ color: creditSummary.utilizationRate > 30 ? '#F87171' : '#34D399' }}>
                {creditSummary.utilizationRate.toFixed(1)}% (Límite sano: &lt;30%)
              </strong>
            </div>
            <ProgressBar value={creditSummary.utilizationRate} max={100} color={creditSummary.utilizationRate > 30 ? 'red' : 'emerald'} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              {creditSummary.utilizationRate <= 30
                ? 'Tu nivel de endeudamiento en tarjetas es óptimo para tu historial crediticio.'
                : 'Superas el 30% de uso de tus tarjetas. Procura liquidar el balance al corte para evitar cargos.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

