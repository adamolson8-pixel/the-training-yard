-- Minutes of a booking covered by the member's included daily cage hour
-- (Individual: daily 1-hour cage access; Family: shared daily hour). The rest
-- of the booking, if any, is paid at the member rate.
alter table public.bookings add column if not exists included_minutes integer not null default 0
  check (included_minutes >= 0);
create index if not exists bookings_included_minutes_idx on public.bookings (user_id, booking_date)
  where included_minutes > 0;
