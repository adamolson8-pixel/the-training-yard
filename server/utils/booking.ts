import { getServiceById } from '../../app/utils/services'
import {
  DATE_PATTERN,
  FACILITY_TIME_ZONE,
  addFacilityDays as addFacilityDaysRaw,
  facilityInstant,
  normalizeTime as normalizeTimeRaw,
} from '../../lib/facilityTime.mjs'
import { blockCapacity as blockCapacityRaw } from '../../lib/facilityResources.mjs'

export { FACILITY_TIME_ZONE }
export const OPENING_HOUR = 8
export const LAST_START_HOUR = 19

export function serviceCapacity(serviceId: string) {
  const service = getServiceById(serviceId)
  if (!service) throw createError({ statusCode: 400, statusMessage: 'Invalid service.' })

  if (serviceId.startsWith('single_cage')) return { service, cageUnits: 1, turfUnits: 0 }
  if (serviceId === 'half_turf_60') return { service, cageUnits: 0, turfUnits: 1 }
  if (serviceId.startsWith('team_standard')) return { service, cageUnits: 2, turfUnits: 1 }
  return { service, cageUnits: 4, turfUnits: 2 }
}

export function blockCapacity(resourceId?: string | null) {
  try {
    return blockCapacityRaw(resourceId)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid resource.' })
  }
}

export function normalizeTime(value: string) {
  try {
    return normalizeTimeRaw(value)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid time.' })
  }
}

/** Calendar-day arithmetic on a Central Time date string. */
export function addFacilityDays(date: string, days: number) {
  if (!DATE_PATTERN.test(date)) throw createError({ statusCode: 400, statusMessage: 'Invalid date.' })
  return addFacilityDaysRaw(date, days)
}

export function facilityWindow(date: string, time: string, durationMinutes: number) {
  if (!DATE_PATTERN.test(date)) throw createError({ statusCode: 400, statusMessage: 'Invalid date.' })
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 24 * 60) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid duration.' })
  }
  const normalizedTime = normalizeTime(time)
  const startAt = facilityInstant(date, normalizedTime)
  const endAt = new Date(startAt.getTime() + durationMinutes * 60_000)

  return { startAt, endAt, normalizedTime }
}

export function bookingWindow(date: string, time: string, durationMinutes: number) {
  const window = facilityWindow(date, time, durationMinutes)
  const hour = Number(window.normalizedTime.split(':')[0])
  const minute = Number(window.normalizedTime.split(':')[1])

  if (window.startAt.getTime() <= Date.now() + 30 * 60_000) {
    throw createError({ statusCode: 400, statusMessage: 'Please choose a time at least 30 minutes from now.' })
  }
  if (hour < OPENING_HOUR || hour > LAST_START_HOUR || minute !== 0) {
    throw createError({ statusCode: 400, statusMessage: 'That time is outside online booking hours.' })
  }
  return window
}

export function facilityDateParts(value: string | Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: FACILITY_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return { date: `${map.year}-${map.month}-${map.day}`, time: `${map.hour}:${map.minute}` }
}

export function displayTime(time: string) {
  const [hourString, minute] = normalizeTime(time).split(':')
  const hour = Number(hourString)
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`
}

export function bookingPrice(service: ReturnType<typeof getServiceById>, membershipStatus?: string) {
  if (!service) throw createError({ statusCode: 400, statusMessage: 'Invalid service.' })
  return membershipStatus === 'active' ? service.memberPriceCents : service.priceCents
}
