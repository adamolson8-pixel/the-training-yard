-- Facility model correction.
-- The building (60'x100') is HALF turf, HALF batting cages: one turf field
-- (60'x50') plus four cages. There is no second turf half. Turf capacity = 1.
--
-- Prior model allowed turf_units up to 2, so a team holding the turf still
-- advertised "1/2 turf open" and the site would sell a second turf rental
-- into the same field.

UPDATE public.bookings         SET turf_units = 1 WHERE turf_units > 1;
UPDATE public.blocked_times    SET turf_units = 1 WHERE turf_units > 1;
UPDATE public.service_capacity SET turf_units = 1 WHERE turf_units > 1;

ALTER TABLE public.blocked_times DROP CONSTRAINT IF EXISTS blocked_times_capacity_check;
ALTER TABLE public.blocked_times ADD CONSTRAINT blocked_times_capacity_check
  CHECK (cage_units >= 0 AND cage_units <= 4
     AND turf_units >= 0 AND turf_units <= 1
     AND (cage_units > 0 OR turf_units > 0));

ALTER TABLE public.service_capacity DROP CONSTRAINT IF EXISTS service_capacity_turf_units_check;
ALTER TABLE public.service_capacity ADD CONSTRAINT service_capacity_turf_units_check
  CHECK (turf_units >= 0 AND turf_units <= 1);

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_capacity_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_capacity_check
  CHECK (cage_units >= 0 AND cage_units <= 4 AND turf_units >= 0 AND turf_units <= 1);

CREATE OR REPLACE FUNCTION public.create_booking_hold(p_user_id uuid, p_team_id uuid, p_service_type text, p_service_label text, p_duration_minutes integer, p_booking_date date, p_booking_time text, p_start_at timestamp with time zone, p_end_at timestamp with time zone, p_cage_units integer, p_turf_units integer, p_customer_name text, p_customer_email text, p_customer_phone text, p_player_name text, p_player_age integer, p_sport text, p_notes text, p_waiver_accepted boolean, p_waiver_signer_name text, p_amount_cents integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
  -- Capacity: 4 cages, 1 turf field.
  IF p_cage_units < 0 OR p_turf_units < 0 OR p_cage_units > 4 OR p_turf_units > 1 THEN
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
    OR v_turf + v_blocked_turf + p_turf_units > 1 THEN
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
$function$;
