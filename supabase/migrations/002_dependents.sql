-- ============================================================
-- The Training Yard — Phase 2 Database Migration
-- Adds JSONB dependents column to profiles for family waivers
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dependents JSONB DEFAULT '[]'::jsonb;
