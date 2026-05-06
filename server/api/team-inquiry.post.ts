import { sendEmail } from '../utils/email'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, phone, orgName, sport, packageInterest, players, message } = body

  if (!name || !email || !orgName) {
    throw createError({ statusCode: 400, statusMessage: 'Name, email, and organization are required.' })
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'adam@trainingyarddsm.com'

  // Email to admin
  await sendEmail({
    to: adminEmail,
    subject: `Team Inquiry: ${orgName} – ${packageInterest || 'General'}`,
    html: `
      <h2 style="color:#f59e0b;">New Team Rental Inquiry</h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
        <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Contact Name</td><td style="padding:8px;">${name}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Email</td><td style="padding:8px;">${email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Phone</td><td style="padding:8px;">${phone || '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Organization</td><td style="padding:8px;">${orgName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Sport / Activity</td><td style="padding:8px;">${sport || '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Package Interest</td><td style="padding:8px;">${packageInterest || '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Players / Athletes</td><td style="padding:8px;">${players || '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#6b7280;">Message</td><td style="padding:8px;">${message || '—'}</td></tr>
      </table>
    `,
  })

  // Confirmation to submitter
  await sendEmail({
    to: email,
    subject: `We received your inquiry – The Training Yard`,
    html: `
      <h2 style="color:#f59e0b;">Thanks, ${name}!</h2>
      <p style="font-family:sans-serif;font-size:14px;color:#374151;">
        We got your team rental inquiry for <strong>${orgName}</strong> and will be in touch shortly to discuss availability and pricing.
      </p>
      <p style="font-family:sans-serif;font-size:14px;color:#374151;">
        In the meantime, feel free to reply to this email or call us directly.
      </p>
      <p style="font-family:sans-serif;font-size:14px;color:#6b7280;">— The Training Yard Team</p>
    `,
  })

  return { success: true }
})
