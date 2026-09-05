import { describe, it, expect, beforeEach } from 'vitest'
import { sanitizeString, sanitizeAmount, isValidPeriod, isValidCardLastFour, sanitizeCardLastFour } from '../security'
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../rateLimiter'

describe('Security - Input Sanitization', () => {
  it('strips script tags and executable html payloads', () => {
    const maliciousInput = '<script>alert("xss")</script>Compra en supermercado'
    expect(sanitizeString(maliciousInput)).toBe('Compra en supermercado')
  })

  it('strips inline event handlers like onerror and onclick', () => {
    const maliciousInput = '<img src="x" onerror="stealCookies()">Pago de Alquiler'
    expect(sanitizeString(maliciousInput)).toBe('Pago de Alquiler')
  })

  it('strips javascript pseudo-protocols', () => {
    const maliciousInput = 'javascript:alert(1)'
    expect(sanitizeString(maliciousInput)).toBe('alert(1)')
  })

  it('sanitizes and caps numerical amounts safely', () => {
    expect(sanitizeAmount(5000)).toBe(5000)
    expect(sanitizeAmount('RD$ 15,000.50')).toBe(15000.5)
    expect(sanitizeAmount(-500)).toBe(0)
    expect(sanitizeAmount('invalid_text')).toBe(0)
    expect(sanitizeAmount(99999999999999)).toBe(999999999.99)
  })

  it('validates financial period strings properly', () => {
    expect(isValidPeriod('2026-08')).toBe(true)
    expect(isValidPeriod('2026-13')).toBe(false)
    expect(isValidPeriod('invalid')).toBe(false)
  })

  it('validates and sanitizes credit card last four digits securely (PCI-DSS)', () => {
    expect(isValidCardLastFour('4521')).toBe(true)
    expect(isValidCardLastFour('0000')).toBe(true)
    expect(isValidCardLastFour('452')).toBe(false)
    expect(isValidCardLastFour('45211')).toBe(false)
    expect(isValidCardLastFour('abcd')).toBe(false)

    expect(sanitizeCardLastFour('4521')).toBe('4521')
    expect(sanitizeCardLastFour('452')).toBe('0452')
    expect(sanitizeCardLastFour('1234567890123456')).toBe('3456') // Truncates full PAN to last 4
    expect(sanitizeCardLastFour('')).toBe('0000')
    expect(sanitizeCardLastFour(null)).toBe('0000')
  })
})

describe('Security - Rate Limiter', () => {
  const TEST_KEY = 'test_auth_action'

  beforeEach(() => {
    resetRateLimit(TEST_KEY)
  })

  it('starts unlocked with zero attempts', () => {
    const status = checkRateLimit(TEST_KEY)
    expect(status.isLocked).toBe(false)
    expect(status.attempts).toBe(0)
    expect(status.remainingSeconds).toBe(0)
  })

  it('locks after 5 failed attempts', () => {
    recordFailedAttempt(TEST_KEY) // 1
    recordFailedAttempt(TEST_KEY) // 2
    recordFailedAttempt(TEST_KEY) // 3
    recordFailedAttempt(TEST_KEY) // 4
    const res5 = recordFailedAttempt(TEST_KEY) // 5

    expect(res5.isLocked).toBe(true)
    expect(res5.attempts).toBe(5)
    expect(res5.remainingSeconds).toBeGreaterThan(0)

    const check = checkRateLimit(TEST_KEY)
    expect(check.isLocked).toBe(true)
  })

  it('resets rate limit cleanly on success', () => {
    recordFailedAttempt(TEST_KEY)
    recordFailedAttempt(TEST_KEY)
    resetRateLimit(TEST_KEY)

    const status = checkRateLimit(TEST_KEY)
    expect(status.isLocked).toBe(false)
    expect(status.attempts).toBe(0)
  })
})
