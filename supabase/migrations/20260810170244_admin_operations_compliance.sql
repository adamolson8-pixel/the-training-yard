-- Administrative operations, capacity-aware blocks, and compliance records.

ALTER TABLE public.blocked_times
  ADD COLUMN IF NOT EXISTS cage_units INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS turf_units INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

UPDATE public.blocked_times
SET cage_units = CASE
      WHEN resource_id IS NULL THEN 4
      WHEN resource_id IN ('cage-1', 'cage-2', 'cage-3', 'cage-4') THEN 1
      ELSE 0
    END,
    turf_units = CASE
      WHEN resource_id IS NULL THEN 2
      WHEN resource_id = 'half-turf' THEN 1
      WHEN resource_id = 'full-turf' THEN 2
      ELSE 0
    END
WHERE cage_units = 0 AND turf_units = 0;

ALTER TABLE public.blocked_times
  DROP CONSTRAINT IF EXISTS blocked_times_capacity_check,
  ADD CONSTRAINT blocked_times_capacity_check CHECK (
    cage_units BETWEEN 0 AND 4 AND turf_units BETWEEN 0 AND 2
    AND (cage_units > 0 OR turf_units > 0)
  );

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS created_by_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_source TEXT NOT NULL DEFAULT 'online'
    CHECK (booking_source IN ('online', 'team_portal', 'admin'));

ALTER TABLE public.waiver_signatures
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE public.waiver_signatures
SET expires_at = signed_at + INTERVAL '1 year'
WHERE expires_at IS NULL;

CREATE TABLE IF NOT EXISTS public.compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('waiver', 'contract', 'other')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'team', 'participant')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.team_participants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'signed' CHECK (status IN ('pending', 'signed', 'active', 'expired', 'revoked')),
  storage_path TEXT,
  original_filename TEXT,
  mime_type TEXT,
  signer_name TEXT,
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT compliance_documents_entity_check CHECK (
    (entity_type = 'user' AND user_id IS NOT NULL AND team_id IS NULL AND participant_id IS NULL)
    OR (entity_type = 'team' AND team_id IS NOT NULL AND user_id IS NULL AND participant_id IS NULL)
    OR (entity_type = 'participant' AND participant_id IS NOT NULL AND user_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compliance-documents',
  'compliance-documents',
  FALSE,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE INDEX IF NOT EXISTS idx_blocked_times_window_capacity
  ON public.blocked_times (start_at, end_at, cage_units, turf_units);
CREATE INDEX IF NOT EXISTS idx_blocked_times_user_id ON public.blocked_times (user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_times_team_id ON public.blocked_times (team_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_by_admin ON public.bookings (created_by_admin);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_expires_at ON public.waiver_signatures (expires_at);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_user ON public.compliance_documents (user_id, document_type, status);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_team ON public.compliance_documents (team_id, document_type, status);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_participant ON public.compliance_documents (participant_id, document_type, status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);

ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.compliance_documents, public.admin_audit_log FROM anon, authenticated;

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
  v_blocked_cages INTEGER;
  v_blocked_turf INTEGER;
BEGIN
  IF p_start_at IS NULL OR p_end_at IS NULL OR p_end_at <= p_start_at THEN
    RAISE EXCEPTION 'invalid_booking_window' USING ERRCODE = '22023';
  END IF;
  IF p_cage_units < 0 OR p_turf_units < 0 OR p_cage_units > 4 OR p_turf_units > 2 THEN
    RAISE EXCEPTION 'invalid_capacity_request' USING ERRCODE = '22023';
  END IF;

  -- Serialize capacity writes so overlapping windows cannot race each other.
  PERFORM pg_advisory_xact_lock(87542001);

  UPDATE public.bookings
  SET status = 'expired', payment_status = 'failed', updated_at = NOW()
  WHERE status = 'pending' AND hold_expires_at IS NOT NULL AND hold_expires_at <= NOW();

  SELECT COALESCE(SUM(cage_units), 0), COALESCE(SUM(turf_units), 0)
  INTO v_blocked_cages, v_blocked_turf
  FROM public.blocked_times
  WHERE start_at < p_end_at AND end_at > p_start_at;

  SELECT COALESCE(SUM(cage_units), 0), COALESCE(SUM(turf_units), 0)
  INTO v_cages, v_turf
  FROM public.bookings
  WHERE start_at < p_end_at
    AND end_at > p_start_at
    AND (
      status = 'confirmed'
      OR (status = 'pending' AND hold_expires_at > NOW())
    );

  IF v_cages + v_blocked_cages + p_cage_units > 4
    OR v_turf + v_blocked_turf + p_turf_units > 2 THEN
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

REVOKE ALL ON FUNCTION public.create_booking_hold(UUID,UUID,TEXT,TEXT,INTEGER,DATE,TEXT,TIMESTAMPTZ,TIMESTAMPTZ,INTEGER,INTEGER,TEXT,TEXT,TEXT,TEXT,INTEGER,TEXT,TEXT,BOOLEAN,TEXT,INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_hold(UUID,UUID,TEXT,TEXT,INTEGER,DATE,TEXT,TIMESTAMPTZ,TIMESTAMPTZ,INTEGER,INTEGER,TEXT,TEXT,TEXT,TEXT,INTEGER,TEXT,TEXT,BOOLEAN,TEXT,INTEGER) TO service_role;
