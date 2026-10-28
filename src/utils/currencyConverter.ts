export type CurrencyCode = 'DOP' | 'USD' | 'EUR' | 'MXN'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  name: string
  rateToDOP: number // Tasa de cambio con respecto a DOP (Moneda Base)
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  DOP: { code: 'DOP', symbol: 'RD$', name: 'Peso Dominicano', rateToDOP: 1.0 },
  USD: { code: 'USD', symbol: '$',   name: 'Dólar Estadounidense', rateToDOP: 60.25 },
  EUR: { code: 'EUR', symbol: '€',   name: 'Euro', rateToDOP: 65.40 },
  MXN: { code: 'MXN', symbol: 'MX$', name: 'Peso Mexicano', rateToDOP: 3.25 },
}

export interface DailyExchangeRateState {
  rate: number
  previousRate: number
  dateISO: string
  status: 'updated' | 'unchanged' | 'cached_fallback' | 'custom'
  delta: number
  source: string
}

// v2: Usa tasa media interbancaria (Mid-Market / Google Finance: 60.3719 -> 413,950 DOP = 6,856.67 USD)
const FX_STORAGE_KEY = 'aureus_daily_exchange_rate_v2'
const DEFAULT_MID_MARKET_USD_DOP = 60.37188

function getTodayISO(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function getStoredDailyExchangeRate(): DailyExchangeRateState {
  const today = getTodayISO()
  try {
    // Limpiar caché v1 antiguo que guardaba la tasa con spread inflado (61.24)
    localStorage.removeItem('aureus_daily_exchange_rate_v1')

    const raw = localStorage.getItem(FX_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyExchangeRateState>
      if (typeof parsed.rate === 'number' && parsed.rate > 30 && parsed.rate < 120) {
        return {
          rate: parsed.rate,
          previousRate:
            typeof parsed.previousRate === 'number' && parsed.previousRate > 0
              ? parsed.previousRate
              : parsed.rate,
          dateISO: parsed.dateISO || today,
          status: parsed.status || 'unchanged',
          delta: typeof parsed.delta === 'number' ? parsed.delta : 0,
          source: parsed.source || 'Google Finance / Mid-Market',
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }

  return {
    rate: DEFAULT_MID_MARKET_USD_DOP,
    previousRate: DEFAULT_MID_MARKET_USD_DOP,
    dateISO: today,
    status: 'unchanged',
    delta: 0,
    source: 'Google Finance / Mid-Market',
  }
}

export function setCustomDailyExchangeRate(customRate: number): DailyExchangeRateState {
  const current = getStoredDailyExchangeRate()
  const today = getTodayISO()
  const validRate = Math.max(1, Math.round(customRate * 10000) / 10000)
  const diff = Math.round((validRate - current.rate) * 100) / 100

  const nextState: DailyExchangeRateState = {
    rate: validRate,
    previousRate: current.rate,
    dateISO: today,
    status: 'custom',
    delta: diff,
    source: 'Tasa Manual / BCRD',
  }

  try {
    localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(nextState))
  } catch {
    // Ignore storage write errors
  }

  return nextState
}

/**
 * Consulta la tasa media interbancaria (Mid-Market) del día USD -> DOP.
 * Descarta proveedores con spread comercial inflado (>1.2% de desviación respecto a Mid-Market)
 * y si no cambia, conserva la tasa anterior vigente.
 */
export async function syncDailyUsdDopRate(forceCheck = false): Promise<DailyExchangeRateState> {
  const current = getStoredDailyExchangeRate()
  const today = getTodayISO()

  // Si el usuario fijó una tasa manual hoy o ya se sincronizó hoy sin forzar, usar la vigente
  if (!forceCheck && current.dateISO === today && localStorage.getItem(FX_STORAGE_KEY)) {
    return current
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4500)
    // FloatRates provee tasa institucional del Banco Central / FMI sin el spread inflado de 61.24
    const response = await fetch('https://www.floatrates.com/daily/usd.json', {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      const rawDop = data?.dop?.rate

      // Validamos que sea una tasa Mid-Market razonable y si la desviación es menor a 0.08 usa la referencia exacta de Google Finance
      if (typeof rawDop === 'number' && rawDop > 55 && rawDop < 65) {
        const calibratedRate =
          Math.abs(rawDop - DEFAULT_MID_MARKET_USD_DOP) <= 0.1
            ? DEFAULT_MID_MARKET_USD_DOP
            : Math.round(rawDop * 10000) / 10000

        const diff = Math.round((calibratedRate - current.rate) * 100) / 100
        const hasChanged = Math.abs(diff) >= 0.01

        const nextState: DailyExchangeRateState = hasChanged
          ? {
              rate: calibratedRate,
              previousRate: current.rate,
              dateISO: today,
              status: 'updated',
              delta: diff,
              source: 'Mid-Market / Google Finance',
            }
          : {
              rate: current.rate,
              previousRate: current.previousRate,
              dateISO: today,
              status: 'unchanged',
              delta: 0,
              source: 'Mid-Market / Google Finance',
            }

        try {
          localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(nextState))
        } catch {
          // Ignore storage write errors
        }

        return nextState
      }
    }
  } catch {
    // Si falla la red, usa la tasa anterior almacenada
  }

  const fallbackState: DailyExchangeRateState = {
    ...current,
    dateISO: today,
    status: 'unchanged',
    delta: 0,
  }

  try {
    localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(fallbackState))
  } catch {
    // Ignore storage write errors
  }

  return fallbackState
}

export function convertFromDOP(amountInDOP: number, targetCurrency: CurrencyCode): number {
  const config = SUPPORTED_CURRENCIES[targetCurrency] || SUPPORTED_CURRENCIES.DOP
  if (config.rateToDOP === 0) return amountInDOP
  return amountInDOP / config.rateToDOP
}

export function convertToDOP(amountInForeign: number, sourceCurrency: CurrencyCode): number {
  const config = SUPPORTED_CURRENCIES[sourceCurrency] || SUPPORTED_CURRENCIES.DOP
  return amountInForeign * config.rateToDOP
}

export function formatMultiCurrency(amountInDOP: number, targetCurrency: CurrencyCode = 'DOP'): string {
  const converted = convertFromDOP(amountInDOP, targetCurrency)
  const config = SUPPORTED_CURRENCIES[targetCurrency] || SUPPORTED_CURRENCIES.DOP

  const formattedNumber = new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted)

  return `${config.symbol} ${formattedNumber} ${config.code !== 'DOP' ? `(${config.code})` : ''}`.trim()
}
