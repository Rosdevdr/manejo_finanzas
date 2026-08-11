import { X } from 'lucide-react'
import type { ToastMessage } from '../../hooks/useToast'

interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

const VARIANT_STYLES = {
  success: {
    border: 'rgba(52,211,153,0.3)',
    bg: 'rgba(52,211,153,0.1)',
    icon: '✓',
    iconColor: '#34D399',
  },
  error: {
    border: 'rgba(248,113,113,0.3)',
    bg: 'rgba(248,113,113,0.1)',
    icon: '✕',
    iconColor: '#F87171',
  },
  info: {
    border: 'rgba(201,168,76,0.3)',
    bg: 'rgba(201,168,76,0.08)',
    icon: '●',
    iconColor: '#C9A84C',
  },
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => {
        const s = VARIANT_STYLES[toast.variant]
        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#13131A',
              border: `1px solid ${s.border}`,
              borderRadius: 10,
              padding: '10px 14px',
              minWidth: 260,
              maxWidth: 360,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              pointerEvents: 'all',
              animation: 'toastIn 0.2s ease forwards',
            }}
          >
            {/* Accent bar */}
            <div style={{ width: 3, height: 32, borderRadius: 2, background: s.iconColor, flexShrink: 0 }} />

            {/* Icon */}
            <span style={{ color: s.iconColor, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {s.icon}
            </span>

            {/* Message */}
            <span style={{
              flex: 1,
              fontSize: 12,
              color: '#D0D0DC',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.4,
            }}>
              {toast.message}
            </span>

            {/* Dismiss */}
            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#444454',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
