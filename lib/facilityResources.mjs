/**
 * The bookable footprint of the building, in one place.
 *
 * The building (60'x100') is HALF turf, HALF batting cages: ONE turf field
 * (60'x50') and FOUR cages. There is no second turf half. Every block and every
 * reservation is stored as the number of those units it consumes, so anything
 * that closes time — a maintenance window, a private event, a team's standing
 * reserved slot — has to describe itself in the same terms.
 *
 * Shared by the admin UI, the Nitro server utilities, and the scripts in
 * `scripts/`, so a resource can never mean two different things.
 */

export const FACILITY_CAPACITY = { cageUnits: 4, turfUnits: 1 }

/** @typedef {{ id: string, name: string, cageUnits: number, turfUnits: number }} FacilityResource */

/** @type {FacilityResource[]} */
export const FACILITY_RESOURCES = [
  { id: 'cage-1', name: '🏏 Cage 1', cageUnits: 1, turfUnits: 0 },
  { id: 'cage-2', name: '🏏 Cage 2', cageUnits: 1, turfUnits: 0 },
  { id: 'cage-3', name: '🏏 Cage 3', cageUnits: 1, turfUnits: 0 },
  { id: 'cage-4', name: '🏏 Cage 4', cageUnits: 1, turfUnits: 0 },
  { id: 'turf', name: '⚽ Turf', cageUnits: 0, turfUnits: 1 },
  // A capacity bundle rather than one physical resource: the same footprint a
  // team_standard reservation consumes, so a standing team slot still leaves
  // two cages open to everyone else.
  { id: 'team-standard', name: '🥎 Team Standard (2 cages + turf)', cageUnits: 2, turfUnits: 1 },
]

/** Retired ids kept so blocks saved under the old two-turf-half model still resolve. */
const LEGACY_RESOURCE_IDS = { 'half-turf': 'turf', 'full-turf': 'turf' }

/**
 * Units a block consumes. A null/blank resource closes the whole facility.
 * @param {string | null | undefined} resourceId
 * @returns {{ cageUnits: number, turfUnits: number }}
 */
export function blockCapacity(resourceId) {
  const ids = normalizeResourceIds(resourceId)
  if (!ids.length) return { ...FACILITY_CAPACITY }
  const total = ids.reduce((sum, id) => {
    const resource = FACILITY_RESOURCES.find(entry => entry.id === id)
    return { cageUnits: sum.cageUnits + resource.cageUnits, turfUnits: sum.turfUnits + resource.turfUnits }
  }, { cageUnits: 0, turfUnits: 0 })
  // Overlapping picks (e.g. Team Standard + Turf) can never close more than the building has.
  return {
    cageUnits: Math.min(total.cageUnits, FACILITY_CAPACITY.cageUnits),
    turfUnits: Math.min(total.turfUnits, FACILITY_CAPACITY.turfUnits),
  }
}

/**
 * A block can cover several resources at once (e.g. Cage 1, Cage 2, Cage 3).
 * They are stored in `resource_id` as a comma-separated list. Accepts that
 * string, an array, or null; returns de-duplicated canonical ids. Empty means
 * facility-wide. Throws on an unknown id.
 * @param {string | string[] | null | undefined} value
 * @returns {string[]}
 */
export function normalizeResourceIds(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(',')
  const ids = []
  for (const part of raw) {
    const trimmed = String(part || '').trim()
    if (!trimmed) continue
    const id = LEGACY_RESOURCE_IDS[trimmed] || trimmed
    if (!FACILITY_RESOURCES.some(entry => entry.id === id)) throw new Error('Invalid resource.')
    if (!ids.includes(id)) ids.push(id)
  }
  return ids
}

/**
 * Human label for a stored resource_id ("🏏 Cage 1, 🏏 Cage 2"). Null is facility-wide.
 * Never throws, so an odd legacy value still renders.
 * @param {string | null | undefined} resourceId
 */
export function resourceLabel(resourceId) {
  if (!resourceId) return '🏟 Facility-Wide'
  return String(resourceId).split(',').map(part => {
    const id = LEGACY_RESOURCE_IDS[part.trim()] || part.trim()
    return FACILITY_RESOURCES.find(entry => entry.id === id)?.name ?? id
  }).join(', ')
}
