-- The Training Yard: booking integrity, team self-service, waiver evidence,
-- explicit Data API grants, and hardened RLS.
-- Additive and idempotent so it can be applied to the currently deployed schema.

-- ─── Normalize existing profile roles ──────────────────────────────────────
UPDATE public.profiles SET role = 'customer' WHERE role IS NULL OR role = 'user';
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'customer';

-- ─── Authoritative booking columns ─────────────────────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cage_units INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS turf_units INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS team_id UUID,
  ADD COLUMN IF NOT EXISTS package_type TEXT,
  ADD COLUMN IF NOT EXISTS credit_hours_used NUMERIC(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS waiver_signature_id UUID;

UPDATE public.bookings
SET stripe_payment_intent_id = payment_intent_id
WHERE stripe_payment_intent_id IS NULL AND payment_intent_id IS NOT NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS team_id UUID,
  ADD COLUMN IF NOT EXISTS team_package_id UUID,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS event_id TEXT;

-- ─── Service capacity ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_capacity (
  service_id TEXT PRIMARY KEY,
  cage_units INTEGER NOT NULL DEFAULT 0 CHECK (cage_units BETWEEN 0 AND 4),
  turf_units INTEGER NOT NULL DEFAULT 0 CHECK (turf_units BETWEEN 0 AND 2),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (30, 60, 90, 120)),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.service_capacity (service_id, cage_units, turf_units, duration_minutes) VALUES
  ('single_cage_30', 1, 0, 30),
  ('single_cage_60', 1, 0, 60),
  ('half_turf_60', 0, 1, 60),
  ('full_facility_60', 4, 2, 60),
  ('team_standard_60', 2, 1, 60),
  ('team_standard_90', 2, 1, 90),
  ('team_standard_120', 2, 1, 120),
  ('full_buyout_60', 4, 2, 60),
  ('full_buyout_90', 4, 2, 90),
  ('full_buyout_120', 4, 2, 120)
ON CONFLICT (service_id) DO UPDATE SET
  cage_units = EXCLUDED.cage_units,
  turf_units = EXCLUDED.turf_units,
  duration_minutes = EXCLUDED.duration_minutes,
  active = TRUE,
  updated_at = NOW();

-- ─── Teams, rosters, packages, and invitations ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_name TEXT,
  sport TEXT,
  age_group TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('owner','coach','manager')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited','active','removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, email)
);

CREATE TABLE IF NOT EXISTS public.team_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  guardian_name TEXT,
  guardian_email TEXT,
  guardian_relationship TEXT,
  waiver_signature_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('coach','manager')),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  purchased_by UUID NOT NULL REFERENCES auth.users(id),
  package_type TEXT NOT NULL CHECK (package_type IN ('standard','buyout')),
  package_name TEXT NOT NULL,
  hours_purchased NUMERIC(6,2) NOT NULL CHECK (hours_purchased > 0),
  hours_remaining NUMERIC(6,2) NOT NULL CHECK (hours_remaining >= 0),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','refunded','cancelled')),
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_package_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_package_id UUID NOT NULL REFERENCES public.team_packages(id),
  booking_id UUID REFERENCES public.bookings(id),
  hours_delta NUMERIC(6,2) NOT NULL,
  reason TEXT NOT NULL,
  source_event_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.team_package_ledger ADD COLUMN IF NOT EXISTS source_event_id TEXT;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_team_id_fkey,
  ADD CONSTRAINT bookings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_team_id_fkey,
  ADD CONSTRAINT payments_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL,
  DROP CONSTRAINT IF EXISTS payments_team_package_id_fkey,
  ADD CONSTRAINT payments_team_package_id_fkey FOREIGN KEY (team_package_id) REFERENCES public.team_packages(id) ON DELETE SET NULL;

-- ─── Versioned waiver evidence ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waiver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slug, version)
);

