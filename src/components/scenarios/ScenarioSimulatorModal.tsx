import { useState } from 'react'
import { X, Sliders, TrendingUp, ArrowRightLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import type { Income, Expense } from '../../types/finance'
import './ScenarioSimulatorModal.css'

interface ScenarioSimulatorModalProps {
  isOpen: boolean
  onClose: () => void
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
}

export function ScenarioSimulatorModal({
  isOpen,
  onClose,
  currentPeriod,
  incomes,
  expenses,
}: ScenarioSimulatorModalProps) {
  const [incomePctChange, setIncomePctChange] = useState(0) // -30% a +50%
  const [varExpenseCutPct, setVarExpenseCutPct] = useState(0) // 0% a 50%
  const [newFixedExpense, setNewFixedExpense] = useState(0) // Monto de nuevo compromiso
  const [projectionMonths, setProjectionMonths] = useState(12) // 6 o 12 meses

  if (!isOpen) return null

  const pIncomes  = incomes.filter(i => i.period === currentPeriod)
  const pExpenses = expenses.filter(e => e.period === currentPeriod)

  const baselineIncome  = pIncomes.reduce((s, i) => s + i.amount, 0)
  const fixedExpenses   = pExpenses.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const varExpenses     = pExpenses.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)
  const baselineExpense = fixedExpenses + varExpenses
  const baselineNet     = baselineIncome - baselineExpense

  // Cálculos del Escenario Simulado
  const simIncome     = baselineIncome * (1 + incomePctChange / 100)
  const simVarExpense = varExpenses * (1 - varExpenseCutPct / 100)
  const simExpense    = fixedExpenses + simVarExpense + newFixedExpense
  const simNet        = simIncome - simExpense

  // Proyecciones acumuladas
  const baselineAccumulated = baselineNet * projectionMonths
  const simAccumulated      = simNet * projectionMonths
  const difference          = simAccumulated - baselineAccumulated

  const isPositiveGain = difference >= 0

  return (
    <div className="modal-overlay">
      <div className="modal-card scenario-modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={20} style={{ color: '#F3CA65' }} />
            <h2 className="modal-title">Simulador de Escenarios Financieros ("What-If")</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Experimenta cómo pequeñas decisiones u horizontes futuros alteran tu capacidad de ahorro proyectada en los próximos <strong>{projectionMonths} meses</strong>.
          </p>

          <div className="scenario-controls-grid">
            <div className="slider-group">
              <div className="slider-header">
                <span>Aumento / Reducción de Ingresos</span>
                <span className="slider-value-badge">{incomePctChange > 0 ? `+${incomePctChange}%` : `${incomePctChange}%`}</span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                step="5"
                className="scenario-range-input"
                value={incomePctChange}
                onChange={(e) => setIncomePctChange(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>Reducción de Gastos Variables</span>
                <span className="slider-value-badge">-{varExpenseCutPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                className="scenario-range-input"
                value={varExpenseCutPct}
                onChange={(e) => setVarExpenseCutPct(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nuevo Gasto Fijo Adicional (Mensual)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ej: RD$5,000 cuota préstamo"
                value={newFixedExpense || ''}
                onChange={(e) => setNewFixedExpense(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Horizonte Temporal Proyectado</label>
              <select
                className="form-input"
                value={projectionMonths}
                onChange={(e) => setProjectionMonths(parseInt(e.target.value, 10))}
              >
                <option value={6}>6 Meses Vista</option>
                <option value={12}>12 Meses Vista (1 Año)</option>
                <option value={24}>24 Meses Vista (2 Años)</option>
              </select>
            </div>
          </div>

          <div className="scenario-comparison-grid">
            <div className="scenario-card baseline">
              <div className="scenario-card-title">
                <ArrowRightLeft size={14} /> Escenario Actual (Base)
              </div>
              <div className="scenario-card-value" style={{ color: '#E5E7EB' }}>
                {formatCurrency(baselineAccumulated)}
              </div>
              <div className="scenario-card-sub">
                Margen mensual: {formatCurrency(baselineNet)}
              </div>
            </div>

            <div className="scenario-card simulated">
              <div className="scenario-card-title" style={{ color: '#F3CA65' }}>
                <TrendingUp size={14} /> Escenario Simulado ("What-If")
              </div>
              <div className="scenario-card-value" style={{ color: '#F3CA65' }}>
                {formatCurrency(simAccumulated)}
              </div>
              <div className="scenario-card-sub">
                Nuevo margen mensual: {formatCurrency(simNet)}
              </div>
            </div>
          </div>

          <div style={{
            background: isPositiveGain ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${isPositiveGain ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: 14,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            {isPositiveGain ? (
              <CheckCircle2 size={24} style={{ color: '#34D399', flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={24} style={{ color: '#EF4444', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isPositiveGain ? '#34D399' : '#EF4444' }}>
                Impacto Neto Proyectado: {isPositiveGain ? `+${formatCurrency(difference)}` : formatCurrency(difference)} en {projectionMonths} meses
              </div>
              <div style={{ fontSize: 11.5, color: '#D1D5DB', marginTop: 2 }}>
                {isPositiveGain
                  ? 'Este escenario incrementa tu patrimonio libre y acelerará tus metas de ahorro e inversión.'
                  : 'Este escenario reduce tu margen de liquidez disponible. Te recomendamos compensar reduciendo gastos no esenciales.'}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>
            Cerrar Simulador
          </button>
        </div>
      </div>
    </div>
  )
}
