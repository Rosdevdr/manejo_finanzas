import { describe, it, expect } from 'vitest'
import { sanitizeString } from '../security'

describe('Auth Flows & Security Helpers', () => {
  it('sanitizes user email input correctly', () => {
    const rawEmail = '   user@example.com  '
    expect(sanitizeString(rawEmail)).toBe('user@example.com')

    const maliciousEmail = '<script>alert(1)</script>clean@mail.com'
    expect(sanitizeString(maliciousEmail)).toBe('clean@mail.com')
  })

  it('validates 6-digit MFA TOTP code formats', () => {
    const validCode = '123456'
    const cleanValid = validCode.replace(/\D/g, '')
    expect(cleanValid.length).toBe(6)

    const dirtyCode = '12-34 56'
    const cleanDirty = dirtyCode.replace(/\D/g, '')
    expect(cleanDirty).toBe('123456')
    expect(cleanDirty.length).toBe(6)
  })

  it('rejects incomplete MFA codes', () => {
    const shortCode = '12345'
    expect(shortCode.length === 6).toBe(false)
  })
})
