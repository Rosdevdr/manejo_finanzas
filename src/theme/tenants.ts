import type { TenantConfig } from './tenantThemeSchema'

export const PRESET_TENANTS: Record<string, TenantConfig> = {
  aureus: {
    id: '00000000-0000-0000-0000-000000000001',
    slug: 'aureus',
    name: 'AUREUS Wealth',
    legalName: 'AUREUS Private Wealth Technologies S.R.L.',
    logoUrl: null, // usa AureusLogo SVG por defecto
    theme: {
      colors: {
        brandPrimary: '#C9A84C',
        brandAccent: '#F3CA65',
        bgMain: '#0A0C10',
        bgCard: '#111319',
        textPrimary: '#FFFFFF',
        textMuted: '#8E95A5',
        success: '#10B981',
        danger: '#EF4444',
      },
      radius: {
        button: '9999px',
        card: '18px',
        input: '10px',
      },
      fontFamily: "'Space Grotesk', -apple-system, sans-serif",
    },
    feature_flags: {
      crypto_module: false,
      loans_module: false,
      ai_advisor: true,
      fire_calculator: true,
      split_billing: true,
      cash_management: true,
      credit_management: true,
    },
    transaction_limits: {
      daily_transfer_limit_usd: 25000,
      single_tx_limit_usd: 5000,
      requires_2fa_threshold_usd: 1500,
      currency: 'RD$',
    },
    payment_gateways: {
      active_gateway: 'stripe',
    },
    complianceNotice: 'Plataforma privada de gestión patrimonial con cifrado y soberanía RLS.',
  },

  meridian: {
    id: '00000000-0000-0000-0000-000000000002',
    slug: 'meridian',
    name: 'Meridian Capital',
    legalName: 'Meridian Wealth & Asset Management Inc.',
    logoUrl: null,
    theme: {
      colors: {
        brandPrimary: '#10B981',
        brandAccent: '#38BDF8',
        bgMain: '#080E18',
        bgCard: '#0E1726',
        textPrimary: '#F8FAFC',
        textMuted: '#94A3B8',
        success: '#10B981',
        danger: '#F43F5E',
      },
      radius: {
        button: '10px',
        card: '14px',
        input: '8px',
      },
      fontFamily: "'Inter', -apple-system, sans-serif",
    },
    feature_flags: {
      crypto_module: false,
      loans_module: true,
      ai_advisor: true,
      fire_calculator: true,
      split_billing: false,
      cash_management: true,
      credit_management: true,
    },
    transaction_limits: {
      daily_transfer_limit_usd: 50000,
      single_tx_limit_usd: 15000,
      requires_2fa_threshold_usd: 2500,
      currency: 'USD',
    },
    payment_gateways: {
      active_gateway: 'stripe',
    },
    complianceNotice: 'Entidad de gestión patrimonial regulada bajo estándares internacionales.',
  },

  apex: {
    id: '00000000-0000-0000-0000-000000000003',
    slug: 'apex',
    name: 'Apex NeoBank',
    legalName: 'Apex Digital Banking Technologies Corp.',
    logoUrl: null,
    theme: {
      colors: {
        brandPrimary: '#8B5CF6',
        brandAccent: '#06B6D4',
        bgMain: '#0F0C1B',
        bgCard: '#171328',
        textPrimary: '#FFFFFF',
        textMuted: '#A78BFA',
        success: '#22C55E',
        danger: '#EF4444',
      },
      radius: {
        button: '12px',
        card: '16px',
        input: '10px',
      },
      fontFamily: "'Space Grotesk', sans-serif",
    },
    feature_flags: {
      crypto_module: true,
      loans_module: false,
      ai_advisor: false, // Neobanco sin módulo de Asesor IA
      fire_calculator: false,
      split_billing: true,
      cash_management: false,
      credit_management: true,
    },
    transaction_limits: {
      daily_transfer_limit_usd: 10000,
      single_tx_limit_usd: 2000,
      requires_2fa_threshold_usd: 800,
      currency: 'EUR',
    },
    payment_gateways: {
      active_gateway: 'stripe',
    },
    complianceNotice: 'Neobanco digital de alta velocidad. Emisión regulada de dinero electrónico.',
  },
}

export const DEFAULT_TENANT = PRESET_TENANTS.aureus
