import { describe, it, expect } from 'vitest'
import {
  TenantThemeConfigSchema,
  TenantConfigSchema,
  TenantColorsSchema,
} from '../../theme/tenantThemeSchema'
import { PRESET_TENANTS, DEFAULT_TENANT } from '../../theme/tenants'
import { generateTenantStatementHtml } from '../pdfTemplateEngine'
import type { ReportData } from '../exportReports'

describe('White-Label Multi-Tenancy Architecture', () => {
  describe('Zod Schema & Theme Sanitization', () => {
    it('debe validar y sanitizar colores hexadecimales válidos', () => {
      const valid = TenantColorsSchema.parse({
        brandPrimary: '#10B981',
        brandAccent: '#38BDF8',
      })
      expect(valid.brandPrimary).toBe('#10B981')
      expect(valid.brandAccent).toBe('#38BDF8')
      // Fallback a los defaults seguros para los campos no provistos
      expect(valid.bgMain).toBe('#0B0C10')
    })

    it('debe rechazar colores malformados (CSS Injection prevention)', () => {
      expect(() => {
        TenantColorsSchema.parse({
          brandPrimary: 'red; background: url(evil.com)',
        })
      }).toThrow()
    })

    it('debe proporcionar defaults de radio y tipografía seguros ante objeto vacío', () => {
      const parsed = TenantThemeConfigSchema.parse({})
      expect(parsed.radius.button).toBe('9999px')
      expect(parsed.radius.card).toBe('16px')
      expect(parsed.fontFamily).toContain('Space Grotesk')
    })

    it('debe validar la estructura completa de un TenantConfig', () => {
      const tenant = TenantConfigSchema.parse(DEFAULT_TENANT)
      expect(tenant.slug).toBe('aureus')
      expect(tenant.name).toBe('AUREUS Wealth')
      expect(tenant.feature_flags.ai_advisor).toBe(true)
      expect(tenant.transaction_limits.single_tx_limit_usd).toBe(5000)
    })
  })

  describe('Preset Tenants & Feature Flags', () => {
    it('debe contener los tenants preconfigurados: aureus, meridian y apex', () => {
      expect(PRESET_TENANTS.aureus).toBeDefined()
      expect(PRESET_TENANTS.meridian).toBeDefined()
      expect(PRESET_TENANTS.apex).toBeDefined()
    })

    it('debe reflejar la configuración modular de Apex NeoBank (sin IA, con Cripto)', () => {
      const apex = PRESET_TENANTS.apex
      expect(apex.feature_flags.ai_advisor).toBe(false)
      expect(apex.feature_flags.crypto_module).toBe(true)
      expect(apex.transaction_limits.currency).toBe('EUR')
      expect(apex.theme.colors.brandPrimary).toBe('#8B5CF6')
    })

    it('debe reflejar la configuración de Meridian Capital (con Préstamos, Esmeralda)', () => {
      const meridian = PRESET_TENANTS.meridian
      expect(meridian.feature_flags.loans_module).toBe(true)
      expect(meridian.feature_flags.crypto_module).toBe(false)
      expect(meridian.theme.colors.brandPrimary).toBe('#10B981')
    })
  })

  describe('Personalización Dinámica de Documentos PDF', () => {
    const mockReportData: ReportData = {
      period: '2026-09',
      incomes: [
        {
          id: 'inc-1',
          date: '2026-09-01',
          description: 'Honorarios Tech',
          amount: 80000,
          type: 'freelance',
          period: '2026-09',
        },
      ],
      expenses: [
        {
          id: 'exp-1',
          date: '2026-09-05',
          description: 'Renta Corporativa',
          amount: 25000,
          category: 'housing',
          paymentMethod: 'bank_transfer',
          type: 'fixed',
          period: '2026-09',
        },
      ],
      cashWithdrawals: [],
      creditTransactions: [],
      creditCards: [],
      categoryBudgets: [],
      savingsGoals: [],
      userName: 'Director Financiero',
    }

    it('debe generar HTML de estado de cuenta adaptando la marca de Meridian Capital', () => {
      const meridian = PRESET_TENANTS.meridian
      const hash = 'sha256_mock_hash_123456789'
      const html = generateTenantStatementHtml(mockReportData, meridian, hash)

      expect(html).toContain('Meridian Capital')
      expect(html).toContain(meridian.legalName)
      expect(html).toContain('--primary: #10B981')
      expect(html).toContain('sha256_mock_hash')
      expect(html).toContain('Honorarios Tech')
      expect(html).toContain('Renta Corporativa')
    })

    it('debe generar HTML con la marca de Apex NeoBank y su acento púrpura', () => {
      const apex = PRESET_TENANTS.apex
      const hash = 'sha256_apex_hash_abcdef'
      const html = generateTenantStatementHtml(mockReportData, apex, hash)

      expect(html).toContain('Apex NeoBank')
      expect(html).toContain('--primary: #8B5CF6')
      expect(html).toContain('sha256_apex_hash')
    })
  })
})
