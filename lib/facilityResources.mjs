/**
 * The bookable footprint of the building, in one place.
 *
 * The facility holds four cage units and two turf halves. Every block and every
 * reservation is stored as the number of those units it consumes, so anything
 * that closes time — a maintenance window, a private event, a team's standing
 * reserved slot — has to describe itself in the same terms.
 *
 * Shared by the admin UI, the Nitro server utilities, and the scripts in
 * `scripts/`, so a resource can never mean two different things.
 */

export const FACILITY_CAPACITY = { cageUnits: 4, turfUnits: 2 }

/** @typedef {{ id: string, name: string, cageUnits: number, turfUnits: number }} FacilityResource */

/** @type {FacilityResource[]} */
export const FACILITY_RESOURCES = [
  { id: 'cage-1', name: '🏏 Cage 1', cageUnits: 1, turfUnits: 0 },
  { id: 'cage-2', name: '🏏 Cage 2', cageUnits: 1, turfUnits: 0 },
  { id: 'cage-3', name: '🏏 Cage 3', cageUnits: 1, turfUnits: 0 },
  { id: 'cage-4', name: '🏏 Cage 4', cageUnits: 1, turfUnits: 0 },
  { id: 'half-turf', name: '⚽ Half Turf', cageUnits: 0, turfUnits: 1 },
  { id: 'full-turf', name: '⚽ Full Turf', cageUnits: 0, turfUnits: 2 },
  // A capacity bundle rather than one physical resource: the same footprint a
  // team_standard reservation consumes, so a standing team slot still leaves
  // two cages and one turf half open to everyone else.
  { id: 'team-standard', name: '🥎 Team Standard (2 cages + ½ turf)', cageUnits: 2, turfUnits: 1 },
]

/**
 * Units a block consumes. A null/blank resource closes the whole facility.
 * @param {string | null | undefined} resourceId
 * @returns {{ cageUnits: number, turfUnits: number }}
 */
export function blockCapacity(resourceId) {
  if (!resourceId) return { ...FACILITY_CAPACITY }
  const resource = FACILITY_RESOURCES.find(entry => entry.id === resourceId)
  if (!resource) throw new Error('Invalid resource.')
  return { cageUnits: resource.cageUnits, turfUnits: resource.turfUnits }
}
