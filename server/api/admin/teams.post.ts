import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'
import { recordAdminAction } from '../../utils/adminAudit'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const action = String(body.action || '')
  const supabase = serverSupabaseServiceRole(event)

  if (action === 'create-team') {
    const name = String(body.name || '').trim()
    const ownerId = String(body.owner_id || '')
    if (name.length < 2 || !ownerId) throw createError({ statusCode: 400, statusMessage: 'Team name and owner account are required.' })
    const { data: owner } = await (supabase as any).from('profiles').select('id,email,full_name').eq('id', ownerId).maybeSingle()
    if (!owner) throw createError({ statusCode: 404, statusMessage: 'Owner account not found.' })
    const { data: team, error } = await (supabase as any).from('teams').insert({
      name, organization_name: String(body.organization_name || '').trim() || null,
      sport: String(body.sport || '').trim() || null, age_group: String(body.age_group || '').trim() || null,
      created_by: ownerId,
    }).select('*').single()
    if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to create the team.' })
    await (supabase as any).from('team_members').insert({
      team_id: team.id, user_id: owner.id, email: owner.email, full_name: owner.full_name, role: 'owner', status: 'active',
    })
    await recordAdminAction(supabase, admin.id, 'team.created', 'team', team.id, { owner_id: ownerId })
    return { success: true, team }
  }

  const teamId = String(body.team_id || '')
  const { data: team } = await (supabase as any).from('teams').select('id,name,created_by').eq('id', teamId).maybeSingle()
  if (!team) throw createError({ statusCode: 404, statusMessage: 'Team not found.' })

  if (action === 'add-participant') {
    const fullName = String(body.full_name || '').trim()
    if (fullName.length < 2) throw createError({ statusCode: 400, statusMessage: 'Participant name is required.' })
    const { data, error } = await (supabase as any).from('team_participants').insert({
      team_id: teamId, full_name: fullName, date_of_birth: body.date_of_birth || null,
      guardian_name: String(body.guardian_name || '').trim() || null,
      guardian_email: String(body.guardian_email || '').trim().toLowerCase() || null,
      guardian_relationship: String(body.guardian_relationship || '').trim() || null,
    }).select('*').single()
    if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to add the participant.' })
    await recordAdminAction(supabase, admin.id, 'team.participant_added', 'participant', data.id, { team_id: teamId })
    return { success: true, participant: data }
  }

  if (action === 'add-member') {
    const email = String(body.email || '').trim().toLowerCase()
    const role = body.role === 'manager' ? 'manager' : 'coach'
    const { data: profile } = await (supabase as any).from('profiles').select('id,email,full_name').ilike('email', email).maybeSingle()
    if (!profile) throw createError({ statusCode: 404, statusMessage: 'Create the account first, then add it to the team.' })
    const { data, error } = await (supabase as any).from('team_members').upsert({
      team_id: teamId, user_id: profile.id, email: profile.email, full_name: profile.full_name, role, status: 'active',
    }, { onConflict: 'team_id,email' }).select('*').single()
    if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to add the team member.' })
    await recordAdminAction(supabase, admin.id, 'team.member_added', 'team_member', data.id, { team_id: teamId, user_id: profile.id, role })
    return { success: true, member: data }
  }

  if (action === 'adjust-hours') {
    const packageType = body.package_type === 'buyout' ? 'buyout' : 'standard'
    const delta = Number(body.hours_delta)
    if (!Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 500) throw createError({ statusCode: 400, statusMessage: 'Enter a non-zero hour adjustment.' })
    let { data: pkg } = await (supabase as any).from('team_packages').select('*').eq('team_id', teamId).eq('package_type', packageType).eq('status', 'active').order('created_at').limit(1).maybeSingle()
    if (!pkg) {
      const result = await (supabase as any).from('team_packages').insert({
        team_id: teamId, purchased_by: team.created_by, package_type: packageType,
        package_name: `Admin ${packageType} balance`, hours_purchased: Math.max(delta, 0), hours_remaining: Math.max(delta, 0),
        amount_cents: 0, status: 'active', purchased_at: new Date().toISOString(),
      }).select('*').single()
      pkg = result.data
      if (result.error || !pkg) throw createError({ statusCode: 500, statusMessage: 'Unable to create the team balance.' })
      if (delta < 0) throw createError({ statusCode: 400, statusMessage: 'This team has no hours to subtract.' })
    } else {
      const next = Number(pkg.hours_remaining) + delta
      if (next < 0) throw createError({ statusCode: 400, statusMessage: 'The adjustment cannot make the balance negative.' })
      const { error } = await (supabase as any).from('team_packages').update({ hours_remaining: next, hours_purchased: Math.max(Number(pkg.hours_purchased), next) }).eq('id', pkg.id)
      if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to adjust the team balance.' })
    }
    await (supabase as any).from('team_package_ledger').insert({
      team_package_id: pkg.id, hours_delta: delta, reason: String(body.reason || 'Admin adjustment'), created_by: admin.id,
    })
    await recordAdminAction(supabase, admin.id, 'team.hours_adjusted', 'team', teamId, { package_type: packageType, hours_delta: delta })
    return { success: true }
  }

  throw createError({ statusCode: 400, statusMessage: 'Unknown team action.' })
})
