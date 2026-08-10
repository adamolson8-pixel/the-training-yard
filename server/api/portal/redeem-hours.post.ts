import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { bookingWindow, displayTime, serviceCapacity } from '../../utils/booking'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { service, cageUnits, turfUnits } = serviceCapacity(String(body.serviceId || ''))
  if (!service.isTeam) throw createError({ statusCode: 400, statusMessage: 'Select a team service.' })
  const packageType = service.id.startsWith('full_buyout') ? 'buyout' : 'standard'
  const hours = service.durationMinutes / 60
  const window = bookingWindow(String(body.date || ''), String(body.time || ''), service.durationMinutes)
  const supabase = serverSupabaseServiceRole(event)

  const { data: profile } = await (supabase as any).from('profiles').select('full_name,email,phone,waiver_signed').eq('id', user.id).single()
  if (!profile?.waiver_signed) throw createError({ statusCode: 409, statusMessage: 'Sign the account waiver before booking a team session.' })

  let membershipQuery = (supabase as any).from('team_members').select('team_id').eq('user_id', user.id).eq('status', 'active')
  if (body.teamId) membershipQuery = membershipQuery.eq('team_id', body.teamId)
  const { data: membership } = await membershipQuery.limit(1).maybeSingle()
  if (!membership) throw createError({ statusCode: 403, statusMessage: 'No active team account was found.' })

  const [{ data: participants }, { data: contracts }] = await Promise.all([
    (supabase as any).from('team_participants').select('id,full_name,waiver_signature_id,waiver_signatures!team_participants_waiver_signature_id_fkey(expires_at,revoked_at)')
      .eq('team_id', membership.team_id).eq('status', 'active'),
    (supabase as any).from('compliance_documents').select('id,expires_at,status').eq('team_id', membership.team_id)
      .eq('document_type', 'contract').in('status', ['signed', 'active']),
  ])
  const now = Date.now()
  const unsigned = (participants || []).filter((participant: any) => {
    const signature = participant.waiver_signatures
    return !participant.waiver_signature_id || !signature || signature.revoked_at || (signature.expires_at && new Date(signature.expires_at).getTime() <= now)
  })
  if (unsigned.length) {
    throw createError({ statusCode: 409, statusMessage: `${unsigned.length} active participant waiver${unsigned.length === 1 ? ' is' : 's are'} missing or expired.` })
  }
  const activeContract = (contracts || []).some((contract: any) => !contract.expires_at || new Date(contract.expires_at).getTime() > now)
  if (!activeContract) throw createError({ statusCode: 409, statusMessage: 'A current team contract is required before online team booking.' })

  const { data: bookingId, error: holdError } = await (supabase as any).rpc('create_booking_hold', {
    p_user_id: user.id, p_team_id: membership.team_id, p_service_type: service.id, p_service_label: service.label,
    p_duration_minutes: service.durationMinutes, p_booking_date: body.date, p_booking_time: displayTime(window.normalizedTime),
    p_start_at: window.startAt.toISOString(), p_end_at: window.endAt.toISOString(), p_cage_units: cageUnits, p_turf_units: turfUnits,
    p_customer_name: String(body.customerName || profile.full_name || '').trim(), p_customer_email: profile.email || user.email,
    p_customer_phone: String(body.customerPhone || profile.phone || '').trim(), p_player_name: String(body.playerName || ''),
    p_player_age: body.playerAge ? Number(body.playerAge) : null, p_sport: String(body.sport || ''), p_notes: String(body.notes || ''),
    p_waiver_accepted: true, p_waiver_signer_name: profile.full_name || String(body.waiverSignerName || ''), p_amount_cents: 0,
  })
  if (holdError || !bookingId) {
    const unavailable = /slot_(unavailable|blocked)/.test(holdError?.message || '')
    throw createError({ statusCode: unavailable ? 409 : 503, statusMessage: unavailable ? 'That time was just booked. Please choose another.' : 'Unable to reserve that time.' })
  }

  const { error: redeemError } = await (supabase as any).rpc('redeem_team_booking', {
    p_booking_id: bookingId, p_team_id: membership.team_id, p_user_id: user.id, p_package_type: packageType, p_hours: hours,
  })
  if (redeemError) {
    await (supabase as any).from('bookings').update({ status: 'expired', payment_status: 'failed', hold_expires_at: new Date().toISOString() }).eq('id', bookingId)
    const insufficient = /insufficient_team_hours/.test(redeemError.message || '')
    throw createError({ statusCode: insufficient ? 409 : 500, statusMessage: insufficient ? 'Your team does not have enough package hours.' : 'Unable to redeem team hours.' })
  }
  await (supabase as any).from('bookings').update({ booking_source: 'team_portal' }).eq('id', bookingId)
  return { success: true, bookingId }
})
