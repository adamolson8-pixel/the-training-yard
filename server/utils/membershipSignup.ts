import type { H3Event } from 'h3'
import { facilityDateParts } from './booking'

/**
 * Who a membership is for and who signs for them. Players under 18 must be
 * signed up by a parent or legal guardian, and every signup signs the facility
 * waiver for the named player before payment.
 */

const RELATIONSHIPS = ['self', 'parent', 'spouse', 'coach', 'other']

/** Whole years between a YYYY-MM-DD birth date and today's facility date. */
export function ageOn(dob: string, today: string) {
  const [by, bm, bd] = dob.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  return ty! - by! - (tm! < bm! || (tm === bm && td! < bd!) ? 1 : 0)
}

export function validateMemberSignup(body: any, today: string = facilityDateParts(new Date()).date) {
  const memberName = String(body.memberName || '').trim()
  const memberDob = String(body.memberDob || '').trim()
  const relationship = String(body.memberRelationship || '').trim()
  const guardianName = String(body.guardianName || '').trim()
  const signerName = String(body.waiverSignerName || '').trim()
  const fail = (message: string) => { throw createError({ statusCode: 400, message }) }

  if (memberName.length < 2) fail("Enter the player's full name.")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(memberDob) || Number.isNaN(Date.parse(memberDob)) || memberDob > today || memberDob < '1900-01-01') {
    fail("Enter the player's date of birth.")
  }
  if (!RELATIONSHIPS.includes(relationship)) fail('Choose who is filling this out.')
  if (relationship !== 'self' && guardianName.length < 2) fail("Enter the parent or guardian's full name.")
  const minor = ageOn(memberDob, today) < 18
  if (minor && relationship !== 'parent') fail('Players under 18 must be signed up by a parent or legal guardian.')
  if (body.waiverAccepted !== true || signerName.length < 2) fail('Please read and sign the liability waiver.')

  return { memberName, memberDob, relationship, guardianName: relationship === 'self' ? '' : guardianName, signerName, minor }
}

/** Records the facility waiver for a membership's player (valid one year), returning its id. */
export async function signMembershipWaiver(supabase: any, event: H3Event, signup: ReturnType<typeof validateMemberSignup>, userId: string, teamId: string | null) {
  const { data: document, error: documentError } = await supabase.from('waiver_documents')
    .select('*').eq('slug', 'facility-liability-release').eq('active', true).order('version', { ascending: false }).limit(1).single()
  if (documentError || !document) throw createError({ statusCode: 503, message: 'The waiver service is temporarily unavailable.' })

  const { data: signature, error } = await supabase.from('waiver_signatures').insert({
    document_id: document.id,
    user_id: userId,
    team_id: teamId,
    participant_name: signup.memberName,
    participant_date_of_birth: signup.memberDob,
    signer_name: signup.signerName,
    guardian_relationship: signup.relationship === 'self' ? null : signup.relationship,
    liability_accepted: true,
    ip_address: getRequestIP(event, { xForwardedFor: true }) || null,
    user_agent: getHeader(event, 'user-agent') || null,
    document_snapshot: {
      slug: document.slug, version: document.version, title: document.title,
      content: document.content, content_hash: document.content_hash,
    },
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }).select('id,signed_at').single()
  if (error || !signature) throw createError({ statusCode: 503, message: 'We could not record the waiver. Please try again.' })

  // An adult signing up for themselves has also signed their own account waiver
  if (signup.relationship === 'self') {
    await supabase.from('profiles').update({ waiver_signed: true, waiver_signed_at: signature.signed_at }).eq('id', userId)
  }
  return signature.id as string
}
