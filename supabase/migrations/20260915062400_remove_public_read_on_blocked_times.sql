-- blocked_times.reason carries customer identity ("Team Reservation — Ankeny Ducks")
-- alongside exact practice dates and times. The blocks_public_read policy granted
-- SELECT on every row to the anon role, and the anon key ships in the browser
-- bundle, so any visitor could read the full team practice schedule.
--
-- Nothing needs that access: /api/availability, /api/admin/calendar and
-- /api/admin/blocks all query with the service role (which bypasses RLS), and the
-- public availability response exposes only per-slot booleans, never a name.
-- No browser code reads blocked_times directly.

DROP POLICY IF EXISTS blocks_public_read ON public.blocked_times;
