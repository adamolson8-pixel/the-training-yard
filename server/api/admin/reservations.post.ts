import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'
import { facilityWindow, serviceCapacity } from '../../utils/booking'
import { recordAdminAction } from '../../utils/adminAudit'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)
  const userId = body.user_id ? String(body.user_id) : null
  const teamId = body.team_id ? String(body.team_id) : null
  const serviceId = String(body.service_id || '')
  const { service, cageUnits, turfUnits } = serviceCapacity(serviceId)
  const window = facilityWindow(String(body.date || ''), String(body.time || ''), service.durationMinutes)

  const [{ data: profile }, { data: team }] = await Promise.all([
    userId ? (supabase as any).from('profiles').select('id,full_name,email,phone,waiver_signed').eq('id', userId).maybeSingle() : { data: null },
    teamId ? (supabase as any).from('teams').select('id,name,organization_name').eq('id', teamId).maybeSingle() : { data: null },
  ])
  if (userId && !profile) throw createError({ statusCode: 404, statusMessage: 'Account not found.' })
  if (teamId && !team) throw createError({ statusCode: 404, statusMessage: 'Team not found.' })

  const customerName = String(body.customer_name || profile?.full_name || team?.name || '').trim()
  const customerEmail = String(body.customer_email || profile?.email || '').trim().toLowerCase()
  const customerPhone = String(body.customer_phone || profile?.phone || '').trim()
  if (customerName.length < 2 || !/^\S+@\S+\.\S+$/.test(customerEmail)) {
    throw createError({ statusCode: 400, statusMessage: 'Customer name and a valid email are required.' })
  }
  const amountCents = Math.max(0, Number(body.amount_cents || 0))
  if (!Number.isInteger(amountCents)) throw createError({ statusCode: 400, statusMessage: 'Amount must be whole cents.' })

  const { data: bookingId, error: holdError } = await (supabase as any).rpc('create_booking_hold', {
    p_user_id: userId,
    p_team_id: teamId,
    p_service_type: service.id,
    p_service_label: service.label,
    p_duration_minutes: service.durationMinutes,
    p_booking_date: String(body.date),
    p_booking_time: window.normalizedTime,
    p_start_at: window.startAt.toISOString(),
    p_end_at: window.endAt.toISOString(),
    p_cage_units: cageUnits,
    p_turf_units: turfUnits,
    p_customer_name: customerName,
    p_customer_email: customerEmail,
    p_customer_phone: customerPhone,
    p_player_name: String(body.player_name || ''),
    p_player_age: body.player_age ? Number(body.player_age) : null,
    p_sport: String(body.sport || ''),
    p_notes: String(body.notes || ''),
    p_waiver_accepted: profile?.waiver_signed === true,
    p_waiver_signer_name: profile?.waiver_signed ? String(profile.full_name || customerName) : '',
    p_amount_cents: amountCents,
  })
  if (holdError || !bookingId) {
    const unavailable = String(holdError?.message || '').includes('slot_unavailable')
    throw createError({ statusCode: unavailable ? 409 : 500, statusMessage: unavailable ? 'That time no longer has enough capacity.' : 'Unable to create the reservation.' })
  }

  const { data: booking, error: confirmError } = await (supabase as any).from('bookings').update({
    status: 'confirmed',
    payment_status: amountCents === 0 ? 'paid' : 'pending',
    confirmed_at: new Date().toISOString(),
    hold_expires_at: null,
    created_by_admin: admin.id,
    booking_source: 'admin',
    admin_notes: String(body.admin_notes || '').trim() || null,
  }).eq('id', bookingId).select('*').single()
  if (confirmError) throw createError({ statusCode: 500, statusMessage: 'The hold was created but could not be confirmed.' })

  await recordAdminAction(supabase, admin.id, 'reservation.created', 'booking', bookingId, {
    user_id: userId, team_id: teamId, service_id: serviceId, start_at: window.startAt.toISOString(), amount_cents: amountCents,
  })
  return { success: true, booking }
})
