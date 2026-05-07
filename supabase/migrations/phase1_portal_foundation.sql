-- ============================================================
-- The Training Yard — Phase 1 Database Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE — add all new columns
-- ────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role                  TEXT NOT NULL DEFAULT 'customer'
                                                 CHECK (role IN ('customer', 'admin')),
  ADD COLUMN IF NOT EXISTS phone                 TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact     TEXT,
  ADD COLUMN IF NOT EXISTS membership_type       TEXT,        -- 'individual' | 'family' | 'team_vip_standard' | 'team_vip_full'
  ADD COLUMN IF NOT EXISTS membership_status     TEXT DEFAULT 'none'
                                                 CHECK (membership_status IN ('none','active','past_due','canceled','expiring_soon')),
  ADD COLUMN IF NOT EXISTS membership_start      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_expires    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waiver_signed         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS waiver_signed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waiver_override_by    UUID REFERENCES auth.users(id), -- admin who manually approved
  ADD COLUMN IF NOT EXISTS stripe_customer_id    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for fast Stripe lookup
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ────────────────────────────────────────────────────────────
-- 2. BOOKINGS TABLE — add missing columns
-- ────────────────────────────────────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS user_id               UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'pending'
                                                 CHECK (payment_status IN ('pending','paid','refunded','failed')),
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason   TEXT;

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- ────────────────────────────────────────────────────────────
-- 3. PAYMENTS TABLE — new table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID REFERENCES auth.users(id),
  booking_id                UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount_cents              INTEGER NOT NULL,
  stripe_payment_intent_id  TEXT,
  stripe_refund_id          TEXT,
  status                    TEXT NOT NULL DEFAULT 'paid'
                            CHECK (status IN ('paid','refunded','partially_refunded','failed')),
  refund_amount_cents       INTEGER,
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ────────────────────────────────────────────────────────────
-- 4. BLOCKED_TIMES TABLE — new table (granular per resource)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_times (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ NOT NULL,
  resource_id TEXT,   -- NULL = facility-wide block; otherwise e.g. 'cage-1', 'half-turf'
  reason      TEXT,   -- 'maintenance' | 'private event' | 'holiday' | 'other'
  all_day     BOOLEAN DEFAULT FALSE,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_times_start ON blocked_times(start_at);
CREATE INDEX IF NOT EXISTS idx_blocked_times_resource ON blocked_times(resource_id);

-- ────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY — enable and set policies
-- ────────────────────────────────────────────────────────────

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY IF NOT EXISTS "profiles_own_read"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "profiles_own_update"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles (checked via role column)
CREATE POLICY IF NOT EXISTS "profiles_admin_read"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- PAYMENTS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY IF NOT EXISTS "payments_own_read"
  ON payments FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all payments
CREATE POLICY IF NOT EXISTS "payments_admin_read"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Service role bypass (for webhooks)
CREATE POLICY IF NOT EXISTS "payments_service_insert"
  ON payments FOR INSERT WITH CHECK (TRUE);

-- BLOCKED_TIMES
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with blocked times
CREATE POLICY IF NOT EXISTS "blocks_admin_all"
  ON blocked_times FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Anyone can read blocks (needed for availability check)
CREATE POLICY IF NOT EXISTS "blocks_public_read"
  ON blocked_times FOR SELECT USING (TRUE);

-- ────────────────────────────────────────────────────────────
-- 6. AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'customer',    -- all new signups are customers by default
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to avoid duplicate triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 7. GRANT YOUR OWN ACCOUNT ADMIN ROLE
-- Replace 'your-email@example.com' with your actual email.
-- ────────────────────────────────────────────────────────────
-- UPDATE profiles SET role = 'admin'
-- WHERE email = 'your-email@example.com';
-- (Uncomment the two lines above and run separately after inserting your email)
