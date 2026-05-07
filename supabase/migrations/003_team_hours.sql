-- Add columns to profiles for team hour tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_standard_hours INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_buyout_hours INTEGER DEFAULT 0;
