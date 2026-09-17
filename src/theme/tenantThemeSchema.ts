import { z } from 'zod'

const HexColor = z.string().regex(
  /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/,
  'Color hexadecimal inválido'
)

export const TenantColorsSchema = z.object({
  brandPrimary: HexColor.default('#C9A84C'),
  brandAccent: HexColor.default('#F3CA65'),
  bgMain: HexColor.default('#0B0C10'),
  bgCard: HexColor.default('#111319'),
  textPrimary: HexColor.default('#FFFFFF'),
  textMuted: HexColor.default('#8E95A5'),
  success: HexColor.default('#10B981'),
  danger: HexColor.default('#EF4444'),
}).default({
  brandPrimary: '#C9A84C',
  brandAccent: '#F3CA65',
  bgMain: '#0B0C10',
  bgCard: '#111319',
  textPrimary: '#FFFFFF',
  textMuted: '#8E95A5',
  success: '#10B981',
  danger: '#EF4444',
})

export const TenantRadiusSchema = z.object({
  button: z.string().default('9999px'),
  card: z.string().default('16px'),
  input: z.string().default('10px'),
}).default({
  button: '9999px',
  card: '16px',
  input: '10px',
})

export const TenantThemeConfigSchema = z.object({
  colors: TenantColorsSchema,
  radius: TenantRadiusSchema,
  fontFamily: z.string().default("'Space Grotesk', -apple-system, sans-serif"),
}).default({
  colors: {
    brandPrimary: '#C9A84C',
    brandAccent: '#F3CA65',
    bgMain: '#0B0C10',
    bgCard: '#111319',
    textPrimary: '#FFFFFF',
    textMuted: '#8E95A5',
    success: '#10B981',
    danger: '#EF4444',
  },
  radius: {
    button: '9999px',
    card: '16px',
    input: '10px',
  },
  fontFamily: "'Space Grotesk', -apple-system, sans-serif",
})

export const TenantFeatureFlagsSchema = z.object({
  crypto_module: z.boolean().default(false),
  loans_module: z.boolean().default(false),
  ai_advisor: z.boolean().default(true),
  fire_calculator: z.boolean().default(true),
  split_billing: z.boolean().default(false),
  cash_management: z.boolean().default(true),
  credit_management: z.boolean().default(true),
}).default({
  crypto_module: false,
  loans_module: false,
  ai_advisor: true,
  fire_calculator: true,
  split_billing: false,
  cash_management: true,
  credit_management: true,
})

export const TenantLimitsSchema = z.object({
  daily_transfer_limit_usd: z.number().positive().default(10000),
  single_tx_limit_usd: z.number().positive().default(2500),
  requires_2fa_threshold_usd: z.number().positive().default(1000),
  currency: z.string().default('RD$'),
}).default({
  daily_transfer_limit_usd: 10000,
  single_tx_limit_usd: 2500,
  requires_2fa_threshold_usd: 1000,
  currency: 'RD$',
})

export const TenantPaymentGatewaysSchema = z.object({
  active_gateway: z.enum(['stripe', 'adyen', 'manual']).default('stripe'),
  stripe_publishable_key: z.string().optional(),
}).default({
  active_gateway: 'stripe',
})

export const TenantConfigSchema = z.object({
  id: z.string().uuid().or(z.string()),
  slug: z.string().min(1),
  name: z.string().min(1),
  legalName: z.string().default('Entidad Financiera Certificada'),
  domain: z.string().optional(),
  logoUrl: z.string().nullable().default(null),
  theme: TenantThemeConfigSchema,
  feature_flags: TenantFeatureFlagsSchema,
  transaction_limits: TenantLimitsSchema,
  payment_gateways: TenantPaymentGatewaysSchema,
  complianceNotice: z.string().default('Operando bajo normativas de transparencia algorítmica y soberanía RLS.'),
})

export type TenantColors = z.infer<typeof TenantColorsSchema>
export type TenantRadius = z.infer<typeof TenantRadiusSchema>
export type TenantTheme = z.infer<typeof TenantThemeConfigSchema>
export type TenantFeatureFlags = z.infer<typeof TenantFeatureFlagsSchema>
export type TenantLimits = z.infer<typeof TenantLimitsSchema>
export type TenantPaymentGateways = z.infer<typeof TenantPaymentGatewaysSchema>
export type TenantConfig = z.infer<typeof TenantConfigSchema>
