#!/usr/bin/env node
/**
 * Applies a team's standing reserved times to the booking calendar.
 *
 * Reads a season file (see `scripts/reserved-times/`), expands each weekly
 * pattern into individual Central Time windows, and writes them to
 * `blocked_times` as one removable series per pattern — the same records the
 * admin "Block Time" screen creates, so the schedule, availability, and the
 * "Remove series" button all behave identically.
 *
 * Dry run by default. Nothing is written until you pass --apply.
 *
 *   node scripts/apply-reserved-times.mjs scripts/reserved-times/ankeny-ducks-2026-27.json
 *   node scripts/apply-reserved-times.mjs scripts/reserved-times/ankeny-ducks-2026-27.json --apply
 *
 * Options:
 *   --apply            write the blocks (otherwise only prints the plan)
 *   --team-id=<uuid>   skip the team-name lookup and use this team
 *
 * Requires SUPABASE_URL and NUXT_SUPABASE_SECRET_KEY (service role), read from
 * the environment or a local .env file.
 */

import { randomUUID } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { addFacilityDays, expandWeeklyPattern, facilityInstant, FACILITY_TIME_ZONE } from '../lib/facilityTime.mjs'
import { blockCapacity } from '../lib/facilityResources.mjs'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const teamIdOverride = args.find(arg => arg.startsWith('--team-id='))?.split('=')[1] || null
const configPath = args.find(arg => !arg.startsWith('--'))

if (!configPath) {
  console.error('Usage: node scripts/apply-reserved-times.mjs <season-file.json> [--apply] [--team-id=<uuid>]')
  process.exit(1)
}

/** Minimal .env reader so the script runs the same way `nuxt dev` does. */
function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
  }
}
loadEnvFile()

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.NUXT_SUPABASE_SECRET_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or NUXT_SUPABASE_SECRET_KEY. Set them in .env or the environment.')
  process.exit(1)
}

const config = JSON.parse(readFileSync(resolve(process.cwd(), configPath), 'utf8'))
const capacity = blockCapacity(config.resource_id || null)
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

const formatWindow = (start, end) => {
  const date = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: FACILITY_TIME_ZONE })
  const time = (value) => value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: FACILITY_TIME_ZONE })
  return `${date}  ${time(start)}–${time(end)}`
}

async function resolveTeamId() {
  if (teamIdOverride) return teamIdOverride
  if (!config.team_name) return null
  const { data, error } = await supabase.from('teams').select('id,name').ilike('name', config.team_name)
  if (error) throw new Error(`Team lookup failed: ${error.message}`)
  if (!data?.length) throw new Error(`No team named "${config.team_name}". Create the team first, or pass --team-id=<uuid>.`)
  if (data.length > 1) throw new Error(`"${config.team_name}" matches ${data.length} teams. Pass --team-id=<uuid>.`)
  return data[0].id
}

async function resolveCreatedBy() {
  const email = config.created_by_email || process.env.NUXT_ADMIN_EMAIL?.split(',')[0]?.trim()
  if (!email) return null
  const { data } = await supabase.from('profiles').select('id').eq('email', email).eq('role', 'admin').maybeSingle()
  return data?.id || null
}

