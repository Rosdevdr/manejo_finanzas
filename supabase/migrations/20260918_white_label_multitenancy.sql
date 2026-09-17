-- ==========================================================================
-- AUREUS WHITE-LABEL MULTI-TENANCY & ROW-LEVEL SECURITY MIGRATION
-- Framework para soporte de múltiples bancos, neobancos y firmas patrimoniales
-- ==========================================================================

-- 1. Tabla Maestra de Clientes de Marca Blanca (Tenants)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  logo_url TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Configuración Modular de Tenant (Feature Flags, Límites y Pasarelas)
CREATE TABLE IF NOT EXISTS public.tenant_configurations (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_flags JSONB NOT NULL DEFAULT '{
    "crypto_module": false,
    "loans_module": false,
    "ai_advisor": true,
    "fire_calculator": true,
    "split_billing": true,
    "cash_management": true,
    "credit_management": true
  }'::jsonb,
  transaction_limits JSONB NOT NULL DEFAULT '{
    "daily_transfer_limit_usd": 25000,
    "single_tx_limit_usd": 5000,
    "requires_2fa_threshold_usd": 1500,
    "currency": "RD$"
  }'::jsonb,
  payment_gateways JSONB NOT NULL DEFAULT '{
    "active_gateway": "stripe",
    "supported_gateways": ["stripe"],
    "credentials": {
      "stripe_publishable_key": ""
    }
  }'::jsonb,
  theme_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  compliance_notice TEXT DEFAULT 'Plataforma privada con aislamiento y soberanía de datos RLS.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Inserción de Tenants Base (AUREUS, Meridian Capital, Apex NeoBank)
INSERT INTO public.tenants (id, slug, name, legal_name, status)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'aureus', 'AUREUS Wealth', 'AUREUS Private Wealth Technologies S.R.L.', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'meridian', 'Meridian Capital', 'Meridian Wealth & Asset Management Inc.', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'apex', 'Apex NeoBank', 'Apex Digital Banking Technologies Corp.', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tenant_configurations (tenant_id, feature_flags, transaction_limits)
VALUES
  ('00000000-0000-0000-0000-000000000001', '{
    "crypto_module": false,
    "loans_module": false,
    "ai_advisor": true,
    "fire_calculator": true,
    "split_billing": true,
    "cash_management": true,
    "credit_management": true
  }', '{"daily_transfer_limit_usd": 25000, "single_tx_limit_usd": 5000, "currency": "RD$"}'),
  ('00000000-0000-0000-0000-000000000002', '{
    "crypto_module": false,
    "loans_module": true,
    "ai_advisor": true,
    "fire_calculator": true,
    "split_billing": false,
    "cash_management": true,
    "credit_management": true
  }', '{"daily_transfer_limit_usd": 50000, "single_tx_limit_usd": 15000, "currency": "USD"}'),
  ('00000000-0000-0000-0000-000000000003', '{
    "crypto_module": true,
    "loans_module": false,
    "ai_advisor": false,
    "fire_calculator": false,
    "split_billing": true,
    "cash_management": false,
    "credit_management": true
  }', '{"daily_transfer_limit_usd": 10000, "single_tx_limit_usd": 2000, "currency": "EUR"}')
ON CONFLICT (tenant_id) DO NOTHING;

-- 4. Función de Seguridad para Extracción del Tenant ID del Usuario Autenticado
CREATE OR REPLACE FUNCTION auth.get_user_tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'tenant_id')::UUID,
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb -> 'user_metadata' ->> 'tenant_id')::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID -- Fallback a AUREUS default
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Ejemplo de Políticas RLS Restrictivas
-- ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
-- ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';

-- CREATE POLICY tenant_incomes_isolation ON public.incomes
--   AS RESTRICTIVE
--   FOR ALL
--   TO authenticated
--   USING (tenant_id = auth.get_user_tenant_id())
--   WITH CHECK (tenant_id = auth.get_user_tenant_id());
