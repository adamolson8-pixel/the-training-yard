-- Team membership codes: a team's Stripe promotion code (e.g. DUCKS2627) and the
-- rules our membership checkout applies to it. The discount itself lives on
-- the Stripe coupon; these columns decide who may use the code, on which plans,
-- whether turf benefits are included, and when the team's discount ends
-- (the contract end date; extend it when the team renews).
alter table public.teams
  add column if not exists membership_code text,
  add column if not exists membership_code_plan text not null default 'any'
    check (membership_code_plan in ('any', 'individual', 'family')),
  add column if not exists membership_includes_turf boolean not null default true,
  add column if not exists membership_discount_ends_on date;

create unique index if not exists teams_membership_code_key on public.teams (upper(membership_code))
  where membership_code is not null;
