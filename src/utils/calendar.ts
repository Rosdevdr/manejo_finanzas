// src/utils/calendar.ts

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const

export const MONTH_SHORT_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
] as const

/**
 * Determina con precisión astronómica si un año es bisiesto (29 días en Febrero).
 * Un año es bisiesto si es divisible entre 4, excepto los múltiplos de 100 que no son divisibles entre 400.
 */
export function isLeapYear(year: number): boolean {
  if (year <= 0) return false
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

/**
 * Retorna la cantidad exacta de días en un mes y año determinado.
 * Febrero tiene 28 o 29 días según el año bisiesto.
 * Meses con 30 días: Abril (4), Junio (6), Septiembre (9), Noviembre (11).
 * Resto con 31 días: Enero (1), Marzo (3), Mayo (5), Julio (7), Agosto (8), Octubre (10), Diciembre (12).
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 30
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30
  }
  return 31
}

/**
 * Retorna el periodo anterior en formato "YYYY-MM"
 */
export function getPreviousPeriod(period: string): string {
  const parts = period.split('-')
  let year = parseInt(parts[0], 10) || new Date().getFullYear()
  let month = parseInt(parts[1], 10) || 1

  month -= 1
  if (month < 1) {
    month = 12
    year -= 1
  }
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * Retorna el periodo siguiente en formato "YYYY-MM"
 */
export function getNextPeriod(period: string): string {
  const parts = period.split('-')
  let year = parseInt(parts[0], 10) || new Date().getFullYear()
  let month = parseInt(parts[1], 10) || 1

  month += 1
  if (month > 12) {
    month = 1
    year += 1
  }
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * Retorna el periodo actual del sistema en formato "YYYY-MM"
 */
export function getCurrentSystemPeriod(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/**
 * Formatea un periodo "YYYY-MM" en texto legible ("Agosto 2026")
 */
export function formatPeriodLabel(period: string): string {
  const [yearStr, monthStr] = period.split('-')
  const monthIdx = (parseInt(monthStr, 10) || 1) - 1
  const year = yearStr || new Date().getFullYear()
  const name = MONTH_NAMES[monthIdx] ?? 'Mes'
  return `${name} ${year}`
}

export interface MonthProgressInfo {
  totalDays: number
  currentDay: number
  daysRemaining: number
  percentPassed: number
  isMonthEndingSoon: boolean
  isCurrentMonth: boolean
}

/**
 * Proporciona el diagnóstico del calendario para un periodo dado:
 * días totales, días transcurridos, días restantes y alerta de fin de mes.
 */
export function getMonthProgress(period: string, refDate = new Date()): MonthProgressInfo {
  const [yearStr, monthStr] = period.split('-')
  const year = parseInt(yearStr, 10) || refDate.getFullYear()
  const month = parseInt(monthStr, 10) || (refDate.getMonth() + 1)
  const totalDays = getDaysInMonth(year, month)

  const currentSys = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`
  const isCurrentMonth = period === currentSys

  if (isCurrentMonth) {
    const currentDay = refDate.getDate()
    const daysRemaining = Math.max(0, totalDays - currentDay)
    const percentPassed = Math.min(100, Math.round((currentDay / totalDays) * 100))
    const isMonthEndingSoon = daysRemaining <= 3

    return {
      totalDays,
      currentDay,
      daysRemaining,
      percentPassed,
      isMonthEndingSoon,
      isCurrentMonth: true,
    }
  }

  const isPast = period < currentSys
  return {
    totalDays,
    currentDay: isPast ? totalDays : 1,
    daysRemaining: isPast ? 0 : totalDays,
    percentPassed: isPast ? 100 : 0,
    isMonthEndingSoon: false,
    isCurrentMonth: false,
  }
}

/**
 * Recopila todos los periodos con datos registrados + periodo actual + adyacentes,
 * sin duplicados y ordenados descendentemente (del más reciente al más antiguo).
 */
export function getAllAvailablePeriods(registeredPeriods: string[], defaultPeriod = '2026-08'): { value: string; label: string }[] {
  const set = new Set<string>()

  // Incluir periodos con datos
  registeredPeriods.forEach(p => {
    if (p && /^\d{4}-\d{2}$/.test(p)) set.add(p)
  })

  // Incluir el periodo del sistema y el default
  set.add(getCurrentSystemPeriod())
  set.add(defaultPeriod)

  // Incluir los últimos 6 meses para comodidad del usuario
  let cursor = getCurrentSystemPeriod()
  for (let i = 0; i < 6; i++) {
    set.add(cursor)
    cursor = getPreviousPeriod(cursor)
  }

  // Ordenar descendentemente
  const sorted = Array.from(set).sort((a, b) => b.localeCompare(a))

  return sorted.map(period => ({
    value: period,
    label: formatPeriodLabel(period),
  }))
}
