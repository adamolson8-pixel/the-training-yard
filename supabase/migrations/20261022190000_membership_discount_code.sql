-- Team discount on a membership: the Stripe promotion code (one per team) the
-- member entered at checkout, synced from the subscription by the Stripe webhook.
alter table public.profiles add column if not exists membership_discount_code text;
