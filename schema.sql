-- ============================================================
-- Lably — Supabase Database Setup
-- Run these in Supabase → SQL Editor
-- ============================================================


-- ── 1. Create the public users profile table ────────────────
-- Supabase Auth lives in auth.users (managed by Supabase).
-- We keep app-specific data here in public.users.

CREATE TABLE IF NOT EXISTS public.users (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT,
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  report_credits       INTEGER NOT NULL DEFAULT 0,
  subscription_status  TEXT,        -- active | cancelled | past_due | null
  subscription_end     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was created before these were added
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS report_credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;

-- Row-level security: users can only read their own row
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Index for fast Razorpay customer lookups
CREATE INDEX IF NOT EXISTS idx_users_razorpay ON public.users(razorpay_customer_id);


-- ── 2. Auto-create user row on signup ───────────────────────
-- Fires when someone signs up via Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, report_credits)
  VALUES (NEW.id, NEW.email, 1)  -- 1 free report on signup
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 3. Credit increment/decrement functions ──────────────────
-- Called from the webhook handler

CREATE OR REPLACE FUNCTION public.increment_credits(user_id UUID, amount INT DEFAULT 1)
RETURNS VOID AS $$
  UPDATE public.users
  SET report_credits = report_credits + amount
  WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_credits(user_id UUID)
RETURNS VOID AS $$
  UPDATE public.users
  SET report_credits = GREATEST(report_credits - 1, 0)
  WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;


-- ── 4. Report history table ──────────────────────────────────
-- Stores translated results per user (PDF never stored)

CREATE TABLE IF NOT EXISTS public.reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  lab_name     TEXT,
  report_date  TEXT,
  markers      JSONB NOT NULL,   -- full translated markers array
  summary      TEXT,
  flagged_count INTEGER DEFAULT 0
);

-- Row-level security: users can only read their own reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own reports" ON public.reports;
CREATE POLICY "Users see own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT is done server-side with the service role key (bypasses RLS).
-- No INSERT policy needed — service role always bypasses RLS.


-- ── 5. Payment idempotency table ──────────────────────────────
-- Prevents double-credit when /verify and webhook both fire.

CREATE TABLE IF NOT EXISTS public.payment_events (
  id           TEXT PRIMARY KEY,            -- Razorpay payment ID
  event_type   TEXT NOT NULL,               -- report_credit | subscription
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-level security: users can only read their own payment events
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own payment events" ON public.payment_events;
CREATE POLICY "Users see own payment events" ON public.payment_events
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT is done server-side with the service role key (bypasses RLS).
-- No INSERT policy needed — service role always bypasses RLS.


-- ── 6. Additional indexes for performance ────────────────────

CREATE INDEX IF NOT EXISTS idx_reports_user_created
  ON public.reports(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_subscription_end
  ON public.users(subscription_end)
  WHERE subscription_status = 'active';

CREATE INDEX IF NOT EXISTS idx_users_email
  ON public.users(email);


-- ── 7. Quick access view ───────────────────────────────────────

CREATE OR REPLACE VIEW public.user_billing
WITH (security_invoker = true) AS
SELECT
  id,
  email,
  report_credits,
  subscription_status,
  subscription_end,
  CASE
    WHEN subscription_status = 'active' THEN 'subscriber'
    WHEN subscription_end > NOW()       THEN 'subscriber'
    WHEN report_credits > 0             THEN 'credits'
    ELSE 'free'
  END AS access_level
FROM public.users;


-- ── 8. Secure the _view_backups table ──────────────────────────
-- Enable RLS on the _view_backups table to prevent unauthorized access

ALTER TABLE public._view_backups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "No public access to view backups" ON public._view_backups;

-- Restrictive policy: no direct access via PostgREST
-- Only service_role or authenticated admins can access this table
CREATE POLICY "No public access to view backups" ON public._view_backups
  FOR ALL USING (false);
