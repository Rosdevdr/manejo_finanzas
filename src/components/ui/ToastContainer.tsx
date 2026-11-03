import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { ToastMessage } from '../../hooks/useToast'
import './ToastContainer.css'

interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

const VARIANT_META: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  success: {
    label: 'Operación Exitosa',
    icon: <CheckCircle2 size={18} />,
  },
  error: {
    label: 'Alerta de Operación',
    icon: <AlertCircle size={18} />,
  },
  warning: {
    label: 'Aviso Preventivo',
    icon: <AlertTriangle size={18} />,
  },
  info: {
    label: 'Actualización AUREUS',
    icon: <Info size={18} />,
  },
}

interface ToastItemProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const variantKey = VARIANT_META[toast.variant] ? toast.variant : 'info'
  const meta = VARIANT_META[variantKey]

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.touches[0].clientX - touchStartX.current
    if (diff > 0) {
      setOffsetX(diff)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (offsetX > 65) {
      setIsDismissing(true)
      setTimeout(() => onDismiss(toast.id), 180)
    } else {
      setOffsetX(0)
    }
    touchStartX.current = null
  }

  return (
    <div
      role="status"
      className={`aureus-toast-card variant-${variantKey}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: offsetX > 0 ? `translateX(${offsetX}px)` : undefined,
        opacity: isDismissing ? 0 : offsetX > 0 ? Math.max(0.2, 1 - offsetX / 180) : undefined,
        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease',
      }}
    >
      <div className="aureus-toast-accent-bar" />

      <span className="aureus-toast-icon-badge">
        {meta.icon}
      </span>

      <div className="aureus-toast-content">
        <span className="aureus-toast-title">{meta.label}</span>
        <span className="aureus-toast-message">{toast.message}</span>
      </div>

      {toast.action && (
        <button
          type="button"
          className="aureus-toast-action-btn"
          onClick={() => {
            toast.action?.onClick()
            onDismiss(toast.id)
          }}
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        className="aureus-toast-close-btn"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        title="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  const content = (
    <div
      className="aureus-toast-viewport"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content
}
