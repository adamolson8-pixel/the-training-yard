-- Payment records are admin-only for now. The customer portal never read this
-- table; this policy only exposed rows to direct client queries. Admin pages
-- read through the service role, which bypasses RLS.
drop policy if exists payments_own_read on public.payments;
