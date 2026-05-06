-- Training Yard DSM Booking Platform
-- Migration: 001_booking_platform

CREATE TABLE IF NOT EXISTS bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Service info
  service_type          TEXT NOT NULL,
  service_label         TEXT NOT NULL,
  duration_minutes      INTEGER NOT NULL,

  -- Scheduling
  booking_date          DATE NOT NULL,
  booking_time          TEXT NOT NULL,

  -- Customer info
  customer_name         TEXT NOT NULL,
  customer_email        TEXT NOT NULL,
  customer_phone        TEXT NOT NULL,
  player_name           TEXT,
  player_age            INTEGER,
  sport                 TEXT,

  -- Waiver
  waiver_accepted       BOOLEAN NOT NULL DEFAULT FALSE,
  waiver_accepted_at    TIMESTAMPTZ,
  waiver_signer_name    TEXT,

  -- Stripe
  stripe_session_id     TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents          INTEGER NOT NULL,

  -- Status
  status                TEXT NOT NULL DEFAULT 'pending',

  -- Notes
  notes                 TEXT,
  admin_notes           TEXT,
  confirmed_at          TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS bookings_booking_date_idx    ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS bookings_status_idx          ON bookings (status);
CREATE INDEX IF NOT EXISTS bookings_customer_email_idx  ON bookings (customer_email);
CREATE INDEX IF NOT EXISTS bookings_stripe_session_idx  ON bookings (stripe_session_id);
