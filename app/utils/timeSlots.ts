// Days open: Monday (1) through Sunday (0). Open 7 days a week.
export const DAYS_OPEN = [0, 1, 2, 3, 4, 5, 6]

/**
 * Returns true if the given date is an open day (Mon–Sun — open daily).
 */
export function isOpenDay(date: Date): boolean {
  return DAYS_OPEN.includes(date.getDay())
}

/**
 * All time slots from 8 AM through 7 PM (last slot starts at 7 PM).
 */
export const ALL_SLOTS: string[] = (() => {
  const slots: string[] = []
  for (let hour = 8; hour <= 19; hour++) {
    const h = hour > 12 ? hour - 12 : hour
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const label = `${h}:00 ${ampm}`
    slots.push(label)
  }
  return slots
})()

/**
 * Returns available time slots for a given date.
 * Filters out past times if the date is today.
 */
export function getAvailableTimeSlots(date: Date): string[] {
  if (!isOpenDay(date)) return []

  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (!isToday) return [...ALL_SLOTS]

  // Filter out slots that have already passed (with 30-min buffer)
  const currentHour = now.getHours() + now.getMinutes() / 60 + 0.5
  return ALL_SLOTS.filter((slot) => {
    const match = slot.match(/^(\d+):00 (AM|PM)$/)
    if (!match || !match[1] || !match[2]) return false
    let hour = parseInt(match[1])
    if (match[2] === 'PM' && hour !== 12) hour += 12
    if (match[2] === 'AM' && hour === 12) hour = 0
    return hour > currentHour
  })
}
