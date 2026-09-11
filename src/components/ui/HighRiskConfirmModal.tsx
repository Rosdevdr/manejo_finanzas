import { useState, useEffect } from 'react'
import { ShieldAlert, CheckCircle2, ArrowRight, X, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { triggerHaptic } from '../../utils/haptics'

interface HighRiskConfirmModalProps {
  isOpen: boolean
  amount: number
  concept: string
  categoryLabel?: string
  currentAvailable: number
  onConfirm: () => void
  onCancel: () => void
}

export function HighRiskConfirmModal({
  isOpen,
  amount,
  concept,
  categoryLabel,
  currentAvailable,
  onConfirm,
  onCancel,
}: HighRiskConfirmModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [canConfirm, setCanConfirm] = useState(false)
  const [isSealing, setIsSealing] = useState(false)

  const remainingBalance = currentAvailable - amount

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setCanConfirm(false)
      setIsSealing(false)
      return
    }

    // Trigger warning haptic on open
    triggerHaptic('warning')

    // Sequence the micro-delays for positive intentional friction
    const t1 = setTimeout(() => setStep(2), 350)
    const t2 = setTimeout(() => {
      setStep(3)
      setCanConfirm(true)
    }, 850)

    // Escape key listener for keyboard accessibility
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const handleConfirmFinal = () => {
    setIsSealing(true)
    triggerHaptic('seal')
    setTimeout(() => {
      onConfirm()
    }, 450)
  }

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{
        zIndex: 100000,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(5, 5, 8, 0.88)',
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: 480,
          background: '#111117',
          border: '1px solid rgba(201, 168, 76, 0.35)',
          borderRadius: 18,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(201, 168, 76, 0.15)',
          overflow: 'hidden',
          padding: 24,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(201, 168, 76, 0.15)',
                border: '1px solid rgba(201, 168, 76, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F3CA65',
              }}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Fricción Positiva de Seguridad
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>
                Transacción de Alto Impacto
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888898',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Amount Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(14, 14, 20, 0.98) 100%)',
            border: '1px solid rgba(201, 168, 76, 0.25)',
            borderRadius: 14,
            padding: '16px 18px',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Monto a Deducir
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F3CA65', fontFamily: 'Space Mono, monospace', letterSpacing: '-0.02em' }}>
            {formatCurrency(amount)}
          </div>
          <div style={{ fontSize: 12, color: '#D0D0DC', marginTop: 4 }}>
            {concept} {categoryLabel ? `· ${categoryLabel}` : ''}
          </div>
        </div>

        {/* Step-by-Step Intentional Verification Sequence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {/* Step 1 */}
          <div
            className="confirm-transaction-step"
            data-step="1"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: step >= 1 ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
              border: `1px solid ${step >= 1 ? 'rgba(201, 168, 76, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCircle2 size={16} style={{ color: step >= 1 ? '#34D399' : '#555566' }} />
            <div style={{ fontSize: 12, color: '#E0E0EC', flex: 1 }}>
              Verificación de umbral de capital (&gt; RD$ 25,000)
            </div>
          </div>

          {/* Step 2 */}
          <div
            className="confirm-transaction-step"
            data-step="2"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: step >= 2 ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
              border: `1px solid ${step >= 2 ? 'rgba(201, 168, 76, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCircle2 size={16} style={{ color: step >= 2 ? '#34D399' : '#555566' }} />
            <div style={{ fontSize: 12, color: '#E0E0EC', flex: 1 }}>
              Saldo libre resultante: <strong style={{ color: remainingBalance >= 0 ? '#34D399' : '#FB7185' }}>{formatCurrency(remainingBalance)}</strong>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className="confirm-transaction-step"
            data-step="3"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: step >= 3 ? 'rgba(201, 168, 76, 0.08)' : 'transparent',
              border: `1px solid ${step >= 3 ? 'rgba(201, 168, 76, 0.35)' : 'rgba(255, 255, 255, 0.05)'}`,
              transition: 'all 0.2s ease',
            }}
          >
            <ShieldCheck size={16} style={{ color: step >= 3 ? '#F3CA65' : '#555566' }} />
            <div style={{ fontSize: 12, color: '#E0E0EC', flex: 1 }}>
              Sello de integridad AUREUS listo para estampar
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="modal-btn-cancel"
            onClick={onCancel}
            style={{ flex: 1, height: 42, justifyContent: 'center' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`sandbox-btn-gold ${isSealing ? 'transaction-seal' : ''}`}
            disabled={!canConfirm || isSealing}
            onClick={handleConfirmFinal}
            style={{
              flex: 1.4,
              height: 42,
              justifyContent: 'center',
              opacity: canConfirm ? 1 : 0.45,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              boxShadow: canConfirm ? '0 4px 18px rgba(201, 168, 76, 0.3)' : 'none',
            }}
          >
            <span>{isSealing ? 'Estampando Sello...' : 'Confirmar con Sello'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
