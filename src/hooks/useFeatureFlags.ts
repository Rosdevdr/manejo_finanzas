import { useTenant } from '../context/TenantContext'
import type { TenantFeatureFlags } from '../theme/tenantThemeSchema'

export function useFeatureFlags() {
  const { featureFlags, limits, tenant } = useTenant()

  const isFeatureEnabled = (featureKey: keyof TenantFeatureFlags): boolean => {
    return Boolean(featureFlags[featureKey])
  }

  const checkTransactionLimit = (amount: number): { allowed: boolean; reason?: string } => {
    if (amount > limits.single_tx_limit_usd) {
      return {
        allowed: false,
        reason: `Monto excede el límite por transacción configurado de ${limits.currency} ${limits.single_tx_limit_usd.toLocaleString()}`,
      }
    }
    return { allowed: true }
  }

  return {
    featureFlags,
    limits,
    tenant,
    isFeatureEnabled,
    checkTransactionLimit,
  }
}
