import { useState, useCallback } from 'react'
import { triggerHaptic } from '../utils/haptics'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
  action?: ToastAction
  timestamp: number
}

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  info: 5000,
  warning: 8000,
  error: 12000,
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const show = useCallback(
    (
      message: string,
      variant: ToastVariant = 'success',
      options?: { duration?: number; action?: ToastAction }
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const duration = options?.duration ?? DEFAULT_DURATIONS[variant] ?? 4000

      // Trigger tactile haptic feedback on devices with vibration support
      if (variant === 'error') {
        triggerHaptic('error')
      } else if (variant === 'warning') {
        triggerHaptic('warning')
      } else if (variant === 'success') {
        triggerHaptic('success')
      } else {
        triggerHaptic('light')
      }

      setToasts(prev => {
        // Keep at most 3 simultaneous toasts to prevent screen crowding
        const next = [...prev, { id, message, variant, action: options?.action, timestamp: Date.now() }]
        return next.slice(-3)
      })

      if (duration > 0 && Number.isFinite(duration)) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id))
        }, duration)
      }
    },
    []
  )

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, show, dismiss }
}
