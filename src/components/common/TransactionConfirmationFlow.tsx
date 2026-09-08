import React, { useState, useEffect } from 'react'
import { ShieldCheck, Check, AlertTriangle, X } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { triggerHaptic } from '../../utils/haptics'
import './TransactionConfirmation.css'

export interface TransactionConfirmationFlowProps {
  amount: number
  category: string
  concept?: string
  date?: string
  paymentMethod?: string
  onConfirm: () => void
  onCancel: () => void
}

export const TransactionConfirmationFlow: React.FC<TransactionConfirmationFlowProps> = ({
  amount,
  category,
  concept,
  date,
  paymentMethod,
  onConfirm,
  onCancel,
}) => {
  // 0: Resumen (micro-transición 350ms)
  // 1: Autorización con fricción intencional
  // 2: Sello dorado animado 360°
  const [step, setStep] = useState<number>(0)

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 2) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, step])

  // Paso 0 -> Paso 1: Micro-delay intencional para revelar la autorización
  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => {
        setStep(1)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [step])

  const handleAuthorize = () => {
    triggerHaptic('seal')
    setStep(2)
    setTimeout(() => {
      onConfirm()
    }, 1250)
  }

  return (
    <div
      className="transaction-confirmation-overlay"
      onClick={() => {
        if (step !== 2) onCancel()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-flow-title"
    >
      <div className="transaction-flow-card" onClick={e => e.stopPropagation()}>
        {/* Cabecera institucional */}
        <div className="transaction-flow-header">
          <div className="transaction-security-badge">
            <span className="security-dot-pulse" />
            <span>Fricción de Seguridad AUREUS</span>
          </div>
          {step !== 2 && (
            <button
              type="button"
              onClick={onCancel}
              className="modal-close"
              title="Cancelar transacción"
              aria-label="Cerrar"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* PASO 0 y 1: Resumen & Autorización */}
        {step < 2 && (
          <div className="transaction-summary">
            <div className="summary-amount-block">
              <div className="summary-amount-label">Monto de la Transacción</div>
              <div className="summary-amount">{formatCurrency(amount)}</div>
            </div>

            <div className="summary-rows-container">
              {concept && (
                <div className="summary-row" data-row="1">
                  <span className="summary-label">Concepto / Descripción</span>
                  <span className="summary-value">{concept}</span>
                </div>
              )}
              <div className="summary-row" data-row="2">
                <span className="summary-label">Categoría</span>
                <span className="summary-value">{category}</span>
              </div>
              {date && (
                <div className="summary-row" data-row="3">
                  <span className="summary-label">Fecha del Movimiento</span>
                  <span className="summary-value">{date}</span>
                </div>
              )}
              {paymentMethod && (
                <div className="summary-row" data-row="4">
                  <span className="summary-label">Canal de Desembolso</span>
                  <span className="summary-value">{paymentMethod}</span>
                </div>
              )}
            </div>

            {step === 0 && (
              <div style={{ textAlign: 'center', padding: '12px 0', color: '#9CA3AF', fontSize: 13 }}>
                Verificando parámetros y límites institucionales...
              </div>
            )}

            {step === 1 && (
              <div className="transaction-authorization">
                <div className="authorization-warning-pill">
                  <AlertTriangle size={16} className="text-[#FCA5A5] flex-shrink-0" />
                  <span>Esta transacción supera el umbral de control de riesgo. Confirma tu autorización para continuar.</span>
                </div>

                <div className="authorization-buttons">
                  <button
                    type="button"
                    className="btn-cancel-transaction"
                    onClick={onCancel}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-confirm-transaction"
                    onClick={handleAuthorize}
                    autoFocus
                  >
                    <ShieldCheck size={16} />
                    <span>Confirmar Autorización</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASO 2: Sello Dorado Animado 360° */}
        {step === 2 && (
          <div className="transaction-seal-container" aria-live="assertive">
            <div className="transaction-seal" role="img" aria-label="Sello dorado de transacción completada">
              <div className="seal-ring-orbit" />
              <div className="seal-checkmark">
                <Check size={40} strokeWidth={3} />
              </div>
            </div>

            <div className="seal-confirmation-message" id="transaction-flow-title">
              Transacción Completada
            </div>
            <div className="seal-transaction-details">
              Desembolso por {formatCurrency(amount)} autorizado y asentado en tus libros.
            </div>
            <div className="seal-status-badge">
              <ShieldCheck size={13} />
              <span>Verificado por Protocolo AUREUS</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionConfirmationFlow
