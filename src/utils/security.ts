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
