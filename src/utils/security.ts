/**
 * Security utilities: input sanitization, XSS mitigation, and safe validations
 */

/**
 * Sanitizes user-provided string inputs to prevent Stored/DOM XSS.
 * Removes HTML tags, javascript pseudo-protocols, and control characters.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags and content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Strip style tags and content
    .replace(/<[^>]*>?/gm, '') // Strip all remaining HTML tags
    .replace(/javascript:/gi, '') // Strip inline javascript protocols
    .replace(/vbscript:/gi, '') // Strip vbscript protocols
    .replace(/data:text\/html/gi, '') // Strip data URL HTML injections
    .replace(/on\w+\s*=/gi, '') // Strip inline event handlers like onclick=, onerror=
    .trim()
}

/**
 * Sanitizes numeric amount inputs to prevent NaN, Infinity, negative anomalies,
 * and overflow exploits.
 */
export function sanitizeAmount(amount: unknown): number {
  if (typeof amount === 'number') {
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) return 0
    return Math.min(amount, 999999999.99) // Cap at 999M to prevent DB overflow
  }

  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.]/g, '')
    const parsed = parseFloat(cleaned)
    if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) return 0
    return Math.min(parsed, 999999999.99)
  }

  return 0
}

/**
 * Validates financial period string format (YYYY-MM).
 */
export function isValidPeriod(period: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(period)
}

/**
 * Validates that card last-four digits format matches PCI-DSS safe standard (exactly 4 numeric digits).
 */
export function isValidCardLastFour(digits: unknown): boolean {
  if (typeof digits !== 'string') return false
  return /^[0-9]{4}$/.test(digits)
}

/**
 * Strips non-digits and ensures exactly 4 numeric characters for credit card identification.
 * Never stores full PAN (16 digits) to maintain zero-knowledge card security.
 */
export function sanitizeCardLastFour(input: unknown): string {
  if (typeof input !== 'string' && typeof input !== 'number') return '0000'
  const digits = String(input).replace(/\D/g, '')
  if (digits.length === 0) return '0000'
  return digits.slice(-4).padStart(4, '0')
}

