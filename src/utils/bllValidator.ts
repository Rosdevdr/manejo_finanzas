import type {
  Income,
  Expense,
  CreditCard,
  CreditCardTransaction,
  CashWithdrawal,
  CategoryBudget,
  SavingsGoal,
  IncomeType,
  ExpenseCategory,
  ExpenseType,
  PaymentMethod,
  CashReason,
  GoalCategory,
} from '../types/finance'

export interface BllValidationResult<T> {
  isValid: boolean
  error?: string
  data?: T
  targetPeriod?: string
}

/**
 * Valida si un string cumple con el formato ISO YYYY-MM-DD y es una fecha real
 */
export function isValidIsoDate(dateStr?: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr.trim())) return false

  const [y, m, d] = dateStr.trim().split('-').map(Number)
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false

  const dateObj = new Date(y, m - 1, d)
  return (
    dateObj.getFullYear() === y &&
    dateObj.getMonth() === m - 1 &&
    dateObj.getDate() === d
  )
}

/**
 * Deriva el período YYYY-MM a partir de una fecha YYYY-MM-DD
 */
export function derivePeriodFromDate(dateStr?: string, fallbackPeriod?: string): string {
  if (dateStr && isValidIsoDate(dateStr)) {
    return dateStr.trim().slice(0, 7)
  }
  if (fallbackPeriod && /^\d{4}-\d{2}$/.test(fallbackPeriod.trim())) {
    return fallbackPeriod.trim()
  }
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${m}`
}

/**
 * Sanea y valida montos numéricos estrictamente positivos
 */
export function sanitizeAmount(val: number | string | undefined): number {
  if (typeof val === 'string') {
    val = parseFloat(val.replace(/,/g, ''))
  }
  if (val === undefined || isNaN(val) || !isFinite(val)) {
    return 0
  }
  return Math.round(val * 100) / 100
}

/**
 * Sanitiza textos eliminando espacios extras
 */
export function sanitizeString(text?: string): string {
  return (text || '').trim()
}

/**
 * BLL: Validación de Ingreso
 */
export function validateIncomeInput(input: Partial<Income>): BllValidationResult<Omit<Income, 'id'>> {
  const cleanDesc = sanitizeString(input.description || '')
  if (cleanDesc.length < 2) {
    return { isValid: false, error: 'La descripción del ingreso debe tener al menos 2 caracteres.' }
  }

  const rawAmount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount
  if (rawAmount === undefined || isNaN(rawAmount) || rawAmount <= 0) {
    return { isValid: false, error: 'El monto del ingreso debe ser un valor positivo mayor a 0.' }
  }
  const cleanAmount = sanitizeAmount(rawAmount)

  const validTypes: IncomeType[] = ['salary', 'freelance', 'investment', 'extra']
  const cleanType: IncomeType = (input.type && validTypes.includes(input.type)) ? input.type : 'salary'

  const dateStr = (input.date || '').trim()
  if (!isValidIsoDate(dateStr)) {
    return { isValid: false, error: 'La fecha del ingreso no es válida. Debe tener formato YYYY-MM-DD.' }
  }

  const derivedPeriod = derivePeriodFromDate(dateStr, input.period)

  return {
    isValid: true,
    targetPeriod: derivedPeriod,
    data: {
      description: cleanDesc,
      amount: cleanAmount,
      type: cleanType,
      date: dateStr,
      period: derivedPeriod,
    },
  }
}

/**
 * BLL: Validación de Gasto
 */
export function validateExpenseInput(input: Partial<Expense>): BllValidationResult<Omit<Expense, 'id'>> {
  const cleanDesc = sanitizeString(input.description || '')
  if (cleanDesc.length < 2) {
    return { isValid: false, error: 'La descripción del gasto debe tener al menos 2 caracteres.' }
  }

  const rawAmount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount
  if (rawAmount === undefined || isNaN(rawAmount) || rawAmount <= 0) {
    return { isValid: false, error: 'El monto del gasto debe ser mayor a 0.' }
  }
  const cleanAmount = sanitizeAmount(rawAmount)

  const validCategories: ExpenseCategory[] = [
    'housing', 'food', 'transport', 'utilities', 'health',
    'entertainment', 'education', 'debt', 'other'
  ]
  const cleanCategory: ExpenseCategory = (input.category && validCategories.includes(input.category))
    ? input.category
    : 'other'

  const validTypes: ExpenseType[] = ['fixed', 'variable']
  const cleanType: ExpenseType = (input.type && validTypes.includes(input.type)) ? input.type : 'variable'

  const validMethods: PaymentMethod[] = ['bank_transfer', 'debit_card', 'credit_card', 'cash']
  const cleanPaymentMethod: PaymentMethod = (input.paymentMethod && validMethods.includes(input.paymentMethod))
    ? input.paymentMethod
    : 'debit_card'

  const dateStr = (input.date || '').trim()
  if (!isValidIsoDate(dateStr)) {
    return { isValid: false, error: 'La fecha del gasto no es válida. Debe tener formato YYYY-MM-DD.' }
  }

  const derivedPeriod = derivePeriodFromDate(dateStr, input.period)

  return {
    isValid: true,
    targetPeriod: derivedPeriod,
    data: {
      description: cleanDesc,
      amount: cleanAmount,
      category: cleanCategory,
      type: cleanType,
      paymentMethod: cleanPaymentMethod,
      date: dateStr,
      period: derivedPeriod,
    },
  }
}

/**
 * BLL: Validación de Tarjeta de Crédito
 */
export function validateCreditCardInput(input: Partial<CreditCard>): BllValidationResult<Omit<CreditCard, 'id'>> {
  const cleanName = sanitizeString(input.name || '')
  if (cleanName.length < 2) {
    return { isValid: false, error: 'El nombre identificador de la tarjeta debe tener al menos 2 caracteres.' }
  }

  const cleanBank = sanitizeString(input.bank || '')
  if (cleanBank.length < 2) {
    return { isValid: false, error: 'El nombre de la entidad bancaria emisora es requerido.' }
  }

  const cleanDigits = (input.lastFourDigits || '').replace(/\D/g, '')
  if (cleanDigits.length !== 4) {
    return { isValid: false, error: 'Debe ingresar exactamente los últimos 4 dígitos de la tarjeta.' }
  }

  const rawLimit = typeof input.creditLimit === 'string' ? parseFloat(input.creditLimit) : input.creditLimit
  if (rawLimit === undefined || isNaN(rawLimit) || rawLimit <= 0) {
    return { isValid: false, error: 'El límite de crédito aprobado debe ser mayor a 0.' }
  }
  const cleanLimit = sanitizeAmount(rawLimit)

  const cutoff = Number(input.cutoffDay)
  if (isNaN(cutoff) || cutoff < 1 || cutoff > 31) {
    return { isValid: false, error: 'El día de corte debe ser un número entre 1 y 31.' }
  }

  const paymentDue = Number(input.paymentDueDay)
  if (isNaN(paymentDue) || paymentDue < 1 || paymentDue > 31) {
    return { isValid: false, error: 'El día límite de pago debe ser un número entre 1 y 31.' }
  }

  return {
    isValid: true,
    data: {
      name: cleanName,
      bank: cleanBank,
      lastFourDigits: cleanDigits,
      creditLimit: cleanLimit,
      cutoffDay: Math.floor(cutoff),
      paymentDueDay: Math.floor(paymentDue),
      interestRate: input.interestRate ? Math.max(0, sanitizeAmount(input.interestRate)) : undefined,
      color: input.color || 'gold',
    },
  }
}

/**
 * BLL: Validación de Consumo en Tarjeta de Crédito
 */
export function validateCreditTransactionInput(
  input: Partial<CreditCardTransaction>,
  availableCards?: CreditCard[]
): BllValidationResult<Omit<CreditCardTransaction, 'id'>> {
  if (!input.cardId) {
    return { isValid: false, error: 'Debe seleccionar una tarjeta de crédito válida.' }
  }

  if (availableCards && availableCards.length > 0 && !availableCards.some(c => c.id === input.cardId)) {
    return { isValid: false, error: 'La tarjeta seleccionada no existe o fue eliminada.' }
  }

  const cleanDesc = sanitizeString(input.description || '')
  if (cleanDesc.length < 2) {
    return { isValid: false, error: 'El concepto del consumo debe tener al menos 2 caracteres.' }
  }

  const rawAmount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount
  if (rawAmount === undefined || isNaN(rawAmount) || rawAmount <= 0) {
    return { isValid: false, error: 'El monto del consumo con tarjeta debe ser mayor a 0.' }
  }
  const cleanAmount = sanitizeAmount(rawAmount)

  const validCategories: ExpenseCategory[] = [
    'housing', 'food', 'transport', 'utilities', 'health',
    'entertainment', 'education', 'debt', 'other'
  ]
  const cleanCategory: ExpenseCategory = (input.category && validCategories.includes(input.category))
    ? input.category
    : 'other'

  const dateStr = (input.date || '').trim()
  if (!isValidIsoDate(dateStr)) {
    return { isValid: false, error: 'La fecha del consumo en tarjeta no es válida.' }
  }

  const derivedPeriod = derivePeriodFromDate(dateStr, input.period)

  const installments = Math.max(1, Math.floor(Number(input.installments) || 1))
  const currentInst  = Math.max(1, Math.min(installments, Math.floor(Number(input.currentInstallment) || 1)))

  return {
    isValid: true,
    targetPeriod: derivedPeriod,
    data: {
      cardId: input.cardId,
      description: cleanDesc,
      amount: cleanAmount,
      category: cleanCategory,
      date: dateStr,
      period: derivedPeriod,
      installments: installments,
      currentInstallment: currentInst,
      isPaid: Boolean(input.isPaid),
    },
  }
}

/**
 * BLL: Validación de Retiro de Efectivo
 */
export function validateCashWithdrawalInput(input: Partial<CashWithdrawal>): BllValidationResult<Omit<CashWithdrawal, 'id'>> {
  const rawAmount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount
  if (rawAmount === undefined || isNaN(rawAmount) || rawAmount <= 0) {
    return { isValid: false, error: 'El monto de retiro en efectivo debe ser mayor a 0.' }
  }
  const cleanAmount = sanitizeAmount(rawAmount)

  const dateStr = (input.date || '').trim()
  if (!isValidIsoDate(dateStr)) {
    return { isValid: false, error: 'La fecha de retiro en efectivo no es válida.' }
  }

  const validReasons: CashReason[] = ['pocket_money', 'specific_service', 'leisure_nightout', 'emergency', 'unassigned']
  const cleanReason: CashReason = (input.reason && validReasons.includes(input.reason)) ? input.reason : 'pocket_money'

  const derivedPeriod = derivePeriodFromDate(dateStr, input.period)

  return {
    isValid: true,
    targetPeriod: derivedPeriod,
    data: {
      period: derivedPeriod,
      date: dateStr,
      amount: cleanAmount,
      reason: cleanReason,
      note: sanitizeString(input.note),
    },
  }
}

/**
 * BLL: Validación de Presupuesto por Categoría
 */
export function validateBudgetInput(input: Partial<CategoryBudget>): BllValidationResult<Omit<CategoryBudget, 'id'>> {
  if (!input.category) {
    return { isValid: false, error: 'Debe especificar la categoría del presupuesto.' }
  }

  const rawAmount = typeof input.limitAmount === 'string' ? parseFloat(input.limitAmount) : input.limitAmount
  if (rawAmount === undefined || isNaN(rawAmount) || rawAmount <= 0) {
    return { isValid: false, error: 'El límite presupuestario asignado debe ser mayor a 0.' }
  }
  const cleanLimit = sanitizeAmount(rawAmount)

  return {
    isValid: true,
    data: {
      period: input.period || 'default',
      category: input.category,
      limitAmount: cleanLimit,
    },
  }
}

/**
 * BLL: Validación de Meta de Ahorro
 */
export function validateSavingsGoalInput(input: Partial<SavingsGoal>): BllValidationResult<Omit<SavingsGoal, 'id'>> {
  const cleanName = sanitizeString(input.name || '')
  if (cleanName.length < 2) {
    return { isValid: false, error: 'El nombre de la meta de ahorro debe tener al menos 2 caracteres.' }
  }

  const rawTarget = typeof input.targetAmount === 'string' ? parseFloat(input.targetAmount) : input.targetAmount
  if (rawTarget === undefined || isNaN(rawTarget) || rawTarget <= 0) {
    return { isValid: false, error: 'El monto objetivo de ahorro debe ser mayor a 0.' }
  }

  const rawCurrent = typeof input.currentAmount === 'string' ? parseFloat(input.currentAmount) : (input.currentAmount || 0)
  const cleanCurrent = Math.max(0, sanitizeAmount(isNaN(rawCurrent) ? 0 : rawCurrent))
  const cleanTarget = sanitizeAmount(rawTarget)

  const rawMonthly = typeof input.monthlyContribution === 'string' ? parseFloat(input.monthlyContribution) : (input.monthlyContribution || 0)
  const cleanMonthly = Math.max(0, sanitizeAmount(isNaN(rawMonthly) ? 0 : rawMonthly))

  const validCategories: GoalCategory[] = ['emergency', 'vacation', 'car', 'home', 'investment', 'education', 'tech', 'other']
  const cleanCat: GoalCategory = (input.category && validCategories.includes(input.category))
    ? input.category
    : 'other'

  return {
    isValid: true,
    data: {
      name: cleanName,
      targetAmount: cleanTarget,
      currentAmount: cleanCurrent,
      monthlyContribution: cleanMonthly,
      targetDate: input.targetDate && isValidIsoDate(input.targetDate) ? input.targetDate : undefined,
      category: cleanCat,
      color: input.color || '#34D399',
      isCompleted: Boolean(input.isCompleted || cleanCurrent >= cleanTarget),
    },
  }
}
