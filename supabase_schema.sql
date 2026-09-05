-- ==============================================================================
-- 💰 AUREUS WEALTH ADVISOR · SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase (https://supabase.com)

-- 1. TABLA: INGRESOS (incomes)
CREATE TABLE IF NOT EXISTS public.incomes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('salary', 'freelance', 'investment', 'extra')),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA: GASTOS (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (category IN ('housing', 'food', 'transport', 'utilities', 'health', 'entertainment', 'education', 'debt', 'other')),
  type TEXT NOT NULL CHECK (type IN ('fixed', 'variable')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'debit_card', 'credit_card', 'cash')),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: RETIROS EN EFECTIVO (cash_withdrawals)
CREATE TABLE IF NOT EXISTS public.cash_withdrawals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL CHECK (reason IN ('pocket_money', 'specific_service', 'leisure_nightout', 'emergency', 'unassigned')),
  note TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA: TARJETAS DE CRÉDITO (credit_cards)
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  last_four_digits VARCHAR(4) NOT NULL DEFAULT '0000' CHECK (last_four_digits ~ '^[0-9]{4}$'),
  credit_limit NUMERIC(12, 2) NOT NULL CHECK (credit_limit > 0),
  cutoff_day INTEGER NOT NULL CHECK (cutoff_day BETWEEN 1 AND 31),
  payment_due_day INTEGER NOT NULL CHECK (payment_due_day BETWEEN 1 AND 31),
  interest_rate NUMERIC(5, 2),
  color TEXT NOT NULL DEFAULT 'gold',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA: TRANSACCIONES / CARGOS DE TARJETA (credit_card_transactions)
CREATE TABLE IF NOT EXISTS public.credit_card_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (category IN ('housing', 'food', 'transport', 'utilities', 'health', 'entertainment', 'education', 'debt', 'other')),
  date DATE NOT NULL,
  installments INTEGER NOT NULL DEFAULT 1 CHECK (installments >= 1),
  current_installment INTEGER NOT NULL DEFAULT 1 CHECK (current_installment >= 1),
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 🔒 POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- Cada usuario solo puede ver, insertar, actualizar y borrar sus propios datos
-- Se incluye WITH CHECK en UPDATE para prevenir escalamiento y reasignación de filas
-- ==============================================================================

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para Incomes
CREATE POLICY "Users can view their own incomes" ON public.incomes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own incomes" ON public.incomes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own incomes" ON public.incomes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own incomes" ON public.incomes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Expenses
CREATE POLICY "Users can view their own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Cash Withdrawals
CREATE POLICY "Users can view their own cash withdrawals" ON public.cash_withdrawals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cash withdrawals" ON public.cash_withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cash withdrawals" ON public.cash_withdrawals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cash withdrawals" ON public.cash_withdrawals
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Credit Cards (Protección PCI-DSS & Privacidad Bancaria)
CREATE POLICY "Users can view their own credit cards" ON public.credit_cards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credit cards" ON public.credit_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credit cards" ON public.credit_cards
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own credit cards" ON public.credit_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Credit Card Transactions
CREATE POLICY "Users can view their own card transactions" ON public.credit_card_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own card transactions" ON public.credit_card_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own card transactions" ON public.credit_card_transactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own card transactions" ON public.credit_card_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 🚀 ÍNDICES DE RENDIMIENTO Y AISLAMIENTO DE CONSULTAS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_incomes_user_period ON public.incomes(user_id, period);
CREATE INDEX IF NOT EXISTS idx_expenses_user_period ON public.expenses(user_id, period);
CREATE INDEX IF NOT EXISTS idx_cash_user_period ON public.cash_withdrawals(user_id, period);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user_card ON public.credit_card_transactions(user_id, card_id, is_paid);

-- ==============================================================================
-- 🛡️ TABLA DE AUDITORÍA DE SEGURIDAD (Audit Trail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ==============================================================================
-- ⚡ SINCRONIZACIÓN EN TIEMPO REAL (Realtime Publications)
-- ==============================================================================

ALTER TABLE public.incomes REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER TABLE public.cash_withdrawals REPLICA IDENTITY FULL;
ALTER TABLE public.credit_cards REPLICA IDENTITY FULL;
ALTER TABLE public.credit_card_transactions REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.incomes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_card_transactions;

