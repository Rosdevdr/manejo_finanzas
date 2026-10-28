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
  status: 'updated' | 'unchanged' | 'cached_fallback'
  delta: number
  source: string
}

const FX_STORAGE_KEY = 'aureus_daily_exchange_rate_v1'
const DEFAULT_USD_DOP_RATE = 60.25

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
    const raw = localStorage.getItem(FX_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyExchangeRateState>
      if (typeof parsed.rate === 'number' && parsed.rate > 0) {
        return {
          rate: parsed.rate,
          previousRate:
            typeof parsed.previousRate === 'number' && parsed.previousRate > 0
              ? parsed.previousRate
              : parsed.rate,
          dateISO: parsed.dateISO || today,
          status: parsed.status || 'unchanged',
          delta: typeof parsed.delta === 'number' ? parsed.delta : 0,
          source: parsed.source || 'BCRD / Spot',
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }

  return {
    rate: DEFAULT_USD_DOP_RATE,
    previousRate: DEFAULT_USD_DOP_RATE,
    dateISO: today,
    status: 'unchanged',
    delta: 0,
    source: 'BCRD / Spot',
  }
}

/**
 * Consulta la tasa del día USD -> DOP.
 * Si la tasa cambió respecto al registro previo, actualiza el valor y guarda la anterior.
 * Si no cambió (o si no hay conexión), mantiene intacta la tasa anterior.
 */
export async function syncDailyUsdDopRate(forceCheck = false): Promise<DailyExchangeRateState> {
  const current = getStoredDailyExchangeRate()
  const today = getTodayISO()

  // Si ya fue consultada hoy y no se fuerza actualización manual, retorna el estado vigente
  if (!forceCheck && current.dateISO === today && localStorage.getItem(FX_STORAGE_KEY)) {
    return current
  }

  const endpoints = [
    'https://open.er-api.com/v6/latest/USD',
    'https://api.exchangerate-api.com/v4/latest/USD',
  ]

  for (const url of endpoints) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4500)
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) continue
      const data = await response.json()
      const rawDop = data?.rates?.DOP

      if (typeof rawDop === 'number' && rawDop > 30 && rawDop < 120) {
        const fetchedRate = Math.round(rawDop * 100) / 100
        const diff = Math.round((fetchedRate - current.rate) * 100) / 100
        const hasChanged = Math.abs(diff) >= 0.01

        const nextState: DailyExchangeRateState = hasChanged
          ? {
              rate: fetchedRate,
              previousRate: current.rate,
              dateISO: today,
              status: 'updated',
              delta: diff,
              source: 'Mercado Spot / Día',
            }
          : {
              // Si no cambia, se usa la anterior
              rate: current.rate,
              previousRate: current.previousRate,
              dateISO: today,
              status: 'unchanged',
              delta: 0,
              source: 'Tasa Anterior Vigente',
            }

        SUPPORTED_CURRENCIES.USD.rateToDOP = nextState.rate

        try {
          localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(nextState))
        } catch {
          // Ignore storage write errors
        }

        return nextState
      }
    } catch {
      // Intenta el siguiente endpoint o usa la tasa anterior guardada
    }
  }

  // Fallback: si no hay red o el proveedor no cambió, se conserva la tasa anterior
  const fallbackState: DailyExchangeRateState = {
    ...current,
    dateISO: today,
    status: 'unchanged',
    delta: 0,
    source: 'Tasa Anterior Vigente',
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
