-- Recurring facility blocks.
--
-- A season-long team reservation (for example a club that holds Sunday mornings
-- and Tuesday/Thursday evenings from August through March) is stored as one row
-- per occurrence so capacity math, availability, and the admin schedule keep
-- working unchanged. `recurrence_id` ties those rows together so staff can see
-- and remove the arrangement as a single series instead of a wall of rows.

ALTER TABLE public.blocked_times
  ADD COLUMN IF NOT EXISTS recurrence_id UUID;

CREATE INDEX IF NOT EXISTS idx_blocked_times_recurrence_id
  ON public.blocked_times (recurrence_id)
  WHERE recurrence_id IS NOT NULL;

COMMENT ON COLUMN public.blocked_times.recurrence_id IS
  'Groups occurrences created from one weekly repeat pattern. NULL for one-off blocks.';