CREATE TABLE IF NOT EXISTS public.waiver_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.waiver_documents(id),
  user_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  participant_id UUID REFERENCES public.team_participants(id) ON DELETE SET NULL,
  participant_name TEXT NOT NULL,
  participant_date_of_birth DATE,
  signer_name TEXT NOT NULL,
  guardian_relationship TEXT,
  liability_accepted BOOLEAN NOT NULL CHECK (liability_accepted),
  photo_consent BOOLEAN NOT NULL DEFAULT FALSE,
  provider TEXT NOT NULL DEFAULT 'manual' CHECK (provider IN ('manual','zoho','admin')),
  provider_envelope_id TEXT,
  ip_address INET,
  user_agent TEXT,
  document_snapshot JSONB NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

INSERT INTO public.waiver_documents (slug, version, title, content, content_hash, active)
VALUES (
  'facility-liability-release',
  1,
  'Training Yard DSM Liability Waiver and Release',
  'Assumption of risk; release of liability; medical authorization; facility rules; optional photo and video consent; and parent or guardian consent for minor participants.',
  'training-yard-liability-release-v1',
  TRUE
)
ON CONFLICT (slug, version) DO UPDATE SET active = TRUE;

UPDATE public.waiver_documents
SET active = FALSE
WHERE slug = 'facility-liability-release' AND version <> 1;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_waiver_signature_id_fkey,
  ADD CONSTRAINT bookings_waiver_signature_id_fkey FOREIGN KEY (waiver_signature_id) REFERENCES public.waiver_signatures(id) ON DELETE SET NULL;

ALTER TABLE public.team_participants
  DROP CONSTRAINT IF EXISTS team_participants_waiver_signature_id_fkey,
  ADD CONSTRAINT team_participants_waiver_signature_id_fkey FOREIGN KEY (waiver_signature_id) REFERENCES public.waiver_signatures(id) ON DELETE SET NULL;

-- ─── Operational audit tables ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','processed','failed')),
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.lead_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organization_name TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending','delivered','failed')),
  delivery_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_capacity_window ON public.bookings (start_at, end_at, status);
