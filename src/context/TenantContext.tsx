import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react'
import { TenantConfigSchema, type TenantConfig } from '../theme/tenantThemeSchema'
import { PRESET_TENANTS, DEFAULT_TENANT } from '../theme/tenants'
import { triggerHaptic } from '../utils/haptics'

interface TenantContextValue {
  tenant: TenantConfig
  theme: TenantConfig['theme']
  featureFlags: TenantConfig['feature_flags']
  limits: TenantConfig['transaction_limits']
  setTenantSlug: (slug: string) => void
  availableTenants: TenantConfig[]
}

const TenantContext = createContext<TenantContextValue | null>(null)

const STORAGE_KEY = 'aureus_active_tenant_slug'

export function TenantProvider({ children }: { children: ReactNode }) {
  const [activeSlug, setActiveSlug] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const queryTenant = params.get('tenant')?.toLowerCase()
      if (queryTenant && PRESET_TENANTS[queryTenant]) {
        return queryTenant
      }
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached && PRESET_TENANTS[cached]) {
        return cached
      }
    }
    return 'aureus'
  })

  const tenant = useMemo(() => {
    const raw = PRESET_TENANTS[activeSlug] || DEFAULT_TENANT
    try {
      return TenantConfigSchema.parse(raw)
    } catch {
      return DEFAULT_TENANT
    }
  }, [activeSlug])

  // Inyección dinámica de CSS Custom Properties en :root
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const { colors, radius, fontFamily } = tenant.theme

    // Variables de marca primaria y acento
    root.style.setProperty('--color-brand-primary', colors.brandPrimary)
    root.style.setProperty('--color-brand-accent', colors.brandAccent)
    root.style.setProperty('--color-gold', colors.brandAccent)
    root.style.setProperty('--color-gold-dark', colors.brandPrimary)
    root.style.setProperty('--color-primary', colors.brandPrimary)
    root.style.setProperty('--color-primary-hover', colors.brandAccent)

    // Superficies y fondos
    root.style.setProperty('--bg-main', colors.bgMain)
    root.style.setProperty('--bg-card', colors.bgCard)
    root.style.setProperty('--text-primary', colors.textPrimary)
    root.style.setProperty('--text-muted', colors.textMuted)

    // Formas y tipografía
    root.style.setProperty('--radius-button', radius.button)
    root.style.setProperty('--radius-card', radius.card)
    root.style.setProperty('--radius-input', radius.input)
    root.style.setProperty('--font-brand', fontFamily)

    // Halos de brillo dinámicos
    root.style.setProperty('--color-primary-glow', `${colors.brandPrimary}55`)
    root.style.setProperty('--color-accent-glow', `${colors.brandAccent}44`)
  }, [tenant])

  const setTenantSlug = (slug: string) => {
    if (PRESET_TENANTS[slug]) {
      triggerHaptic('light')
      setActiveSlug(slug)
      localStorage.setItem(STORAGE_KEY, slug)
    }
  }

  const availableTenants = useMemo(() => Object.values(PRESET_TENANTS), [])

  return (
    <TenantContext.Provider
      value={{
        tenant,
        theme: tenant.theme,
        featureFlags: tenant.feature_flags,
        limits: tenant.transaction_limits,
        setTenantSlug,
        availableTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext)
  if (!ctx) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return ctx
}
