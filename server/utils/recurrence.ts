import { expandWeeklyPattern } from '../../lib/facilityTime.mjs'

/** Hard ceiling on one series, so a bad `until` date cannot flood the table. */
export const MAX_SERIES_OCCURRENCES = 400

export interface WeeklyRepeat {
  /** 0 = Sunday … 6 = Saturday. */
  daysOfWeek: number[]
  /** Last date the series may produce, inclusive, `YYYY-MM-DD` Central. */
  until: string
}

export interface RepeatWindow {
  date: string
  startAt: Date
  endAt: Date
}

/**
 * Reads the `repeat` payload an admin endpoint received. Returns `null` when the
 * caller did not ask for a repeating record.
 */
export function parseWeeklyRepeat(value: unknown): WeeklyRepeat | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const days = Array.isArray(raw.days_of_week) ? raw.days_of_week.map(Number) : []
  const until = String(raw.until || '')
  if (!days.length && !until) return null
  if (!days.length) throw createError({ statusCode: 400, statusMessage: 'Choose at least one day of the week to repeat on.' })
  if (!until) throw createError({ statusCode: 400, statusMessage: 'A repeat-until date is required.' })
  return { daysOfWeek: days, until }
}

/**
 * Expands a weekly repeat into the individual Central Time windows to store.
 * Each occurrence is converted on its own date, so the wall-clock time survives
 * daylight-saving changes inside the series.
 */
export function expandWeeklyRepeat(options: {
  startDate: string
  startTime: string
  endTime: string
  allDay: boolean
  repeat: WeeklyRepeat
}): RepeatWindow[] {
  let windows: RepeatWindow[]
  try {
    windows = expandWeeklyPattern({
      startDate: options.startDate,
      until: options.repeat.until,
      daysOfWeek: options.repeat.daysOfWeek,
      startTime: options.startTime,
      endTime: options.endTime,
      allDay: options.allDay,
    })
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error?.message || 'Invalid repeat pattern.' })
  }

  if (windows.length > MAX_SERIES_OCCURRENCES) {
    throw createError({
      statusCode: 400,
      statusMessage: `That pattern would create ${windows.length} blocks. Shorten the date range (limit ${MAX_SERIES_OCCURRENCES}).`,
    })
  }
  return windows
}
