-- The team a member joined through (from the Stripe subscription's team_id
-- metadata). Team rules follow the member by team, not by code, so a team can
-- switch to a new season code without stranding members on the old one.
alter table public.profiles add column if not exists membership_team_id uuid;
create index if not exists profiles_membership_team_id_idx on public.profiles (membership_team_id)
  where membership_team_id is not null;
