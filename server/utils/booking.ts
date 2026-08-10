import { getServiceById } from '../../app/utils/services'

export const FACILITY_TIME_ZONE = 'America/Chicago'
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
  if (!resourceId) return { cageUnits: 4, turfUnits: 2 }
  if (['cage-1', 'cage-2', 'cage-3', 'cage-4'].includes(resourceId)) return { cageUnits: 1, turfUnits: 0 }
  if (resourceId === 'half-turf') return { cageUnits: 0, turfUnits: 1 }
  if (resourceId === 'full-turf') return { cageUnits: 0, turfUnits: 2 }
  throw createError({ statusCode: 400, statusMessage: 'Invalid resource.' })
}

export function normalizeTime(value: string) {
  const twelveHour = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (twelveHour) {
    let hour = Number(twelveHour[1])
    const minute = Number(twelveHour[2])
    const period = twelveHour[3].toUpperCase()
    if (hour < 1 || hour > 12 || minute > 59) throw createError({ statusCode: 400, statusMessage: 'Invalid time.' })
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  const twentyFourHour = value.trim().match(/^(\d{2}):(\d{2})$/)
  if (!twentyFourHour || Number(twentyFourHour[1]) > 23 || Number(twentyFourHour[2]) > 59) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid time.' })
  }
  return value.trim()
}

function timeZoneOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second)) - date.getTime()
}

export function facilityWindow(date: string, time: string, durationMinutes: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw createError({ statusCode: 400, statusMessage: 'Invalid date.' })
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 24 * 60) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid duration.' })
  }
  const normalized = normalizeTime(time)
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = normalized.split(':').map(Number)
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
  const firstGuess = new Date(wallClockUtc)
  const first = wallClockUtc - timeZoneOffset(firstGuess, FACILITY_TIME_ZONE)
  const startAt = new Date(wallClockUtc - timeZoneOffset(new Date(first), FACILITY_TIME_ZONE))
  const endAt = new Date(startAt.getTime() + durationMinutes * 60_000)

  return { startAt, endAt, normalizedTime: normalized }
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
