# Standing reserved times

Some teams hold the same hours every week for a whole season. Each season file
here describes one of those arrangements, and
`scripts/apply-reserved-times.mjs` turns it into the individual `blocked_times`
records the booking calendar reads.

Nothing here is required to block time — Admin → **Block Time** → *Repeat
weekly* does the same job from the browser. The files exist so a season's terms
are written down, reviewable, and repeatable next year.

## Applying a season

```bash
# Print the plan. Writes nothing.
node scripts/apply-reserved-times.mjs scripts/reserved-times/ankeny-ducks-2026-27.json

# Write the blocks.
node scripts/apply-reserved-times.mjs scripts/reserved-times/ankeny-ducks-2026-27.json --apply
```

Needs `SUPABASE_URL` and `NUXT_SUPABASE_SECRET_KEY` (service role) in `.env` or
the environment. The team named in the file must already exist; pass
`--team-id=<uuid>` to skip the name lookup.

Re-running is safe: occurrences already blocked for that team are skipped, so
the script only fills gaps.

## Season file fields

| Field | Meaning |
| --- | --- |
| `team_name` | Matched against `teams.name` (case-insensitive, must be unique) |
| `resource_id` | Facility footprint each block holds — see `lib/facilityResources.mjs`. `null` closes the whole building |
| `reason` | Shown on the admin schedule and block list |
| `season.start_date` / `season.until` | Inclusive Central Time date range |
| `patterns[]` | One weekly pattern each: `days_of_week` (0 = Sunday), `start_time`, `end_time`, optional `all_day` |
| `notes[]` | Printed when the script runs — the human terms behind the numbers |

## Removing a season

Admin → **Block Time** → **Remove series** on the row for that pattern. Each
pattern is written as its own series, so the four Ankeny Ducks patterns remove
independently.
