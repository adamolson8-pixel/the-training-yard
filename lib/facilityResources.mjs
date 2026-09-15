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
  if (!resourceId) return { ...FACILITY_CAPACITY }
  const id = LEGACY_RESOURCE_IDS[resourceId] || resourceId
  const resource = FACILITY_RESOURCES.find(entry => entry.id === id)
  if (!resource) throw new Error('Invalid resource.')
  return { cageUnits: resource.cageUnits, turfUnits: resource.turfUnits }
}
