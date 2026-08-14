import {
  BrainCircuit,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard as CardIcon,
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
  // Datos del período actual
  const pInc   = incomes.filter(i => i.period === currentPeriod)
  const pExp   = expenses.filter(e => e.period === currentPeriod)
  const pCash  = cashWithdrawals.filter(c => c.period === currentPeriod)

  const totalIncome   = pInc.reduce((s, i) => s + i.amount, 0)
  const totalExpense  = pExp.reduce((s, e) => s + e.amount, 0)
  const totalCash     = pCash.reduce((s, c) => s + c.amount, 0)
  const balance       = totalIncome - totalExpense
  const savingsRate   = totalIncome > 0 ? (balance / totalIncome) * 100 : 0
  const fixedExp      = pExp.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const varExp        = pExp.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)
  const fixedPct      = totalIncome > 0 ? (fixedExp / totalIncome) * 100 : 0
  const cashPct       = totalExpense > 0 ? (totalCash / totalExpense) * 100 : 0
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
  const projectedBalance = totalIncome - projectedMonthExpense

  // Diagnóstico de Crédito
  const creditSummary = getConsolidatedCreditSummary(creditCards, creditTransactions)

  // Simulador (+10% Ingreso)
  const increaseIncome = totalIncome * 1.1
  const balanceIfIncrease = increaseIncome - totalExpense
  const savingsIfIncrease = increaseIncome > 0 ? (balanceIfIncrease / increaseIncome) * 100 : 0

  // Veredicto de Inversión
  const cautious  = savingsRate >= 10 && savingsRate < 20
  const noInvest  = savingsRate < 10 || balance <= 0

  const verdictClass = noInvest ? 'no' : cautious ? 'caution' : 'yes'
  const verdictText  = noInvest
    ? 'No es el momento ideal para invertir'
    : cautious
    ? 'Posición cauta — invierte con límite'
    : '¡Posición sólida para invertir!'
  const verdictDesc  = noInvest
    ? `Con una tasa de ahorro del ${savingsRate.toFixed(1)}%, primero consolida un fondo de emergencia de 3 meses antes de asumir riesgo de inversión.`
    : cautious
    ? `Tu tasa de ahorro del ${savingsRate.toFixed(1)}% es correcta pero mejorable. Puedes destinar hasta ${formatCurrency(balance * 0.3)} a inversión conservadora manteniendo liquidez.`
    : `Tu tasa de ahorro del ${savingsRate.toFixed(1)}% es excelente. Puedes destinar ${formatCurrency(balance * 0.4)} a inversión sin comprometer tu estabilidad.`

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Asesor IA</span></div>
        <h1 className="page-title">Análisis Inteligente y Comparativas</h1>
      </div>

      {/* Month-over-Month Comparative Insight Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.08) 0%, rgba(20, 20, 28, 0.8) 100%)',
        border: '1px solid rgba(201, 168, 76, 0.25)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(201,168,76,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C9A84C'
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
              Diagnóstico Comparativo: {formatPeriodLabel(currentPeriod)} vs. {formatPeriodLabel(prevPeriod)}
            </div>
            <div style={{ fontSize: 11.5, color: '#888898', marginTop: 2 }}>
              Evolución patrimonial y ritmo de consumo contra el mes inmediatamente anterior.
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 4 }}>
          {/* Income Comparison */}
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(26,26,36,0.6)', border: '1px solid #2A2A38' }}>
            <div style={{ fontSize: 11, color: '#888898', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Ingresos vs. Mes Anterior</span>
              {incDiff >= 0 ? <TrendingUp size={13} style={{ color: '#34D399' }} /> : <TrendingDown size={13} style={{ color: '#F87171' }} />}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: incDiff >= 0 ? '#34D399' : '#F87171', marginTop: 4 }}>
              {incDiff >= 0 ? '+' : ''}{formatCurrency(incDiff)} ({incPctDiff >= 0 ? '+' : ''}{incPctDiff.toFixed(1)}%)
            </div>
            <div style={{ fontSize: 10.5, color: '#717182', marginTop: 2 }}>
              {prevTotalIncome > 0 ? `Mes anterior: ${formatCurrency(prevTotalIncome)}` : 'Primer período'}
            </div>
          </div>

          {/* Expense Comparison */}
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(26,26,36,0.6)', border: '1px solid #2A2A38' }}>
            <div style={{ fontSize: 11, color: '#888898', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Gastos vs. Mes Anterior</span>
              {expDiff <= 0 ? <TrendingDown size={13} style={{ color: '#34D399' }} /> : <TrendingUp size={13} style={{ color: '#F87171' }} />}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: expDiff <= 0 ? '#34D399' : '#F87171', marginTop: 4 }}>
              {expDiff >= 0 ? '+' : ''}{formatCurrency(expDiff)} ({expPctDiff >= 0 ? '+' : ''}{expPctDiff.toFixed(1)}%)
            </div>
            <div style={{ fontSize: 10.5, color: '#717182', marginTop: 2 }}>
              {expDiff <= 0 ? '✓ Reducción de gastos lograda' : '⚠️ Incremento en el nivel de egresos'}
            </div>
          </div>

          {/* Savings Rate Comparison */}
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(26,26,36,0.6)', border: '1px solid #2A2A38' }}>
            <div style={{ fontSize: 11, color: '#888898', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Tasa de Ahorro</span>
              <span>{savingsRate.toFixed(1)}%</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: savingsRate >= prevSavingsRate ? '#34D399' : '#FBBF24', marginTop: 4 }}>
              {savingsRate >= prevSavingsRate ? '+' : ''}{(savingsRate - prevSavingsRate).toFixed(1)}% de variación
            </div>
            <div style={{ fontSize: 10.5, color: '#717182', marginTop: 2 }}>
              {prevSavingsRate > 0 ? `Mes anterior fue ${prevSavingsRate.toFixed(1)}%` : 'Sin base previa'}
            </div>
          </div>
        </div>
      </div>

      <div className="advisor-grid">
        {/* === LEFT PANEL === */}
        <div className="advisor-panel">
          <div className="advisor-tag">
            <BrainCircuit size={12} /> DIAGNÓSTICO FINANCIERO
          </div>
          <div className="advisor-title">Salud y Control Patrimonial</div>

          {/* Savings rate */}
          <div className="diag-section">
            <div className="diag-label">
              Tasa de Ahorro
              <span className={`diag-val ${savingsRate >= 20 ? 'green' : ''}`}>{savingsRate.toFixed(1)}%</span>
            </div>
            <ProgressBar value={savingsRate} max={40} color={savingsRate >= 20 ? '' : 'gold'} />
            <div className="diag-desc">
              {savingsRate >= 20
                ? 'Excelente. Estás por encima del umbral mínimo recomendado (20%) para construir riqueza.'
                : savingsRate >= 10
                ? 'Correcta pero mejorable. El estándar financiero recomienda al menos 20% de ahorro mensual.'
                : 'Crítica. Debes reducir gastos variables o aumentar ingresos antes de pensar en inversión.'}
            </div>
          </div>

          {/* Fixed expenses ratio */}
          <div className="diag-section">
            <div className="diag-label">
              Compromisos Fijos / Ingreso
              <span className="diag-val">{fixedPct.toFixed(0)}%</span>
            </div>
            <ProgressBar value={fixedPct} max={60} color={fixedPct > 50 ? '' : 'gold'} />
            <div className="diag-desc">
              {fixedPct > 50
                ? 'Tus gastos fijos consumen más del 50% del ingreso. Esto limita tu flexibilidad financiera.'
                : 'Nivel aceptable. Mantener los fijos por debajo del 50% del ingreso es la regla general.'}
            </div>
          </div>

          {/* Credit Card Utilization Ratio */}
          {creditCards.length > 0 && (
            <div className="diag-section">
              <div className="diag-label">
                Utilización de Tarjetas de Crédito
                <span className={`diag-val ${creditSummary.utilizationRate <= 30 ? 'green' : ''}`}>
                  {creditSummary.utilizationRate.toFixed(1)}%
                </span>
              </div>
              <ProgressBar
                value={creditSummary.utilizationRate}
                max={100}
                color={creditSummary.utilizationRate > 50 ? '' : creditSummary.utilizationRate > 30 ? 'gold' : ''}
              />
              <div className="diag-desc">
                {creditSummary.utilizationRate <= 30
                  ? '✓ Excelente. Mantener la utilización por debajo del 30% protege tu score crediticio bancario.'
                  : creditSummary.utilizationRate <= 50
                  ? '⚠️ Precaución. Estás utilizando entre el 30% y 50% de tu línea de crédito. Procura abonar al capital.'
                  : '🚨 Crítico. Tu endeudamiento en tarjetas supera el 50% del límite total. Prioriza liquidar deudas de tarjeta de crédito.'}
              </div>
            </div>
          )}

          {/* Cash risk */}
          <div className="diag-section">
            <div className="diag-label">
              Uso de Efectivo
              <span className="diag-val">{cashPct.toFixed(0)}% de gastos</span>
            </div>
            <ProgressBar value={cashPct} max={40} color={cashPct > 25 ? '' : 'gold'} />
            <div className="diag-desc">
              El efectivo es el método menos trazable. Mantenerlo por debajo del 25% facilita el seguimiento financiero exacto.
            </div>
            {(unassignedCash.length > 0 || cashPct > 25) && (
              <div className="alert-pill">
                <span className="alert-icon">⚠️</span>
                <div className="alert-text">
                  {unassignedCash.length > 0
                    ? `Tienes ${unassignedCash.length} retiro${unassignedCash.length > 1 ? 's' : ''} sin destino asignado (${formatCurrency(unassignedCash.reduce((s, c) => s + c.amount, 0))}). Son un punto ciego en tus finanzas.`
                    : `El ${cashPct.toFixed(0)}% de tus gastos es en efectivo. Considera usar más métodos digitales.`}
                </div>
              </div>
            )}
          </div>

          {/* Verdict */}
          <div className="verdict-card">
            <div className={`verdict-badge ${verdictClass}`}>
              {verdictClass === 'yes' ? '✓ INVERTIR' : verdictClass === 'caution' ? '⚠ CON CAUTELA' : '✕ NO INVERTIR'}
            </div>
            <div className="verdict-title">{verdictText}</div>
            <div className="verdict-desc">{verdictDesc}</div>
            {totalIncome > 0 && (
              <div className="verdict-tip">
                💡 Balance disponible: <strong style={{ color: '#C9A84C' }}>{formatCurrency(balance)}</strong> ·
                Fondo de emergencia meta (3 meses): <strong style={{ color: '#F1D97E' }}>{formatCurrency(totalExpense * 3)}</strong>.
              </div>
            )}
          </div>
        </div>

        {/* === RIGHT PANEL === */}
        <div className="advisor-panel">
          <div className="advisor-tag">
            <Sparkles size={12} /> ESTRATEGIAS & PROYECCIONES
          </div>
          <div className="advisor-title">Proyección de Cierre y Reglas</div>

          <div className="criteria-cards">
            {/* Calendar Projections */}
            {monthProgress.isCurrentMonth && (
              <div className="criteria-card">
                <div className="criteria-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} style={{ color: '#C9A84C' }} />
                  <span>Proyección Fin de Mes (Día {monthProgress.currentDay}/{monthProgress.totalDays})</span>
                </div>
                <div className="criteria-desc">
                  Al ritmo actual (<strong>{formatCurrency(dailyBurnRate)}/día</strong>), proyectas cerrar este ciclo con{' '}
                  <strong style={{ color: '#F87171' }}>{formatCurrency(projectedMonthExpense)}</strong> en gastos.{' '}
                  {projectedBalance >= 0 ? (
                    <span style={{ color: '#34D399' }}>Tendrías un excedente libre estimado de {formatCurrency(projectedBalance)}.</span>
                  ) : (
                    <span style={{ color: '#F87171' }}>Entrarías en déficit de {formatCurrency(Math.abs(projectedBalance))}. ¡Modera egresos variables!</span>
                  )}
                </div>
              </div>
            )}

            {/* 50/30/20 Rule */}
            <div className="criteria-card">
              <div className="criteria-name">Regla Patrimonial 50/30/20</div>
              <div className="criteria-desc">
                50% necesidades · 30% deseos · 20% ahorro.<br />
                Tu distribución actual:{' '}
                <span className={`${fixedPct <= 50 ? 'highlight' : ''}`}>
                  {fixedPct.toFixed(0)}%
                </span> fijos,{' '}
                {totalIncome > 0 ? ((varExp / totalIncome) * 100).toFixed(0) : 0}% variables,{' '}
                <span className={`${savingsRate >= 20 ? 'highlight' : ''}`}>
                  {savingsRate.toFixed(0)}%
                </span> ahorro.
              </div>
            </div>

            {/* Credit Card Smart Rules */}
            {creditCards.length > 0 && (
              <div className="criteria-card">
                <div className="criteria-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CardIcon size={14} style={{ color: '#C9A84C' }} />
                  <span>Estrategia de Tarjetas de Crédito</span>
                </div>
                <div className="criteria-desc">
                  Tienes <strong>{creditCards.length} tarjeta{creditCards.length > 1 ? 's' : ''}</strong> con límite consolidado de {formatCurrency(creditSummary.totalLimit)}.<br />
                  💡 <strong>Regla de oro:</strong> Paga siempre el monto total facturado de contado antes del día límite para aprovechar financiamiento a costo cero (0% interés).
                </div>
              </div>
            )}

            {/* Simulation +10% */}
            <div className="criteria-card">
              <div className="criteria-name">Simulación: +10% de Ingreso</div>
              <div className="criteria-desc">
                Si tu ingreso subiera a <strong style={{ color: '#C9A84C' }}>{formatCurrency(increaseIncome)}</strong>,
                tu ahorro neto sería <strong style={{ color: '#34D399' }}>{formatCurrency(balanceIfIncrease)}</strong> (
                <strong style={{ color: '#34D399' }}>{savingsIfIncrease.toFixed(1)}%</strong> de retención).
              </div>
            </div>
          </div>

          {/* Risk alert if any */}
          {unassignedCash.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="advisor-tag">
                <ShieldAlert size={12} /> ALERTA DE RIESGO
              </div>
              <div className="alert-pill" style={{ marginTop: 8 }}>
                <span className="alert-icon">🚨</span>
                <div className="alert-text">
                  <strong>Retiros sin destino detectados:</strong><br />
                  {unassignedCash.map(c => `${formatCurrency(c.amount)} el ${c.date}`).join(' · ')}.
                  Asigna siempre una categoría para evitar fugas de capital.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

