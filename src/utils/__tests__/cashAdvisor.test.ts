import { describe, it, expect } from 'vitest'
import { evaluateCashWithdrawal } from '../cashAdvisor'

describe('evaluateCashWithdrawal', () => {
  it('triggers danger alert when withdrawal exceeds 40% of available balance', () => {
    const result = evaluateCashWithdrawal(5000, 'pocket_money', 10000)
    expect(result.level).toBe('danger')
    expect(result.title).toContain('Alto Impacto')
    expect(result.message).toContain('50.0%')
  })

  it('provides warning for pocket money when under 40% threshold', () => {
    const result = evaluateCashWithdrawal(2000, 'pocket_money', 20000)
    expect(result.level).toBe('warning')
    expect(result.title).toContain('Dinero de Bolsillo')
  })

  it('triggers danger alert for unassigned cash withdrawals', () => {
    const result = evaluateCashWithdrawal(1000, 'unassigned', 20000)
    expect(result.level).toBe('danger')
    expect(result.title).toContain('Sin Destino Definido')
  })

  it('provides informative advice for specific service payments', () => {
    const result = evaluateCashWithdrawal(3000, 'specific_service', 20000)
    expect(result.level).toBe('info')
    expect(result.title).toContain('Pago de Servicio')
  })

  it('provides warning for leisure/nightout cash withdrawals', () => {
    const result = evaluateCashWithdrawal(2500, 'leisure_nightout', 20000)
    expect(result.level).toBe('warning')
    expect(result.title).toContain('Salida / Ocio')
  })

  it('provides advice for emergency withdrawals', () => {
    const result = evaluateCashWithdrawal(3000, 'emergency', 20000)
    expect(result.level).toBe('info')
    expect(result.title).toContain('Emergencia')
  })
})
