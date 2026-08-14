// src/utils/creditAdvisor.ts
import type { CreditCard, CreditCardTransaction } from '../types/finance'
import { getDaysInMonth } from './calendar'

export interface CardHealthStatus {
  totalDebt: number
  availableCredit: number
  utilizationRate: number
  statusLevel: 'optimal' | 'moderate' | 'warning' | 'critical'
  statusLabel: string
  daysToCutoff: number
  daysToPayment: number
  isCutoffSoon: boolean
  isPaymentSoon: boolean
  isGoldenWindow: boolean
  goldenWindowText: string
  minPaymentEstimate: number
}

/**
 * Calcula los días faltantes para el próximo día de corte.
 */
export function getDaysUntilCutoff(cutoffDay: number, refDate = new Date()): number {
  const currentDay = refDate.getDate()
  const year = refDate.getFullYear()
  const month = refDate.getMonth() + 1
  const daysInCurMonth = getDaysInMonth(year, month)
  const safeCutoff = Math.min(cutoffDay, daysInCurMonth)

  if (currentDay <= safeCutoff) {
    return safeCutoff - currentDay
  }

  // Próximo mes
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const daysInNextMonth = getDaysInMonth(nextYear, nextMonth)
  const safeNextCutoff = Math.min(cutoffDay, daysInNextMonth)

  const daysRemainingCurMonth = daysInCurMonth - currentDay
  return daysRemainingCurMonth + safeNextCutoff
}

/**
 * Calcula los días faltantes para el próximo día límite de pago.
 */
export function getDaysUntilPayment(paymentDueDay: number, refDate = new Date()): number {
  const currentDay = refDate.getDate()
  const year = refDate.getFullYear()
  const month = refDate.getMonth() + 1
  const daysInCurMonth = getDaysInMonth(year, month)
  const safeDue = Math.min(paymentDueDay, daysInCurMonth)

  if (currentDay <= safeDue) {
    return safeDue - currentDay
  }

  // Próximo mes
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const daysInNextMonth = getDaysInMonth(nextYear, nextMonth)
  const safeNextDue = Math.min(paymentDueDay, daysInNextMonth)

  const daysRemainingCurMonth = daysInCurMonth - currentDay
  return daysRemainingCurMonth + safeNextDue
}

/**
 * Diagnóstico completo de una tarjeta de crédito específica.
 */
export function evaluateCardHealth(
  card: CreditCard,
  transactions: CreditCardTransaction[],
  refDate = new Date()
): CardHealthStatus {
  // Transacciones no pagadas de esta tarjeta
  const cardTx = transactions.filter(t => t.cardId === card.id && !t.isPaid)
  const totalDebt = cardTx.reduce((sum, t) => sum + t.amount, 0)

  const availableCredit = Math.max(0, card.creditLimit - totalDebt)
  const utilizationRate = card.creditLimit > 0 ? (totalDebt / card.creditLimit) * 100 : 0

  let statusLevel: CardHealthStatus['statusLevel'] = 'optimal'
  let statusLabel = 'Uso Óptimo (<30%)'

  if (utilizationRate > 85) {
    statusLevel = 'critical'
    statusLabel = 'Crítico (>85% Límite)'
  } else if (utilizationRate > 50) {
    statusLevel = 'warning'
    statusLabel = 'Alto Riesgo (>50%)'
  } else if (utilizationRate > 30) {
    statusLevel = 'moderate'
    statusLabel = 'Moderado (30%-50%)'
  }

  const daysToCutoff = getDaysUntilCutoff(card.cutoffDay, refDate)
  const daysToPayment = getDaysUntilPayment(card.paymentDueDay, refDate)

  const currentDay = refDate.getDate()
  // Ventana dorada: Compras realizadas entre 1 y 5 días después de la fecha de corte
  const daysSinceCutoff = currentDay > card.cutoffDay ? currentDay - card.cutoffDay : (currentDay + (30 - card.cutoffDay))
  const isGoldenWindow = daysSinceCutoff >= 1 && daysSinceCutoff <= 5

  const goldenWindowText = isGoldenWindow
    ? '✨ ¡Ventana Dorada Activa! Compras ahora obtienen hasta 45-50 días de crédito sin interés.'
    : `💡 Mejor momento de compra: Del día ${card.cutoffDay + 1} al ${card.cutoffDay + 5} de cada mes.`

  // Estimado de pago mínimo: 5% de la deuda o RD$ 500 mínimo si hay saldo
  const minPaymentEstimate = totalDebt > 0 ? Math.max(500, Math.round(totalDebt * 0.05)) : 0

  return {
    totalDebt,
    availableCredit,
    utilizationRate,
    statusLevel,
    statusLabel,
    daysToCutoff,
    daysToPayment,
    isCutoffSoon: daysToCutoff <= 3,
    isPaymentSoon: daysToPayment <= 3 && totalDebt > 0,
    isGoldenWindow,
    goldenWindowText,
    minPaymentEstimate,
  }
}

/**
 * Resumen consolidado de todas las tarjetas.
 */
export function getConsolidatedCreditSummary(
  cards: CreditCard[],
  transactions: CreditCardTransaction[]
) {
  const totalLimit = cards.reduce((s, c) => s + c.creditLimit, 0)
  const unpaidTx = transactions.filter(t => !t.isPaid)
  const totalDebt = unpaidTx.reduce((s, t) => s + t.amount, 0)
  const availableCredit = Math.max(0, totalLimit - totalDebt)
  const utilizationRate = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0

  return {
    totalLimit,
    totalDebt,
    availableCredit,
    utilizationRate,
    cardsCount: cards.length,
    pendingPaymentsCount: unpaidTx.length,
  }
}
