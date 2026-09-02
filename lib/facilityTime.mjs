/**
 * Framework-free facility clock helpers.
 *
 * Imported by the Nitro server utilities (`server/utils/booking.ts`) and by the
 * standalone operations scripts in `scripts/`, so the app and the scripts can
 * never disagree about when 5:00 PM Central actually is — including across the
 * daylight-saving transitions that fall inside a normal August-to-March season.
 *
 * Everything here is pure date math. It throws plain `Error`s; the server
 * wrappers translate those into H3 errors.
 */

export const FACILITY_TIME_ZONE = 'America/Chicago'

/** ISO calendar date, e.g. `2026-08-01`. */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * Accepts `17:00` or `5:00 PM` and returns 24-hour `HH:MM`.
 * @param {string} value
 * @returns {string}
 */
export function normalizeTime(value) {
  const twelveHour = String(value).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (twelveHour) {
    let hour = Number(twelveHour[1])
    const minute = Number(twelveHour[2])
    const period = twelveHour[3].toUpperCase()
    if (hour < 1 || hour > 12 || minute > 59) throw new Error('Invalid time.')
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  const twentyFourHour = String(value).trim().match(/^(\d{2}):(\d{2})$/)
  if (!twentyFourHour || Number(twentyFourHour[1]) > 23 || Number(twentyFourHour[2]) > 59) {
    throw new Error('Invalid time.')
  }
  return String(value).trim()
}

/**
 * Milliseconds the given zone is ahead of UTC at that instant.
 * @param {Date} date
 * @param {string} [timeZone]
 * @returns {number}
 */
export function timeZoneOffset(date, timeZone = FACILITY_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second)) - date.getTime()
}

/**
 * Converts a Central Time wall clock (date + time) into the UTC instant it names.
 * @param {string} date `YYYY-MM-DD`
 * @param {string} time `HH:MM` or `H:MM AM/PM`
 * @returns {Date}
 */
export function facilityInstant(date, time) {
  if (!DATE_PATTERN.test(date)) throw new Error('Invalid date.')
  const normalized = normalizeTime(time)
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = normalized.split(':').map(Number)
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
  // Two passes: the first guess lands close enough to read the right offset,
  // the second applies the offset actually in effect at that instant.
  const first = wallClockUtc - timeZoneOffset(new Date(wallClockUtc))
  return new Date(wallClockUtc - timeZoneOffset(new Date(first)))
}

/**
 * Calendar arithmetic on a facility date, immune to zone offsets.
 * @param {string} date `YYYY-MM-DD`
 * @param {number} days
 * @returns {string} `YYYY-MM-DD`
 */
export function addFacilityDays(date, days) {
  if (!DATE_PATTERN.test(date)) throw new Error('Invalid date.')
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/**
 * Day of week for a facility date. 0 = Sunday … 6 = Saturday.
 * @param {string} date `YYYY-MM-DD`
 * @returns {number}
 */
export function facilityDayOfWeek(date) {
  if (!DATE_PATTERN.test(date)) throw new Error('Invalid date.')
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/** @typedef {{ date: string, startAt: Date, endAt: Date }} FacilityOccurrence */

/**
 * Expands a weekly pattern into one occurrence per matching calendar date.
 *
 * Occurrences are same-day windows (or whole days when `allDay` is set). Each
 * one is converted independently, so a 5:00 PM slot stays 5:00 PM Central on
 * both sides of a daylight-saving change.
 *
 * @param {object} pattern
 * @param {string} pattern.startDate first date the pattern can produce, `YYYY-MM-DD`
 * @param {string} pattern.until last date the pattern can produce, inclusive
 * @param {number[]} pattern.daysOfWeek 0 = Sunday … 6 = Saturday
 * @param {string} [pattern.startTime] required unless `allDay`
 * @param {string} [pattern.endTime] required unless `allDay`
 * @param {boolean} [pattern.allDay]
 * @returns {FacilityOccurrence[]}
 */
export function expandWeeklyPattern({ startDate, until, daysOfWeek, startTime, endTime, allDay = false }) {
  if (!DATE_PATTERN.test(startDate)) throw new Error('Invalid start date.')
  if (!DATE_PATTERN.test(until)) throw new Error('Invalid repeat-until date.')
  if (until < startDate) throw new Error('Repeat-until must be on or after the start date.')

  const days = [...new Set((daysOfWeek || []).map(Number))]
  if (!days.length) throw new Error('Choose at least one day of the week.')
  if (days.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error('Invalid day of the week.')

  const occurrences = []
  for (let date = startDate; date <= until; date = addFacilityDays(date, 1)) {
    if (!days.includes(facilityDayOfWeek(date))) continue
    const startAt = allDay ? facilityInstant(date, '00:00') : facilityInstant(date, startTime)
    const endAt = allDay ? facilityInstant(addFacilityDays(date, 1), '00:00') : facilityInstant(date, endTime)
    if (endAt <= startAt) throw new Error('End time must be after the start time.')
    occurrences.push({ date, startAt, endAt })
  }

  if (!occurrences.length) throw new Error('No dates match that weekly pattern.')
  return occurrences
}