async function main() {
  console.log(`\n${config.label || configPath}`)
  console.log(`Facility footprint: ${capacity.cageUnits} cage unit(s) + ${capacity.turfUnits} turf half/halves per block\n`)

  const teamId = await resolveTeamId()
  const createdBy = await resolveCreatedBy()

  // This team's existing blocks in the season window, so re-running the script
  // only fills the gaps instead of duplicating what is already reserved.
  const seasonStart = facilityInstant(config.season.start_date, '00:00')
  const seasonEnd = facilityInstant(addFacilityDays(config.season.until, 1), '00:00')
  let query = supabase
    .from('blocked_times')
    .select('start_at,end_at,cage_units,turf_units')
    .gte('start_at', seasonStart.toISOString())
    .lt('start_at', seasonEnd.toISOString())
  query = teamId ? query.eq('team_id', teamId) : query.is('team_id', null)
  const { data: existing, error: existingError } = await query
  if (existingError) throw new Error(`Could not read existing blocks: ${existingError.message}`)
  const alreadyBlocked = new Set(
    (existing || []).map(row => `${new Date(row.start_at).toISOString()}|${new Date(row.end_at).toISOString()}|${row.cage_units}|${row.turf_units}`),
  )

  let planned = 0
  let skipped = 0
  const series = []

  for (const pattern of config.patterns) {
    const occurrences = expandWeeklyPattern({
      startDate: config.season.start_date,
      until: config.season.until,
      daysOfWeek: pattern.days_of_week,
      startTime: pattern.start_time,
      endTime: pattern.end_time,
      allDay: pattern.all_day === true,
    })
    const recurrenceId = randomUUID()
    const rows = []
    for (const occurrence of occurrences) {
      const key = `${occurrence.startAt.toISOString()}|${occurrence.endAt.toISOString()}|${capacity.cageUnits}|${capacity.turfUnits}`
      if (alreadyBlocked.has(key)) { skipped++; continue }
      rows.push({
        start_at: occurrence.startAt.toISOString(),
        end_at: occurrence.endAt.toISOString(),
        resource_id: config.resource_id || null,
        reason: String(config.reason || 'Team Reservation').slice(0, 250),
        all_day: pattern.all_day === true,
        created_by: createdBy,
        cage_units: capacity.cageUnits,
        turf_units: capacity.turfUnits,
        team_id: teamId,
        recurrence_id: recurrenceId,
      })
    }
    planned += rows.length
    series.push({ pattern, recurrenceId, rows, occurrences })

    console.log(`${pattern.label || pattern.days_of_week.join(',')} — ${pattern.start_time}–${pattern.end_time}`)
    console.log(`  ${occurrences.length} dates in range, ${rows.length} to write, ${occurrences.length - rows.length} already blocked`)
    if (occurrences.length) {
      console.log(`  first: ${formatWindow(occurrences[0].startAt, occurrences[0].endAt)}`)
      console.log(`  last:  ${formatWindow(occurrences[occurrences.length - 1].startAt, occurrences[occurrences.length - 1].endAt)}`)
    }
  }

  for (const note of config.notes || []) console.log(`\nNote: ${note}`)
  console.log(`\nTotal: ${planned} blocks to write, ${skipped} already in place.`)

  if (!apply) {
    console.log('\nDry run — nothing was written. Re-run with --apply to save these blocks.\n')
    return
  }
  if (!planned) {
    console.log('\nNothing to do.\n')
    return
  }

  for (const entry of series) {
    if (!entry.rows.length) continue
    const { error } = await supabase.from('blocked_times').insert(entry.rows)
    if (error) {
      // Leave no half-written series behind.
      await supabase.from('blocked_times').delete().eq('recurrence_id', entry.recurrenceId)
      throw new Error(`Insert failed for "${entry.pattern.label}": ${error.message}`)
    }
    if (createdBy) {
      await supabase.from('admin_audit_log').insert({
        actor_id: createdBy,
        action: 'block.series_created',
        entity_type: 'blocked_time',
        entity_id: entry.recurrenceId,
        metadata: {
          source: 'scripts/apply-reserved-times.mjs',
          config: configPath,
          pattern: entry.pattern.label,
          team_id: teamId,
          occurrences: entry.rows.length,
        },
      })
    }
    console.log(`Wrote ${entry.rows.length} blocks for "${entry.pattern.label}" (series ${entry.recurrenceId})`)
  }
  console.log('\nDone. Remove any series from Admin → Block Time.\n')
}

main().catch(error => {
  console.error(`\n${error.message}\n`)
  process.exit(1)
})
