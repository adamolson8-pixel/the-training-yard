import { createHash, randomBytes } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { getAdminEmail, sendEmail } from '../../utils/email'
import { escapeHtml } from '../../utils/sanitize'
import { teamCodeActive } from '../../utils/teamMembership'
import { loadTeamHourlyRates } from '../../utils/teamRates'
import { facilityDateParts } from '../../utils/booking'

const SIGNUP_LINK_MAX_EMAILS = 30

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

  if (action === 'send-signup-link') {
    // Coach emails the player membership signup link (team code) to one or more players/parents
    const emails = [...new Set(String(body.emails ?? body.email ?? '').split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean))]
    if (!emails.length) throw createError({ statusCode: 400, statusMessage: 'Enter at least one email.' })
    if (emails.length > SIGNUP_LINK_MAX_EMAILS) throw createError({ statusCode: 400, statusMessage: `Send to ${SIGNUP_LINK_MAX_EMAILS} emails or fewer at a time.` })
    const invalid = emails.filter(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    if (invalid.length) throw createError({ statusCode: 400, statusMessage: `Check these emails: ${invalid.join(', ')}` })
    const { data: team } = await (supabase as any).from('teams')
      .select('id,name,membership_code,membership_code_plan,membership_includes_turf,membership_discount_ends_on').eq('id', teamId).single()
    if (!team?.membership_code) throw createError({ statusCode: 400, statusMessage: 'This team has no player signup code yet. Contact us to set one up.' })
    if (!teamCodeActive(team)) throw createError({ statusCode: 400, statusMessage: 'This team rate has ended. Contact us to renew it for your players.' })
    const { data: sender } = await (supabase as any).from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    const siteUrl = String(useRuntimeConfig().public.siteUrl || process.env.URL || 'https://trainingyarddsm.com').replace(/\/$/, '')
    const link = `${siteUrl}/portal/membership?team=${encodeURIComponent(team.membership_code)}`
    const coach = escapeHtml(sender?.full_name || 'Your coach')
    const teamName = escapeHtml(team.name)
    const html = `<p>${coach} invited you to sign up for a Training Yard player membership at the <strong>${teamName}</strong> team rate.</p>`
      + `<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#f59e0b;color:#000;font-weight:bold;text-decoration:none;border-radius:8px">Sign up at the team rate</a></p>`
      + `<p>Team code: <strong>${escapeHtml(team.membership_code)}</strong>. If the button doesn't work, copy this link into your browser:<br>${link}</p>`
      + `<p>Create your account (or log in), fill in the player's details and waiver, and you'll be added to the ${teamName} roster automatically.</p>`
      + `<p>The Training Yard<br>2519 NW 66th Ave, Des Moines</p>`
    const results = await Promise.allSettled(emails.map(to => sendEmail({ to, subject: `${team.name} player membership at The Training Yard`, html })))
    const failed = emails.filter((_, i) => results[i]?.status === 'rejected')
    if (failed.length === emails.length) throw createError({ statusCode: 502, statusMessage: 'Unable to send the email right now. Please try again.' })
    return { success: true, sent: emails.length - failed.length, failed }
  }

  if (action === 'request-hours') {
    // Coach asks for hours beyond the team agreement at the team hourly rate; staff confirm by email
    const rates = await loadTeamHourlyRates(supabase)
    const rate = rates.find(r => r.id === String(body.rateId || ''))
    if (!rate) throw createError({ statusCode: 400, statusMessage: 'Choose what you need.' })
    const date = String(body.date || '')
    const time = String(body.time || '')
    const hours = Number(body.hours)
    const extraCages = Math.max(0, Math.min(4, Math.floor(Number(body.extraCages) || 0)))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < facilityDateParts(new Date()).date) throw createError({ statusCode: 400, statusMessage: 'Choose a date today or later.' })
    if (!/^\d{2}:\d{2}$/.test(time)) throw createError({ statusCode: 400, statusMessage: 'Choose a start time.' })
    if (!Number.isFinite(hours) || hours < 0.5 || hours > 8 || (hours * 2) % 1 !== 0) throw createError({ statusCode: 400, statusMessage: 'Hours must be between 0.5 and 8, in half hours.' })
    const notes = String(body.notes || '').trim().slice(0, 1000)
    const cageRate = rates.find(r => r.id === 'cage')
    const addCages = rate.id === 'full' || rate.id === 'cage' ? 0 : extraCages
    const totalCents = Math.round((rate.cents + addCages * (cageRate?.cents || 0)) * hours)

    const [{ data: team }, { data: sender }] = await Promise.all([
      (supabase as any).from('teams').select('name').eq('id', teamId).single(),
      (supabase as any).from('profiles').select('full_name,email,phone').eq('id', user.id).maybeSingle(),
    ])
    const [hh = 0, mm = 0] = time.split(':').map(Number)
    const startLabel = `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`
    const dateLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`
    const what = `${rate.label}${addCages ? ` + ${addCages} additional cage${addCages > 1 ? 's' : ''}` : ''}`
    const row = (k: string, v: string) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`
    await sendEmail({
      to: getAdminEmail(),
      subject: `Additional hours request: ${team?.name || 'Team'} on ${dateLabel}`,
      html: `<p><strong>${escapeHtml(team?.name || 'A team')}</strong> requested additional hours at the team rate.</p><table>`
        + row('Team', team?.name || '')
        + row('Requested by', `${sender?.full_name || ''} (${sender?.email || user.email || ''}${sender?.phone ? `, ${sender.phone}` : ''})`)
        + row('What', what)
        + row('When', `${dateLabel} at ${startLabel}`)
        + row('Hours', String(hours))
        + row('Estimated total', `${money(totalCents)} (${money(rate.cents + addCages * (cageRate?.cents || 0))}/hr)`)
        + (notes ? row('Notes', notes) : '')
        + `</table><p>Confirm availability and reply to the coach to schedule it.</p>`,
    })
    return { success: true, totalCents }
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
