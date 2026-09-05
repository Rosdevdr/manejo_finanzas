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
