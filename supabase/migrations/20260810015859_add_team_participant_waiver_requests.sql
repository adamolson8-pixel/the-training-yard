ALTER TABLE public.team_participants
  ADD COLUMN IF NOT EXISTS waiver_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS waiver_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waiver_requested_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_participants_waiver_token
  ON public.team_participants (waiver_token_hash)
  WHERE waiver_token_hash IS NOT NULL;
