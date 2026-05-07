-- Add reminder_sent_at to bookings table (required for cron deduplication)
-- Run in Supabase SQL Editor after the Phase 1 migration

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_reminder ON bookings(reminder_sent_at)
  WHERE reminder_sent_at IS NULL;