CREATE INDEX IF NOT EXISTS idx_bookings_hold_expiry ON public.bookings (hold_expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_bookings_team_id ON public.bookings (team_id);
CREATE INDEX IF NOT EXISTS idx_blocked_times_created_by ON public.blocked_times (created_by);
CREATE INDEX IF NOT EXISTS idx_profiles_waiver_override_by ON public.profiles (waiver_override_by);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_participants_team_id ON public.team_participants (team_id);
CREATE INDEX IF NOT EXISTS idx_team_packages_team_status ON public.team_packages (team_id, status);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_user_id ON public.waiver_signatures (user_id);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_team_id ON public.waiver_signatures (team_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_event_id_unique ON public.payments (event_id) WHERE event_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_ledger_event_unique ON public.team_package_ledger (source_event_id) WHERE source_event_id IS NOT NULL;

DROP INDEX IF EXISTS public.idx_bookings_date;
DROP INDEX IF EXISTS public.idx_bookings_email;
DROP INDEX IF EXISTS public.idx_bookings_status;
DROP INDEX IF EXISTS public.idx_bookings_stripe_session;

-- ─── Atomic booking hold ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_booking_hold(
  p_user_id UUID,
  p_team_id UUID,
  p_service_type TEXT,
  p_service_label TEXT,
  p_duration_minutes INTEGER,
  p_booking_date DATE,
  p_booking_time TEXT,
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ,
  p_cage_units INTEGER,
  p_turf_units INTEGER,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_player_name TEXT,
  p_player_age INTEGER,
  p_sport TEXT,
  p_notes TEXT,
  p_waiver_accepted BOOLEAN,
  p_waiver_signer_name TEXT,
  p_amount_cents INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_booking_id UUID;
  v_cages INTEGER;
  v_turf INTEGER;
BEGIN
  IF p_start_at IS NULL OR p_end_at IS NULL OR p_end_at <= p_start_at THEN
    RAISE EXCEPTION 'invalid_booking_window' USING ERRCODE = '22023';
  END IF;
  IF p_cage_units < 0 OR p_turf_units < 0 OR p_cage_units > 4 OR p_turf_units > 2 THEN
    RAISE EXCEPTION 'invalid_capacity_request' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_start_at::TEXT || ':' || p_end_at::TEXT, 0));

  UPDATE public.bookings
  SET status = 'expired', payment_status = 'failed', updated_at = NOW()
  WHERE status = 'pending' AND hold_expires_at IS NOT NULL AND hold_expires_at <= NOW();

  IF EXISTS (
    SELECT 1 FROM public.blocked_times
    WHERE start_at < p_end_at AND end_at > p_start_at
  ) THEN
    RAISE EXCEPTION 'slot_blocked' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(SUM(cage_units), 0), COALESCE(SUM(turf_units), 0)
  INTO v_cages, v_turf
  FROM public.bookings
  WHERE start_at < p_end_at
    AND end_at > p_start_at
    AND (
      status = 'confirmed'
      OR (status = 'pending' AND hold_expires_at > NOW())
    );

  IF v_cages + p_cage_units > 4 OR v_turf + p_turf_units > 2 THEN
    RAISE EXCEPTION 'slot_unavailable' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.bookings (
    user_id, team_id, service_type, service_label, duration_minutes,
    booking_date, booking_time, start_at, end_at, cage_units, turf_units,
    customer_name, customer_email, customer_phone, player_name, player_age,
    sport, notes, waiver_accepted, waiver_signer_name, waiver_signed_at,
    amount_cents, status, payment_status, hold_expires_at
  ) VALUES (
    p_user_id, p_team_id, p_service_type, p_service_label, p_duration_minutes,
    p_booking_date, p_booking_time, p_start_at, p_end_at, p_cage_units, p_turf_units,
    p_customer_name, p_customer_email, p_customer_phone, NULLIF(p_player_name, ''), p_player_age,
    NULLIF(p_sport, ''), NULLIF(p_notes, ''), p_waiver_accepted, NULLIF(p_waiver_signer_name, ''),
    CASE WHEN p_waiver_accepted THEN NOW() ELSE NULL END,
    p_amount_cents, 'pending', 'pending', NOW() + INTERVAL '30 minutes'
  ) RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

-- ─── Atomic team credit redemption ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.redeem_team_booking(
  p_booking_id UUID,
  p_team_id UUID,
  p_user_id UUID,
  p_package_type TEXT,
  p_hours NUMERIC
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_remaining NUMERIC := p_hours;
  v_take NUMERIC;
  v_package RECORD;
BEGIN
  IF p_hours <= 0 OR p_package_type NOT IN ('standard','buyout') THEN
    RAISE EXCEPTION 'invalid_team_credit_request' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_team_id::TEXT || ':' || p_package_type, 0));

  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
      AND status = 'active' AND role IN ('owner','coach','manager')
  ) THEN
    RAISE EXCEPTION 'team_access_denied' USING ERRCODE = '42501';
  END IF;

  FOR v_package IN
    SELECT id, hours_remaining
    FROM public.team_packages
    WHERE team_id = p_team_id AND package_type = p_package_type
      AND status = 'active' AND hours_remaining > 0
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY COALESCE(expires_at, 'infinity'::TIMESTAMPTZ), created_at
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_take := LEAST(v_package.hours_remaining, v_remaining);
    UPDATE public.team_packages SET hours_remaining = hours_remaining - v_take WHERE id = v_package.id;
    INSERT INTO public.team_package_ledger (team_package_id, booking_id, hours_delta, reason, created_by)
    VALUES (v_package.id, p_booking_id, -v_take, 'booking redemption', p_user_id);
    v_remaining := v_remaining - v_take;
  END LOOP;

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'insufficient_team_hours' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.bookings
  SET team_id = p_team_id,
      package_type = p_package_type,
      credit_hours_used = p_hours,
      amount_cents = 0,
      status = 'confirmed',
      payment_status = 'paid',
      confirmed_at = NOW(),
      hold_expires_at = NULL,
      updated_at = NOW()
  WHERE id = p_booking_id AND user_id = p_user_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_hold_not_found' USING ERRCODE = 'P0001';
  END IF;

  RETURN p_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_team_booking_credit(
  p_booking_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_booking RECORD;
  v_ledger RECORD;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF v_booking.id IS NULL OR (v_booking.user_id <> p_user_id) THEN
    RAISE EXCEPTION 'booking_not_found' USING ERRCODE = 'P0001';
  END IF;
  IF v_booking.status = 'cancelled' THEN RETURN FALSE; END IF;

  FOR v_ledger IN
    SELECT team_package_id, -hours_delta AS hours_to_restore
    FROM public.team_package_ledger
    WHERE booking_id = p_booking_id AND hours_delta < 0
  LOOP
    UPDATE public.team_packages
    SET hours_remaining = hours_remaining + v_ledger.hours_to_restore
    WHERE id = v_ledger.team_package_id;
    INSERT INTO public.team_package_ledger (team_package_id, booking_id, hours_delta, reason, created_by)
    VALUES (v_ledger.team_package_id, p_booking_id, v_ledger.hours_to_restore, 'booking cancellation restore', p_user_id);
  END LOOP;

  UPDATE public.bookings SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = 'Customer cancelled via portal', updated_at = NOW()
  WHERE id = p_booking_id;
  RETURN TRUE;
END;
$$;

-- ─── RLS and explicit Data API privileges ──────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_package_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
    AND tablename IN ('profiles','bookings','payments','blocked_times','system_settings','service_capacity','teams','team_members','team_participants','team_invitations','team_packages','team_package_ledger','waiver_documents','waiver_signatures','stripe_webhook_events','lead_submissions')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

REVOKE ALL ON TABLE public.profiles, public.bookings, public.payments, public.blocked_times,
  public.system_settings, public.service_capacity, public.teams, public.team_members,
  public.team_participants, public.team_invitations, public.team_packages,
  public.team_package_ledger, public.waiver_documents, public.waiver_signatures,
  public.stripe_webhook_events, public.lead_submissions FROM anon, authenticated;

GRANT SELECT ON public.profiles, public.bookings, public.payments, public.teams,
  public.team_members, public.team_participants, public.team_packages,
  public.team_package_ledger, public.waiver_signatures TO authenticated;
GRANT SELECT ON public.blocked_times, public.service_capacity, public.waiver_documents TO anon, authenticated;

CREATE POLICY profiles_own_read ON public.profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);
CREATE POLICY bookings_own_read ON public.bookings FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY payments_own_read ON public.payments FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY blocks_public_read ON public.blocked_times FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY service_capacity_public_read ON public.service_capacity FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY teams_member_read ON public.teams FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()) OR id IN (SELECT team_id FROM public.team_members WHERE user_id = (SELECT auth.uid()) AND status = 'active'));
CREATE POLICY team_members_own_read ON public.team_members FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY team_participants_member_read ON public.team_participants FOR SELECT TO authenticated
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = (SELECT auth.uid()) AND status = 'active'));
CREATE POLICY team_packages_member_read ON public.team_packages FOR SELECT TO authenticated
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = (SELECT auth.uid()) AND status = 'active'));
CREATE POLICY team_ledger_member_read ON public.team_package_ledger FOR SELECT TO authenticated
  USING (team_package_id IN (SELECT id FROM public.team_packages));
