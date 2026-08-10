import { createHash, randomBytes } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { sendEmail } from '../../utils/email'
import { escapeHtml } from '../../utils/sanitize'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const action = String(body.action || '')
  const supabase = serverSupabaseServiceRole(event)

  if (action === 'accept-invitation') {
    const token = String(body.token || '')
    if (token.length < 32) throw createError({ statusCode: 400, statusMessage: 'Invalid invitation.' })
    const { data: invitation } = await (supabase as any).from('team_invitations').select('id,team_id,email,role,expires_at,accepted_at')
      .eq('token_hash', hashToken(token)).maybeSingle()
    if (!invitation || invitation.accepted_at || new Date(invitation.expires_at) <= new Date() || invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      throw createError({ statusCode: 400, statusMessage: 'This invitation is invalid, expired, or belongs to another email.' })
    }
    await (supabase as any).from('team_members').upsert({
      team_id: invitation.team_id, user_id: user.id, email: user.email, full_name: (user as any).user_metadata?.full_name || null,
      role: invitation.role, status: 'active',
    }, { onConflict: 'team_id,email' })
    await (supabase as any).from('team_invitations').update({ accepted_at: new Date().toISOString() }).eq('id', invitation.id)
    return { success: true }
  }

  const teamId = String(body.teamId || '')
  const { data: access } = await (supabase as any).from('team_members').select('role').eq('team_id', teamId).eq('user_id', user.id).eq('status', 'active').maybeSingle()
  if (!access || !['owner', 'coach', 'manager'].includes(access.role)) throw createError({ statusCode: 403, statusMessage: 'Team manager access is required.' })

  if (action === 'add-participant') {
    const fullName = String(body.fullName || '').trim()
    if (fullName.length < 2) throw createError({ statusCode: 400, statusMessage: 'Participant name is required.' })
    const { data, error } = await (supabase as any).from('team_participants').insert({
      team_id: teamId, full_name: fullName, date_of_birth: body.dateOfBirth || null,
      guardian_name: String(body.guardianName || '').trim() || null,
      guardian_email: String(body.guardianEmail || '').trim().toLowerCase() || null,
      guardian_relationship: String(body.guardianRelationship || '').trim() || null,
    }).select('id').single()
    if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to add the participant.' })
    return { success: true, participantId: data.id }
  }

  if (action === 'invite-coach') {
    const email = String(body.email || '').trim().toLowerCase()
    const role = body.role === 'manager' ? 'manager' : 'coach'
    if (!/^\S+@\S+\.\S+$/.test(email)) throw createError({ statusCode: 400, statusMessage: 'Enter a valid coach email.' })
    const { data: team } = await (supabase as any).from('teams').select('name').eq('id', teamId).single()
    const { data: profile } = await (supabase as any).from('profiles').select('id,full_name').ilike('email', email).maybeSingle()
    let inviteUrl = ''
    if (profile) {
      await (supabase as any).from('team_members').upsert({ team_id: teamId, user_id: profile.id, email, full_name: profile.full_name, role, status: 'active' }, { onConflict: 'team_id,email' })
    } else {
      const token = randomBytes(32).toString('hex')
      await (supabase as any).from('team_invitations').insert({
        team_id: teamId, email, role, token_hash: hashToken(token), invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      const siteUrl = String(useRuntimeConfig().public.siteUrl || process.env.URL || 'https://trainingyarddsm.com').replace(/\/$/, '')
      inviteUrl = `${siteUrl}/login?signup=true&redirect=${encodeURIComponent(`/portal/team?invite=${token}`)}`
    }
    await sendEmail({
      to: email,
      subject: `You're invited to ${team?.name || 'a Training Yard team'}`,
      html: `<p>${escapeHtml(user.email || 'A coach')} invited you to help manage <strong>${escapeHtml(team?.name || 'their team')}</strong> at The Training Yard.</p><p>${inviteUrl ? `<a href="${inviteUrl}">Create your account and accept the invitation</a>` : '<a href="https://trainingyarddsm.com/portal/team">Open your team portal</a>'}</p>`,
    })
    return { success: true, existingAccount: Boolean(profile) }
  }

  if (action === 'request-waiver') {
    const participantId = String(body.participantId || '')
    const { data: participant } = await (supabase as any).from('team_participants')
      .select('id,full_name,guardian_email,teams(name)').eq('id', participantId).eq('team_id', teamId).maybeSingle()
    if (!participant?.guardian_email) throw createError({ statusCode: 400, statusMessage: 'Add a guardian email before requesting the waiver.' })
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    await (supabase as any).from('team_participants').update({
      waiver_token_hash: hashToken(token), waiver_token_expires_at: expiresAt, waiver_requested_at: new Date().toISOString(),
    }).eq('id', participantId)
    const siteUrl = String(useRuntimeConfig().public.siteUrl || process.env.URL || 'https://trainingyarddsm.com').replace(/\/$/, '')
    const waiverUrl = `${siteUrl}/team-waiver?token=${token}`
    await sendEmail({
      to: participant.guardian_email,
      subject: `Waiver required for ${participant.full_name}`,
      html: `<p>Please review and sign The Training Yard liability waiver for <strong>${escapeHtml(participant.full_name)}</strong>${participant.teams?.name ? `, a participant with <strong>${escapeHtml(participant.teams.name)}</strong>` : ''}.</p><p><a href="${waiverUrl}">Review and sign the participant waiver</a></p><p>This private link expires in 14 days.</p>`,
    })
    return { success: true }
  }

  throw createError({ statusCode: 400, statusMessage: 'Unknown team action.' })
})
