import { BrainCircuit, ShieldAlert, Sparkles } from 'lucide-react'
import type { Income, Expense, CashWithdrawal } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'

interface SmartAnalysisPanelProps {
  currentPeriod:  string
  incomes:        Income[]
  expenses:       Expense[]
  cashWithdrawals: CashWithdrawal[]
}

function ProgressBar({ value, max, color = 'gold' }: { value: number; max: number; color?: string }) {
  const pct = Math.min((value / (max || 1)) * 100, 100)
  return (
    <div className="progress-bar">
      <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function SmartAnalysisPanel({ currentPeriod, incomes, expenses, cashWithdrawals }: SmartAnalysisPanelProps) {
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

  // Simulator state
  const increaseIncome = totalIncome * 1.1
  const balanceIfIncrease = increaseIncome - totalExpense
  const savingsIfIncrease = increaseIncome > 0 ? (balanceIfIncrease / increaseIncome) * 100 : 0

  // Verdict
  const cautious  = savingsRate >= 10 && savingsRate < 20
  const noInvest  = savingsRate < 10 || balance <= 0

  let verdictClass = noInvest ? 'no' : cautious ? 'caution' : 'yes'
  let verdictText  = noInvest
    ? 'No es el momento ideal para invertir'
    : cautious
    ? 'Posición cauta — invierte con límite'
    : '¡Posición sólida para invertir!'
  let verdictDesc  = noInvest
    ? `Con una tasa de ahorro del ${savingsRate.toFixed(1)}%, primero consolida un fondo de emergencia de 3 meses antes de asumir riesgo de inversión.`
    : cautious
    ? `Tu tasa de ahorro del ${savingsRate.toFixed(1)}% es correcta pero mejorable. Puedes destinar hasta ${formatCurrency(balance * 0.3)} a inversión conservadora manteniendo liquidez.`
    : `Tu tasa de ahorro del ${savingsRate.toFixed(1)}% es excelente. Puedes destinar ${formatCurrency(balance * 0.4)} a inversión sin comprometer tu estabilidad.`

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Asesor IA</span></div>
        <h1 className="page-title">Análisis Inteligente</h1>
      </div>

      <div className="advisor-grid">
        {/* === LEFT PANEL === */}
        <div className="advisor-panel">
          <div className="advisor-tag">
            <BrainCircuit size={12} /> DIAGNÓSTICO FINANCIERO
          </div>
          <div className="advisor-title">Tu salud financiera este mes</div>

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

          {/* Cash risk */}
          <div className="diag-section">
            <div className="diag-label">
              Uso de Efectivo
              <span className="diag-val">{cashPct.toFixed(0)}% de gastos</span>
            </div>
            <ProgressBar value={cashPct} max={40} color={cashPct > 25 ? '' : 'gold'} />
            <div className="diag-desc">
              El efectivo es el método menos trazable. Tenerlo por encima del 25% de tus gastos impide análisis precisos.
            </div>
            {(unassignedCash.length > 0 || cashPct > 25) && (
              <div className="alert-pill">
                <span className="alert-icon">⚠️</span>
                <div className="alert-text">
                  {unassignedCash.length > 0
                    ? `Tienes ${unassignedCash.length} retiro${unassignedCash.length > 1 ? 's' : ''} sin destino asignado (${formatCurrency(unassignedCash.reduce((s, c) => s + c.amount, 0))}). Estos son un punto ciego en tus finanzas.`
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
                Recomienda mantener mínimo 3 meses de gastos ({formatCurrency(totalExpense * 3)}) en fondo de emergencia.
              </div>
            )}
          </div>
        </div>

        {/* === RIGHT PANEL === */}
        <div className="advisor-panel">
          <div className="advisor-tag">
            <Sparkles size={12} /> ESTRATEGIAS & REGLAS
          </div>
          <div className="advisor-title">Marco de referencia financiero</div>

          <div className="criteria-cards">
            <div className="criteria-card">
              <div className="criteria-name">Regla 50/30/20</div>
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

            <div className="criteria-card">
              <div className="criteria-name">Fondo de Emergencia</div>
              <div className="criteria-desc">
                Meta: {formatCurrency(totalExpense * 3)} (3 meses de gastos).<br />
                Construir este fondo es prioridad antes de invertir en activos de riesgo.
              </div>
            </div>

            <div className="criteria-card">
              <div className="criteria-name">Simulación: +10% Ingreso</div>
              <div className="criteria-desc">
                Si tu ingreso aumentara a <strong style={{ color: '#C9A84C' }}>{formatCurrency(increaseIncome)}</strong>,
                tu balance sería <strong style={{ color: '#34D399' }}>{formatCurrency(balanceIfIncrease)}</strong> y
                tu tasa de ahorro subiría a <strong style={{ color: '#34D399' }}>{savingsIfIncrease.toFixed(1)}%</strong>.
              </div>
            </div>

            <div className="criteria-card">
              <div className="criteria-name">Gastos Variables Optimizables</div>
              <div className="criteria-desc">
                Este mes tienes {formatCurrency(varExp)} en gastos variables.
                Reducirlos un 15% liberaría {formatCurrency(varExp * 0.15)} adicionales para ahorro o inversión.
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
                  El efectivo sin categoría es un riesgo de seguimiento. Asigna siempre un motivo al retirar.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
