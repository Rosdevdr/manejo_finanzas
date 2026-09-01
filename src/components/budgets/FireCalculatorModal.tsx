import { useState } from 'react'
import { X, Flame, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import './FireCalculatorModal.css'

interface FireCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
  currentMonthlyExpense: number
  currentSavings: number
}

export function FireCalculatorModal({
  isOpen,
  onClose,
  currentMonthlyExpense,
  currentSavings,
}: FireCalculatorModalProps) {
  const [monthlyExpense, setMonthlyExpense]   = useState(() => Math.round(currentMonthlyExpense) || 30000)
  const [monthlySavings, setMonthlySavings]   = useState(15000)
  const [returnRate, setReturnRate]           = useState(8) // 8% anual promedio
  const [currentInvested, setCurrentInvested] = useState(() => Math.round(currentSavings) || 50000)

  if (!isOpen) return null

  // Cálculos FIRE
  const annualExpense = monthlyExpense * 12
  const fireNumberStandard = annualExpense * 25 // Regla del 4%
  const fireNumberLean     = (annualExpense * 0.75) * 25 // 75% del gasto
  const fireNumberFat      = (annualExpense * 1.5) * 25 // 150% del gasto

  // Estimación de años para alcanzar el FIRE Number con interés compuesto
  const monthlyRate = (returnRate / 100) / 12
  let accumulated = currentInvested
  let monthsCount = 0

  while (accumulated < fireNumberStandard && monthsCount < 600) { // Máximo 50 años
    accumulated = (accumulated + monthlySavings) * (1 + monthlyRate)
    monthsCount++
  }

  const yearsToRetire = (monthsCount / 12).toFixed(1)

  return (
    <div className="modal-overlay">
      <div className="modal-card fire-modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={20} style={{ color: '#F59E0B' }} />
            <h2 className="modal-title">Calculadora FIRE (Independencia Financiera)</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            El movimiento <strong>FIRE (Financial Independence, Retire Early)</strong> calcula la libertad financiera basándose en la <strong>Regla del 4%</strong>: cuando tus activos invertidos equivalen a 25 veces tus gastos anuales, los rendimientos pagan tu estilo de vida por siempre.
          </p>

          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Gasto Mensual Estimado</label>
              <input
                type="number"
                className="form-input"
                value={monthlyExpense || ''}
                onChange={(e) => setMonthlyExpense(Math.round(parseFloat(e.target.value) || 0))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ahorro / Inversión Mensual</label>
              <input
                type="number"
                className="form-input"
                value={monthlySavings || ''}
                onChange={(e) => setMonthlySavings(Math.round(parseFloat(e.target.value) || 0))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Patrimonio Actual Invertido</label>
              <input
                type="number"
                className="form-input"
                value={currentInvested || ''}
                onChange={(e) => setCurrentInvested(Math.round(parseFloat(e.target.value) || 0))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Retorno Anual Inversión (%)</label>
              <input
                type="number"
                className="form-input"
                value={returnRate || ''}
                onChange={(e) => setReturnRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="fire-grid">
            <div className="fire-card">
              <div className="fire-info">
                <span className="fire-title">🌱 Lean FIRE (Ajustado)</span>
                <span className="fire-sub">Estilo de vida austero (75% del gasto actual)</span>
              </div>
              <span className="fire-value">{formatCurrency(fireNumberLean)}</span>
            </div>

            <div className="fire-card gold">
              <div className="fire-info">
                <span className="fire-title" style={{ color: '#F3CA65' }}>🔥 Standard FIRE (Objetivo Principal)</span>
                <span className="fire-sub">Libertad financiera total (25x gastos anuales)</span>
              </div>
              <span className="fire-value">{formatCurrency(fireNumberStandard)}</span>
            </div>

            <div className="fire-card">
              <div className="fire-info">
                <span className="fire-title">💎 Fat FIRE (Holgado)</span>
                <span className="fire-sub">Estilo de vida holgado (+50% de presupuesto extra)</span>
              </div>
              <span className="fire-value">{formatCurrency(fireNumberFat)}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <TrendingUp size={24} style={{ color: '#34D399', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#34D399' }}>
                Tiempo Estimado para la Independencia Financiera: {yearsToRetire} años
              </div>
              <div style={{ fontSize: 11.5, color: '#D1D5DB', marginTop: 2 }}>
                Invirtiendo {formatCurrency(monthlySavings)}/mes con un rendimiento promedio del {returnRate}% anual.
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
            Entendido, cerrar calculadora
          </button>
        </div>
      </div>
    </div>
  )
}
