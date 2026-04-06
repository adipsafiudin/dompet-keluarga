-- Dompet Keluarga — Database Schema
-- Jalankan di Supabase SQL Editor

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABEL UTAMA
-- ============================================================

CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.families (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  owner_id    UUID REFERENCES public.profiles(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.family_members (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id   UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role        TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  nickname    TEXT DEFAULT NULL,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);
-- Migration (run if table already exists):
-- ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT NULL;

CREATE TABLE public.family_invitations (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id   UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  email       TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  used_by     UUID REFERENCES public.profiles(id),
  created_by  UUID REFERENCES public.profiles(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.accounts (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id       UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT CHECK (type IN ('cash','bank','e_wallet','investment','other')) DEFAULT 'cash',
  bank_name       TEXT,
  color           TEXT DEFAULT '#10B981',
  icon            TEXT DEFAULT 'wallet',
  initial_balance BIGINT DEFAULT 0,
  current_balance BIGINT DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  sort_order      INT DEFAULT 0,
  created_by      UUID REFERENCES public.profiles(id) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.categories (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id    UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT CHECK (type IN ('income','expense')) NOT NULL,
  icon         TEXT DEFAULT 'tag',
  color        TEXT DEFAULT '#6B7280',
  budget_limit BIGINT,
  is_active    BOOLEAN DEFAULT TRUE,
  is_default   BOOLEAN DEFAULT FALSE,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.income_sources (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id  UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT DEFAULT 'briefcase',
  color      TEXT DEFAULT '#10B981',
  is_active  BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transactions (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id        UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  type             TEXT CHECK (type IN ('income','expense','transfer')) NOT NULL,
  amount           BIGINT NOT NULL CHECK (amount > 0),
  description      TEXT,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id      UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id       UUID REFERENCES public.accounts(id) NOT NULL,
  to_account_id    UUID REFERENCES public.accounts(id),
  income_source_id UUID REFERENCES public.income_sources(id) ON DELETE SET NULL,
  created_by       UUID REFERENCES public.profiles(id) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_sources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions       ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_family_member(fam_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = fam_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);
-- Allow family members to read each other's profiles
CREATE POLICY "profiles_family_members" ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm1
      JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid() AND fm2.user_id = id
    )
  );
-- Migration (run if table already exists):
-- CREATE POLICY "profiles_family_members" ON public.profiles FOR SELECT
--   USING (EXISTS (SELECT 1 FROM public.family_members fm1
--     JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
--     WHERE fm1.user_id = auth.uid() AND fm2.user_id = id));
CREATE POLICY "families_member" ON public.families FOR SELECT USING (is_family_member(id));
CREATE POLICY "families_insert" ON public.families FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "families_owner_update" ON public.families FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "members_select" ON public.family_members FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "members_insert_self" ON public.family_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "members_delete" ON public.family_members FOR DELETE
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.families WHERE id = family_id AND owner_id = auth.uid()));
CREATE POLICY "members_update" ON public.family_members FOR UPDATE
  USING (is_family_member(family_id))
  WITH CHECK (is_family_member(family_id));
CREATE POLICY "invitations_family" ON public.family_invitations FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "invitations_insert" ON public.family_invitations FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "invitations_update_all" ON public.family_invitations FOR UPDATE USING (TRUE);
CREATE POLICY "accounts_family" ON public.accounts FOR ALL USING (is_family_member(family_id));
CREATE POLICY "categories_family" ON public.categories FOR ALL USING (is_family_member(family_id));
CREATE POLICY "income_sources_family" ON public.income_sources FOR ALL USING (is_family_member(family_id));
CREATE POLICY "transactions_family" ON public.transactions FOR ALL USING (is_family_member(family_id));

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' THEN
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.to_account_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.to_account_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.to_account_id;
    END IF;
    IF NEW.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' THEN
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.to_account_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- INDEX untuk performa query
-- ============================================================
CREATE INDEX idx_transactions_family_date ON public.transactions(family_id, date DESC);
CREATE INDEX idx_transactions_family_type ON public.transactions(family_id, type);
CREATE INDEX idx_transactions_category    ON public.transactions(category_id);
CREATE INDEX idx_transactions_account     ON public.transactions(account_id);
CREATE INDEX idx_family_members_user      ON public.family_members(user_id);
CREATE INDEX idx_invitations_code         ON public.family_invitations(code);
