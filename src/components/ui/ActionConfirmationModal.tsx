import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ShieldCheck, Trash2, CheckCircle2, Check, X } from 'lucide-react'
import './ActionConfirmationModal.css'

export interface ActionConfirmationDetail {
  label: string
  value: string
}

export interface ActionConfirmationModalProps {
  isOpen: boolean
  title: string
  description: string
  variant?: 'gold' | 'emerald' | 'danger'
  confirmLabel?: string
  cancelLabel?: string
  details?: ActionConfirmationDetail[]
  onConfirm: () => void
  onCancel: () => void
}

export function ActionConfirmationModal({
  isOpen,
  title,
  description,
  variant = 'gold',
  confirmLabel = 'Aceptar',
  cancelLabel = 'Denegar',
  details,
  onConfirm,
  onCancel,
}: ActionConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="aureus-confirm-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="aureus-confirm-title"
    >
      <div
        className={`aureus-confirm-card variant-${variant}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="aureus-confirm-header">
          <div className="aureus-confirm-header-left">
            <div className="aureus-confirm-icon-badge" aria-hidden="true">
              {variant === 'danger' ? (
                <Trash2 size={20} strokeWidth={2.2} />
              ) : variant === 'emerald' ? (
                <CheckCircle2 size={20} strokeWidth={2.2} />
              ) : (
                <ShieldCheck size={20} strokeWidth={2.2} />
              )}
            </div>
            <div className="aureus-confirm-title-wrap">
              <span className="aureus-confirm-overline">
                {variant === 'danger'
                  ? 'Verificación de Seguridad'
                  : 'Confirmación de Operación'}
              </span>
              <h3 id="aureus-confirm-title" className="aureus-confirm-title">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="aureus-confirm-close"
            title={cancelLabel}
            aria-label={cancelLabel}
          >
            <X size={16} />
          </button>
        </div>

        <p className="aureus-confirm-desc">{description}</p>

        {details && details.length > 0 && (
          <div className="aureus-confirm-details">
            {details.map((row, idx) => (
              <div key={idx} className="aureus-confirm-detail-row">
                <span className="aureus-confirm-detail-label">{row.label}</span>
                <span className="aureus-confirm-detail-value" title={row.value}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="aureus-confirm-actions">
          <button
            type="button"
            onClick={onCancel}
            className="aureus-confirm-btn deny"
          >
            <X size={15} />
            <span>{cancelLabel}</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`aureus-confirm-btn accept variant-${variant}`}
          >
            <Check size={15} />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

