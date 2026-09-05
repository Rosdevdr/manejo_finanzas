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

        <div className="modal-body" style={{ padding: '18px 22px' }}>
          <p style={{ fontSize: 12.5, color: '#9CA3AF', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Experimenta cómo pequeñas decisiones u horizontes futuros alteran tu capacidad de ahorro proyectada en los próximos <strong>{projectionMonths} meses</strong>.
          </p>

          <div className="scenario-controls-grid">
            <div className="scenario-control-card">
              <div className="slider-header">
                <span className="scenario-control-label">Aumento / Reducción de Ingresos</span>
                <span className="slider-value-badge" style={{ color: incomePctChange >= 0 ? '#34D399' : '#FB7185' }}>
                  {incomePctChange > 0 ? `+${incomePctChange}%` : `${incomePctChange}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                step="5"
                className="scenario-range-input gold"
                value={incomePctChange}
                onChange={(e) => setIncomePctChange(parseInt(e.target.value, 10))}
              />
              <div className="scenario-presets">
                {[-20, -10, 0, 15, 30].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`scenario-preset-btn ${incomePctChange === val ? 'active' : ''}`}
                    onClick={() => setIncomePctChange(val)}
                  >
                    {val > 0 ? `+${val}%` : `${val}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="scenario-control-card">
              <div className="slider-header">
                <span className="scenario-control-label">Reducción de Gastos Variables</span>
                <span className="slider-value-badge emerald">-{varExpenseCutPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                className="scenario-range-input emerald"
                value={varExpenseCutPct}
                onChange={(e) => setVarExpenseCutPct(parseInt(e.target.value, 10))}
              />
              <div className="scenario-presets">
                {[0, 10, 20, 30, 40].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`scenario-preset-btn ${varExpenseCutPct === val ? 'active' : ''}`}
                    onClick={() => setVarExpenseCutPct(val)}
                  >
                    -{val}%
                  </button>
                ))}
              </div>
            </div>

            <div className="scenario-control-card">
              <div className="slider-header">
                <span className="scenario-control-label">Nuevo Compromiso Fijo Mensual</span>
                <span className="slider-value-badge" style={{ color: newFixedExpense > 0 ? '#FB7185' : '#9CA3AF' }}>
                  {formatCurrency(newFixedExpense)}
                </span>
              </div>
              <div style={{ position: 'relative', marginTop: 4 }}>
                <input
                  type="number"
                  className="scenario-num-input"
                  placeholder="0.00"
                  min="0"
                  step="500"
                  value={newFixedExpense || ''}
                  onChange={(e) => setNewFixedExpense(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
              <div className="scenario-presets">
                {[0, 2500, 5000, 10000, 20000].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`scenario-preset-btn ${newFixedExpense === val ? 'active' : ''}`}
                    onClick={() => setNewFixedExpense(val)}
                  >
                    {val === 0 ? 'Sin gastos' : `+RD$${(val / 1000).toFixed(0)}k`}
                  </button>
                ))}
              </div>
            </div>

            <div className="scenario-control-card">
              <div className="slider-header">
                <span className="scenario-control-label">Horizonte Temporal Proyectado</span>
                <span className="slider-value-badge gold">{projectionMonths} meses</span>
              </div>
              <select
                className="scenario-select-input"
                value={projectionMonths}
                onChange={(e) => setProjectionMonths(parseInt(e.target.value, 10))}
              >
                <option value={3}>3 Meses Vista (Corto Plazo)</option>
                <option value={6}>6 Meses Vista (Medio Plazo)</option>
                <option value={12}>12 Meses Vista (1 Año Completo)</option>
                <option value={24}>24 Meses Vista (2 Años Estratégico)</option>
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

        <div className="modal-footer" style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', background: '#0E0E14' }}>
          <button
            type="button"
            className="mit-submit-btn"
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #F3CA65 0%, #C9A84C 100%)',
              color: '#0A0A0C',
              border: 'none',
              fontWeight: 700,
              padding: '10px 28px',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(243, 202, 101, 0.25)',
              width: '100%',
            }}
          >
            Entendido, cerrar simulador
          </button>
        </div>
      </div>
    </div>
  )
}
