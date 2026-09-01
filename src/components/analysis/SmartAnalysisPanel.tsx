import { useState } from 'react'
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
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Asesor Financiero IA</span></div>
          <h1 className="page-title">Diagnóstico & Recomendaciones Inteligentes</h1>
        </div>

        {/* Dual Mode Switcher (Personal vs Emprendedor) */}
        <div style={{
          display: 'flex',
          background: '#14141E',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          padding: 4,
          gap: 4,
        }}>
          <button
            type="button"
            onClick={() => setProfileMode('personal')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: profileMode === 'personal' ? 'linear-gradient(135deg, #F3CA65 0%, #C9A84C 100%)' : 'transparent',
              color: profileMode === 'personal' ? '#0B0B0F' : '#9CA3AF',
            }}
          >
            <Home size={14} />
            <span>Finanzas Personales</span>
          </button>
          <button
            type="button"
            onClick={() => setProfileMode('business')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: profileMode === 'business' ? 'linear-gradient(135deg, #F3CA65 0%, #C9A84C 100%)' : 'transparent',
              color: profileMode === 'business' ? '#0B0B0F' : '#9CA3AF',
            }}
          >
            <Briefcase size={14} />
            <span>Visión Emprendedor</span>
          </button>
        </div>
      </div>

      {/* Mode Orientation Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.08) 0%, rgba(20, 20, 28, 0.85) 100%)',
        border: '1px solid rgba(201, 168, 76, 0.25)',
        borderRadius: 14,
        padding: '12px 18px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={18} style={{ color: '#F3CA65' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
              {profileMode === 'personal' ? 'Enfoque: Salud Financiera del Hogar y Tranquilidad Personal' : 'Enfoque: Gestión de Negocio, Proyectos y Flujo de Caja'}
            </div>
            <div style={{ fontSize: 11.5, color: '#888898', marginTop: 1 }}>
              {profileMode === 'personal'
                ? 'Consejos directos y sin tecnicismos para que tu dinero rinda más y ahorres con seguridad.'
                : 'Métricas prácticas para controlar tus ingresos variables, márgenes y reinversión de proyectos.'}
            </div>
          </div>
        </div>
      </div>

      {/* Month-over-Month Comparative Insight Card */}
      <div style={{
        background: '#12121A',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F3CA65', marginBottom: 12 }}>
          📊 Comparativa: {formatPeriodLabel(currentPeriod)} vs. {formatPeriodLabel(prevPeriod)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {/* Income Comparison */}
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: '#888898', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Tus Ingresos</span>
              {incDiff >= 0 ? <TrendingUp size={13} style={{ color: '#34D399' }} /> : <TrendingDown size={13} style={{ color: '#F87171' }} />}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: incDiff >= 0 ? '#34D399' : '#F87171', marginTop: 4 }}>
              {incDiff >= 0 ? '+' : ''}{formatCurrency(incDiff)} ({incPctDiff >= 0 ? '+' : ''}{incPctDiff.toFixed(1)}%)
            </div>
            <div style={{ fontSize: 10.5, color: '#717182', marginTop: 2 }}>
              {prevTotalIncome > 0 ? `Mes ant: ${formatCurrency(prevTotalIncome)}` : 'Primer mes'}
            </div>
          </div>

          {/* Expense Comparison */}
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: '#888898', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Tus Gastos</span>
              {expDiff <= 0 ? <TrendingDown size={13} style={{ color: '#34D399' }} /> : <TrendingUp size={13} style={{ color: '#F87171' }} />}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: expDiff <= 0 ? '#34D399' : '#F87171', marginTop: 4 }}>
              {expDiff >= 0 ? '+' : ''}{formatCurrency(expDiff)} ({expPctDiff >= 0 ? '+' : ''}{expPctDiff.toFixed(1)}%)
            </div>
            <div style={{ fontSize: 10.5, color: '#717182', marginTop: 2 }}>
              {expDiff <= 0 ? '✓ Gastaste menos que el mes pasado' : '⚠️ Aumentaron tus gastos'}
            </div>
          </div>

          {/* Savings Rate Comparison */}
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: '#888898', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Tasa de Ahorro</span>
              <span>{savingsRate.toFixed(1)}%</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: savingsRate >= prevSavingsRate ? '#34D399' : '#FBBF24', marginTop: 4 }}>
              {savingsRate >= prevSavingsRate ? '+' : ''}{(savingsRate - prevSavingsRate).toFixed(1)}% de cambio
            </div>
            <div style={{ fontSize: 10.5, color: '#717182', marginTop: 2 }}>
              {prevSavingsRate > 0 ? `Mes ant: ${prevSavingsRate.toFixed(1)}%` : 'Sin datos previos'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Actionable Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Card 1: Diagnóstico Central */}
        <div className="advisor-panel" style={{ background: '#12121A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ShieldCheck size={18} style={{ color: isHealthy ? '#34D399' : isModerate ? '#FBBF24' : '#F87171' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Diagnóstico de Tu Dinero</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#888898' }}>Porcentaje de Ahorro del Mes:</span>
              <strong style={{ color: isHealthy ? '#34D399' : isModerate ? '#FBBF24' : '#F87171' }}>{savingsRate.toFixed(1)}%</strong>
            </div>
            <ProgressBar value={savingsRate} max={30} color={isHealthy ? 'emerald' : isModerate ? 'gold' : 'red'} />
          </div>

          <div style={{ fontSize: 12, lineHeight: 1.5, color: '#D1D5DB', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
            {isHealthy && '🌟 ¡Excelente trabajo! Estás ahorrando más del 20% de tus ingresos. Esto te da gran tranquilidad para imprevistos o metas.'}
            {isModerate && '👍 Vas bien, pero tienes margen de mejora. Intenta recortar pequeños gastos variables para superar el 20% de ahorro.'}
            {isAlert && '⚠️ Cuidado: Este mes tus ahorros son bajos o estás gastando más de lo que ingresas. Revisa tus gastos variables para recuperar balance.'}
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
              <span>Gastos Fijos (Innegociables):</span>
              <strong style={{ color: '#FFF' }}>{formatCurrency(fixedExp)} ({fixedPct.toFixed(0)}%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
              <span>Gastos Variables (Día a Día):</span>
              <strong style={{ color: '#FFF' }}>{formatCurrency(varExp)} ({varPct.toFixed(0)}%)</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Recomendación Práctica Inmediata */}
        <div className="advisor-panel" style={{ background: '#12121A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Lightbulb size={18} style={{ color: '#F3CA65' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Recomendaciones Prácticas</div>
          </div>

          {profileMode === 'personal' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: '#D1D5DB' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Zap size={15} style={{ color: '#F3CA65', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Regla de 72 horas:</strong> Antes de compras no esenciales, espera 3 días para evaluar si realmente lo necesitas.</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Zap size={15} style={{ color: '#34D399', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Fondo de Paz Mental:</strong> Destina siempre los primeros RD$2,000 o RD$5,000 a tu meta de emergencia nada más cobrar.</span>
              </div>
              {unassignedCash.length > 0 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: '#FBBF24' }}>
                  <Zap size={15} style={{ color: '#FBBF24', flexShrink: 0, marginTop: 2 }} />
                  <span>Tienes <strong>{unassignedCash.length} retiros de efectivo</strong> sin asignar motivo. ¡Asígnale categoría para no perder el rastro!</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: '#D1D5DB' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Zap size={15} style={{ color: '#F3CA65', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Separación de Cuentas:</strong> Asigna un "sueldo fijo" personal y no mezcles gastos personales con los de tus proyectos.</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Zap size={15} style={{ color: '#34D399', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Colchón Fiscal y Operativo:</strong> Reserva entre el 15% y 20% de cada cobro para imprevistos operativos o impuestos.</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Zap size={15} style={{ color: '#60A5FA', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Cobros Pendientes:</strong> Monitorea tus fechas estimadas de cobro para evitar baches de liquidez a 30 días.</span>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Proyección del Mes & Calendario */}
        <div className="advisor-panel" style={{ background: '#12121A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Calendar size={18} style={{ color: '#60A5FA' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Ritmo de Gastos del Mes</div>
          </div>

          <div style={{ fontSize: 12, color: '#D1D5DB', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 8px 0' }}>
              Vas en el <strong>día {monthProgress.currentDay} de {monthProgress.totalDays}</strong> ({monthProgress.percentPassed}% del mes transcurrido).
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#888898' }}>Gasto Promedio Diario:</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F3CA65', fontFamily: 'Space Mono' }}>
                {formatCurrency(dailyBurnRate)} / día
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>
              Al ritmo actual, proyectas cerrar el mes con un gasto estimado de <strong>{formatCurrency(projectedMonthExpense)}</strong>.
            </div>
          </div>
        </div>

        {/* Card 4: Salud de Tarjetas de Crédito */}
        <div className="advisor-panel" style={{ background: '#12121A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CardIcon size={18} style={{ color: creditSummary.utilizationRate > 30 ? '#F87171' : '#34D399' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Salud de Tarjetas de Crédito</div>
          </div>

          <div style={{ fontSize: 12, color: '#D1D5DB', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#888898' }}>Deuda Actual Acumulada:</span>
              <strong style={{ color: '#FFF' }}>{formatCurrency(creditSummary.totalDebt)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: '#888898' }}>Cupo Utilizado:</span>
              <strong style={{ color: creditSummary.utilizationRate > 30 ? '#F87171' : '#34D399' }}>
                {creditSummary.utilizationRate}% (Límite sano: &lt;30%)
              </strong>
            </div>
            <ProgressBar value={creditSummary.utilizationRate} max={100} color={creditSummary.utilizationRate > 30 ? 'red' : 'emerald'} />
            <div style={{ fontSize: 11, color: '#888898', marginTop: 8 }}>
              {creditSummary.utilizationRate <= 30
                ? '✓ Tu nivel de endeudamiento en tarjetas es óptimo para tu historial crediticio.'
                : '⚠️ Superas el 30% de uso de tus tarjetas. Paga el balance al corte para evitar intereses.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
