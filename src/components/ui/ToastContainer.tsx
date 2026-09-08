import React, { useState, useRef } from 'react'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { ToastMessage } from '../../hooks/useToast'

interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

const VARIANT_CONFIG: Record<
  string,
  { border: string; bg: string; iconColor: string; icon: React.ReactNode; glow: string }
> = {
  success: {
    border: 'rgba(52, 211, 153, 0.35)',
    bg: 'rgba(12, 24, 18, 0.95)',
    iconColor: '#34D399',
    icon: <CheckCircle2 size={16} />,
    glow: 'rgba(52, 211, 153, 0.15)',
  },
  error: {
    border: 'rgba(248, 113, 113, 0.4)',
    bg: 'rgba(28, 14, 16, 0.95)',
    iconColor: '#F87171',
    icon: <AlertCircle size={16} />,
    glow: 'rgba(248, 113, 113, 0.18)',
  },
  warning: {
    border: 'rgba(251, 191, 36, 0.4)',
    bg: 'rgba(28, 22, 12, 0.95)',
    iconColor: '#FBBF24',
    icon: <AlertTriangle size={16} />,
    glow: 'rgba(251, 191, 36, 0.18)',
  },
  info: {
    border: 'rgba(201, 168, 76, 0.35)',
    bg: 'rgba(22, 20, 14, 0.95)',
    iconColor: '#F3CA65',
    icon: <Info size={16} />,
    glow: 'rgba(201, 168, 76, 0.15)',
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

  const config = VARIANT_CONFIG[toast.variant] || VARIANT_CONFIG.info

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.touches[0].clientX - touchStartX.current
    // Only allow swiping to the right to dismiss
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 12,
        padding: '12px 16px',
        minWidth: 280,
        maxWidth: 400,
        boxShadow: `0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px ${config.glow}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        pointerEvents: 'all',
        transform: `translateX(${offsetX}px)`,
        opacity: isDismissing ? 0 : Math.max(0.2, 1 - offsetX / 180),
        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {/* Accent Bar */}
      <div
        style={{
          width: 3.5,
          height: 36,
          borderRadius: 3,
          background: config.iconColor,
          flexShrink: 0,
        }}
      />

      {/* Icon */}
      <span
        style={{
          color: config.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {config.icon}
      </span>

      {/* Message */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: 12.5,
            color: '#F5F5F7',
            fontFamily: 'Space Grotesk, Inter, sans-serif',
            lineHeight: 1.45,
            display: 'block',
            fontWeight: 500,
            wordBreak: 'break-word',
          }}
        >
          {toast.message}
        </span>
      </div>

      {/* Optional Action Button */}
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick()
            onDismiss(toast.id)
          }}
          style={{
            background: 'rgba(201, 168, 76, 0.15)',
            border: '1px solid rgba(201, 168, 76, 0.35)',
            color: '#F3CA65',
            fontSize: 11,
            fontWeight: 700,
            padding: '5px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: 'Space Grotesk, sans-serif',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {toast.action.label}
        </button>
      )}

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#888898',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 99999,
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
