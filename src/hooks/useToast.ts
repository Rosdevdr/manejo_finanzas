import { useState, useCallback } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const show = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = `toast-${Date.now()}`
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, show, dismiss }
}
