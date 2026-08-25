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
  last_four_digits TEXT NOT NULL,
  credit_limit NUMERIC(12, 2) NOT NULL CHECK (credit_limit > 0),
  cutoff_day INTEGER NOT NULL CHECK (cutoff_day BETWEEN 1 AND 31),
  payment_due_day INTEGER NOT NULL CHECK (payment_due_day BETWEEN 1 AND 31),
  interest_rate NUMERIC(5, 2),
  color TEXT DEFAULT 'gold' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA: TRANSACCIONES DE TARJETA (credit_card_transactions)
CREATE TABLE IF NOT EXISTS public.credit_card_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  date DATE NOT NULL,
  installments INTEGER DEFAULT 1 NOT NULL,
  current_installment INTEGER DEFAULT 1 NOT NULL,
  is_paid BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA: PRESUPUESTOS POR CATEGORÍA (category_budgets)
CREATE TABLE IF NOT EXISTS public.category_budgets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('housing', 'food', 'transport', 'utilities', 'health', 'entertainment', 'education', 'debt', 'other')),
  limit_amount NUMERIC(12, 2) NOT NULL CHECK (limit_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_period_category UNIQUE (user_id, period, category)
);

-- 7. TABLA: METAS DE AHORRO & FONDOS (savings_goals)
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (current_amount >= 0),
  monthly_contribution NUMERIC(12, 2) DEFAULT 0,
  target_date DATE,
  category TEXT NOT NULL CHECK (category IN ('emergency', 'vacation', 'car', 'home', 'investment', 'education', 'tech', 'other')),
  color TEXT DEFAULT '#34D399',
  is_completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 🔒 POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- ==============================================================================

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Incomes Policies
CREATE POLICY "Users can view their own incomes" ON public.incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own incomes" ON public.incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own incomes" ON public.incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own incomes" ON public.incomes FOR DELETE USING (auth.uid() = user_id);

-- Expenses Policies
CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- Cash Withdrawals Policies
CREATE POLICY "Users can view their own cash withdrawals" ON public.cash_withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cash withdrawals" ON public.cash_withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cash withdrawals" ON public.cash_withdrawals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cash withdrawals" ON public.cash_withdrawals FOR DELETE USING (auth.uid() = user_id);

-- Credit Cards Policies
CREATE POLICY "Users can view their own credit cards" ON public.credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credit cards" ON public.credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credit cards" ON public.credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own credit cards" ON public.credit_cards FOR DELETE USING (auth.uid() = user_id);

-- Credit Card Transactions Policies
CREATE POLICY "Users can view their own credit transactions" ON public.credit_card_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credit transactions" ON public.credit_card_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credit transactions" ON public.credit_card_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own credit transactions" ON public.credit_card_transactions FOR DELETE USING (auth.uid() = user_id);

-- Category Budgets Policies
CREATE POLICY "Users can view their own budgets" ON public.category_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budgets" ON public.category_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON public.category_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON public.category_budgets FOR DELETE USING (auth.uid() = user_id);

-- Savings Goals Policies
CREATE POLICY "Users can view their own savings goals" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own savings goals" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own savings goals" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own savings goals" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- ⚡ SINCRONIZACIÓN EN TIEMPO REAL (Realtime Publications)
-- ==============================================================================

ALTER TABLE public.incomes REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER TABLE public.cash_withdrawals REPLICA IDENTITY FULL;
ALTER TABLE public.credit_cards REPLICA IDENTITY FULL;
ALTER TABLE public.credit_card_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.category_budgets REPLICA IDENTITY FULL;
ALTER TABLE public.savings_goals REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.incomes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_card_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.category_budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_goals;
