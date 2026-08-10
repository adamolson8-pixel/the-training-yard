import { sendEmail } from '../utils/email'
import { escapeHtml } from '../utils/sanitize'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, phone, orgName, sport, packageInterest, players, message } = body

  if (!name || !email || !orgName) {
    throw createError({ statusCode: 400, statusMessage: 'Name, email, and organization are required.' })
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'adam@trainingyarddsm.com'
  const supabase = serverSupabaseServiceRole(event)
  const { data: lead, error: leadError } = await (supabase as any).from('lead_submissions').insert({
    kind: 'team_inquiry', name: String(name).trim(), email: String(email).trim().toLowerCase(), phone: phone || null,
    organization_name: String(orgName).trim(), payload: { sport, packageInterest, players, message }, delivery_status: 'pending',
  }).select('id').single()
  if (leadError || !lead) throw createError({ statusCode: 503, statusMessage: 'We could not save your inquiry. Please try again.' })

  const deliveryErrors: string[] = []

  // Email to admin (sanitize all user input)
  try {
    await sendEmail({
      to: adminEmail,
      subject: `Team Inquiry: ${escapeHtml(orgName)} – ${escapeHtml(packageInterest) || 'General'}`,
      html: `
        <h2 style="color:#f59e0b;">New Team Rental Inquiry</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Contact Name</td><td style="padding:8px;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Email</td><td style="padding:8px;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Phone</td><td style="padding:8px;">${escapeHtml(phone) || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Organization</td><td style="padding:8px;">${escapeHtml(orgName)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Sport / Activity</td><td style="padding:8px;">${escapeHtml(sport) || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Package Interest</td><td style="padding:8px;">${escapeHtml(packageInterest) || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Players / Athletes</td><td style="padding:8px;">${escapeHtml(players) || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Message</td><td style="padding:8px;">${escapeHtml(message) || '—'}</td></tr>
        </table>
      `,
    })
  } catch (err) {
    console.error('[team-inquiry] Failed to send admin notification:', err)
    deliveryErrors.push('admin notification')
  }

  // Confirmation to submitter
  try {
    await sendEmail({
      to: email,
      subject: `We received your inquiry – The Training Yard`,
      html: `
        <h2 style="color:#f59e0b;">Thanks, ${escapeHtml(name)}!</h2>
        <p style="font-family:sans-serif;font-size:14px;color:#374151;">
          We got your team rental inquiry for <strong>${escapeHtml(orgName)}</strong> and will be in touch shortly to discuss availability and pricing.
        </p>
        <p style="font-family:sans-serif;font-size:14px;color:#374151;">
          In the meantime, feel free to reply to this email or call us directly.
        </p>
        <p style="font-family:sans-serif;font-size:14px;color:#6b7280;">— The Training Yard Team</p>
      `,
    })
  } catch (err) {
    console.error('[team-inquiry] Failed to send customer confirmation:', err)
    deliveryErrors.push('customer confirmation')
  }

  await (supabase as any).from('lead_submissions').update({
    delivery_status: deliveryErrors.length ? 'failed' : 'delivered',
    delivery_error: deliveryErrors.length ? `Failed: ${deliveryErrors.join(', ')}` : null,
  }).eq('id', lead.id)

  return { success: true, saved: true, emailDelivered: deliveryErrors.length === 0 }
})
