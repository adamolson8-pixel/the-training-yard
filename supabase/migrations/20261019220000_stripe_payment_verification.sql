-- Stripe-verified payment ledger.
--
-- Admins run "Verify with Stripe" from the Payments page. Every Stripe charge is
-- pulled from the Stripe API (the source of truth), matched to a booking, team
-- package, user and/or team, and upserted here keyed by its charge id. The
-- webhook previously wrote rows only on checkout.session.completed and stopped
-- receiving events after 2026-08-26, so the ledger was empty.

alter table public.payments
  add column if not exists stripe_charge_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists customer_email text,
  add column if not exists customer_name text,
  add column if not exists description text,
  add column if not exists paid_at timestamptz,
  add column if not exists amount_refunded_cents integer not null default 0,
  add column if not exists livemode boolean,
  add column if not exists verified_at timestamptz,
  add column if not exists match_method text,
  add column if not exists verification_note text;

create unique index if not exists idx_payments_stripe_charge_id_unique
  on public.payments (stripe_charge_id) where stripe_charge_id is not null;
create index if not exists idx_payments_stripe_payment_intent_id
  on public.payments (stripe_payment_intent_id);
