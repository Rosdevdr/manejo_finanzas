/**
 * AUREUS Web Haptics Utility
 * Provides subtle tactile feedback via the Web Vibration API when supported.
 * Degrades silently on unsupported browsers (e.g. desktop, iOS Safari without webkit vibration).
 */

export type HapticPattern = 'success' | 'warning' | 'error' | 'light' | 'seal'

export function triggerHaptic(type: HapticPattern = 'light'): void {
  const nav = typeof window !== 'undefined' ? window.navigator : (typeof navigator !== 'undefined' ? navigator : null)
  if (!nav || typeof nav.vibrate !== 'function') {
    return
  }

  try {
    switch (type) {
      case 'light':
        nav.vibrate(15)
        break
      case 'success':
        nav.vibrate([40, 30, 50])
        break
      case 'warning':
        nav.vibrate([60, 50, 60])
        break
      case 'error':
        nav.vibrate([100, 40, 100, 40, 120])
        break
      case 'seal':
        nav.vibrate([20, 20, 30, 20, 80])
        break
    }
  } catch {
    // Fail silently if vibration is blocked by browser restrictions
  }
}
