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

-- ==============================================================================
-- 🔒 POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- Cada usuario solo puede ver, insertar, actualizar y borrar sus propios datos
-- ==============================================================================

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_withdrawals ENABLE ROW LEVEL SECURITY;

-- Políticas para Incomes
CREATE POLICY "Users can view their own incomes" ON public.incomes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own incomes" ON public.incomes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own incomes" ON public.incomes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own incomes" ON public.incomes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Expenses
CREATE POLICY "Users can view their own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Cash Withdrawals
CREATE POLICY "Users can view their own cash withdrawals" ON public.cash_withdrawals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cash withdrawals" ON public.cash_withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cash withdrawals" ON public.cash_withdrawals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cash withdrawals" ON public.cash_withdrawals
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- ⚡ SINCRONIZACIÓN EN TIEMPO REAL (Realtime Publications)
-- ==============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.incomes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_withdrawals;
