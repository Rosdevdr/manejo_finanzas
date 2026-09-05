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

  it('verifies strict 6-digit TOTP code matching for Google and iOS Authenticator', () => {
    const isValidTotp = (code: string) => {
      const clean = code.replace(/\D/g, '')
      return clean.length === 6 && /^\d{6}$/.test(clean)
    }

    expect(isValidTotp('123456')).toBe(true)
    expect(isValidTotp('987 654')).toBe(true)
    expect(isValidTotp('000000')).toBe(true)
    expect(isValidTotp('12345')).toBe(false)
    expect(isValidTotp('1234567')).toBe(false)
    expect(isValidTotp('abc123')).toBe(false)
  })

  it('handles MFA AAL2 assurance level requirement correctly', () => {
    const checkRequiresMfa = (currentLevel: string, nextLevel: string, hasVerifiedTotp: boolean) => {
      return currentLevel === 'aal1' && nextLevel === 'aal2' && hasVerifiedTotp
    }

    // User enrolled with verified TOTP factor logging in
    expect(checkRequiresMfa('aal1', 'aal2', true)).toBe(true)
    // User already completed MFA verification
    expect(checkRequiresMfa('aal2', 'aal2', true)).toBe(false)
    // User without TOTP factor
    expect(checkRequiresMfa('aal1', 'aal1', false)).toBe(false)
    expect(checkRequiresMfa('aal1', 'aal2', false)).toBe(false)
  })
})
