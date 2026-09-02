import { useState } from 'react'
import { X, Flame, TrendingUp, Percent, DollarSign, PiggyBank, Wallet } from 'lucide-react'
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card fire-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={20} style={{ color: '#F59E0B' }} />
            <h2 className="modal-title">Calculadora FIRE (Independencia Financiera)</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '18px 22px' }}>
          <p style={{ fontSize: 12.5, color: '#9CA3AF', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            El movimiento <strong>FIRE (Financial Independence, Retire Early)</strong> calcula cuándo tus inversiones financiarán tu estilo de vida de por vida usando la <strong>Regla del 4%</strong> (25 veces tu gasto anual).
          </p>

          {/* Interactive Controls */}
          <div className="fire-controls-grid">
            {/* Control 1: Gasto Mensual */}
            <div className="fire-control-card">
              <div className="fire-control-header">
                <span className="fire-control-label">
                  <Wallet size={14} style={{ color: '#FB7185' }} /> Gasto Mensual
                </span>
                <span className="fire-control-val">{formatCurrency(monthlyExpense)}</span>
              </div>
              <input
                type="range"
                className="fire-slider"
                min={5000}
                max={250000}
                step={2500}
                value={monthlyExpense}
                onChange={e => setMonthlyExpense(parseInt(e.target.value, 10))}
              />
              <div className="fire-presets">
                {[20000, 35000, 50000, 80000, 120000].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`fire-preset-btn ${monthlyExpense === val ? 'active' : ''}`}
                    onClick={() => setMonthlyExpense(val)}
                  >
                    RD${(val / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Ahorro Mensual */}
            <div className="fire-control-card">
              <div className="fire-control-header">
                <span className="fire-control-label">
                  <PiggyBank size={14} style={{ color: '#34D399' }} /> Ahorro / Inversión Mensual
                </span>
                <span className="fire-control-val">{formatCurrency(monthlySavings)}</span>
              </div>
              <input
                type="range"
                className="fire-slider emerald"
                min={1000}
                max={150000}
                step={1000}
                value={monthlySavings}
                onChange={e => setMonthlySavings(parseInt(e.target.value, 10))}
              />
              <div className="fire-presets">
                {[5000, 15000, 30000, 50000, 80000].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`fire-preset-btn ${monthlySavings === val ? 'active' : ''}`}
                    onClick={() => setMonthlySavings(val)}
                  >
                    RD${(val / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: Patrimonio Invertido */}
            <div className="fire-control-card">
              <div className="fire-control-header">
                <span className="fire-control-label">
                  <DollarSign size={14} style={{ color: '#60A5FA' }} /> Patrimonio Actual Invertido
                </span>
                <span className="fire-control-val">{formatCurrency(currentInvested)}</span>
              </div>
              <input
                type="range"
                className="fire-slider blue"
                min={0}
                max={1000000}
                step={10000}
                value={currentInvested}
                onChange={e => setCurrentInvested(parseInt(e.target.value, 10))}
              />
              <div className="fire-presets">
                {[0, 50000, 150000, 350000, 750000].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`fire-preset-btn ${currentInvested === val ? 'active' : ''}`}
                    onClick={() => setCurrentInvested(val)}
                  >
                    RD${(val / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Control 4: Retorno Anual */}
            <div className="fire-control-card">
              <div className="fire-control-header">
                <span className="fire-control-label">
                  <Percent size={14} style={{ color: '#F3CA65' }} /> Retorno Anual Esperado
                </span>
                <span className="fire-control-val" style={{ color: '#F3CA65' }}>{returnRate}% / año</span>
              </div>
              <input
                type="range"
                className="fire-slider gold"
                min={4}
                max={18}
                step={0.5}
                value={returnRate}
                onChange={e => setReturnRate(parseFloat(e.target.value))}
              />
              <div className="fire-presets">
                {[6, 8, 10, 12, 14].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`fire-preset-btn ${returnRate === val ? 'active' : ''}`}
                    onClick={() => setReturnRate(val)}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FIRE Results Tier Cards */}
          <div className="fire-grid">
            <div className="fire-card">
              <div className="fire-info">
                <span className="fire-title">🌱 Lean FIRE (Ajustado)</span>
                <span className="fire-sub">Estilo de vida austero (75% del gasto actual)</span>
              </div>
              <span className="fire-value" style={{ color: '#9CA3AF' }}>{formatCurrency(fireNumberLean)}</span>
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
                <span className="fire-sub">Estilo de vida premium (+50% de presupuesto extra)</span>
              </div>
              <span className="fire-value" style={{ color: '#60A5FA' }}>{formatCurrency(fireNumberFat)}</span>
            </div>
          </div>

          {/* Projection Verdict */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(18, 18, 26, 0.9) 100%)',
            border: '1px solid rgba(52, 211, 153, 0.35)',
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <TrendingUp size={26} style={{ color: '#34D399', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#34D399' }}>
                Tiempo para la Independencia Financiera: {yearsToRetire} años
              </div>
              <div style={{ fontSize: 11.5, color: '#D1D5DB', marginTop: 2, lineHeight: 1.4 }}>
                Invirtiendo <strong>{formatCurrency(monthlySavings)}/mes</strong> con un retorno del <strong>{returnRate}% anual</strong> y gastos de <strong>{formatCurrency(monthlyExpense)}/mes</strong>.
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', background: '#0E0E14' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ width: '100%' }}
          >
            Entendido, cerrar calculadora
          </button>
        </div>
      </div>
    </div>
  )
}