CREATE POLICY waiver_documents_public_read ON public.waiver_documents FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY waiver_signatures_own_read ON public.waiver_signatures FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = (SELECT auth.uid()) AND status = 'active'));

-- Trigger functions remain executable by their triggers, not through PostgREST.
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_catalog;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='is_admin' AND p.pronargs=0) THEN
    EXECUTE 'ALTER FUNCTION public.is_admin() SET search_path = public, pg_catalog';
    EXECUTE 'REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.create_booking_hold(UUID,UUID,TEXT,TEXT,INTEGER,DATE,TEXT,TIMESTAMPTZ,TIMESTAMPTZ,INTEGER,INTEGER,TEXT,TEXT,TEXT,TEXT,INTEGER,TEXT,TEXT,BOOLEAN,TEXT,INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_hold(UUID,UUID,TEXT,TEXT,INTEGER,DATE,TEXT,TIMESTAMPTZ,TIMESTAMPTZ,INTEGER,INTEGER,TEXT,TEXT,TEXT,TEXT,INTEGER,TEXT,TEXT,BOOLEAN,TEXT,INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.redeem_team_booking(UUID,UUID,UUID,TEXT,NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_team_booking(UUID,UUID,UUID,TEXT,NUMERIC) TO service_role;
REVOKE ALL ON FUNCTION public.restore_team_booking_credit(UUID,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_team_booking_credit(UUID,UUID) TO service_role;
