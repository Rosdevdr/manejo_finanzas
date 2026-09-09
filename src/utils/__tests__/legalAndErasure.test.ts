import { describe, it, expect } from 'vitest'
import { getTermsAndConditionsContent } from '../termsDocument'
import { getStorageKeys } from '../../hooks/useFinanceStorage'

describe('Marco Legal y Derecho al Olvido (República Dominicana & GDPR)', () => {
  it('genera el texto oficial de términos conteniendo las leyes dominicanas y estándares globales', () => {
    const text = getTermsAndConditionsContent()

    // Verificaciones de cumplimiento legal estricto en República Dominicana
    expect(text).toContain('Ley No. 172-13') // Protección de Datos de Carácter Personal RD
    expect(text).toContain('Ley No. 183-02') // Monetaria y Financiera RD (No intermediación bancaria)
    expect(text).toContain('Superintendencia de Bancos')
    expect(text).toContain('Banco Central de la República Dominicana')
    expect(text).toContain('Ley No. 53-07')  // Crímenes y Delitos de Alta Tecnología RD
    expect(text).toContain('Ley No. 358-05') // Pro Consumidor RD (Derechos del Consumidor)
    expect(text).toContain('Ley No. 126-02') // Comercio Electrónico y Firmas Digitales RD

    // Verificaciones de estándares internacionales
    expect(text).toContain('DERECHO AL OLVIDO')
    expect(text).toContain('GDPR')
    expect(text).toContain('EU AI Act')
    expect(text).toContain('Row Level Security')
    expect(text).toContain('PCI-DSS')
  })

  it('genera llaves de almacenamiento aisladas para usuarios y demo', () => {
    const userKeys = getStorageKeys('user-test-123')
    expect(userKeys.incomes).toBe('aureus_user_user-test-123_incomes')
    expect(userKeys.expenses).toBe('aureus_user_user-test-123_expenses')
    expect(userKeys.creditCards).toBe('aureus_user_user-test-123_credit_cards')
    expect(userKeys.savingsGoals).toBe('aureus_user_user-test-123_savings_goals')

    const demoKeys = getStorageKeys(null)
    expect(demoKeys.incomes).toBe('aureus_demo_incomes')
    expect(demoKeys.expenses).toBe('aureus_demo_expenses')
  })
})

