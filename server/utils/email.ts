import nodemailer from 'nodemailer'

function getTransporter() {
  const config = useRuntimeConfig()
  const host = config.smtpHost || process.env.SMTP_HOST
  if (!host) {
    console.warn('[email] SMTP_HOST not set — emails will not be sent.')
    return null
  }
  return nodemailer.createTransport({
    host,
    port: config.smtpPort || 465,
    secure: (config.smtpPort || 465) === 465,
    auth: {
      user: config.smtpUser || process.env.SMTP_USER,
      pass: config.smtpPass || process.env.SMTP_PASS,
    },
  })
}

export async function sendBookingConfirmation(booking: any) {
  const transporter = getTransporter()
  if (!transporter) return

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #1B4332; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed! ✅</h1>
        <p style="color: #86efac; margin: 8px 0 0;">Training Yard DSM</p>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px;">Hi <strong>${booking.customer_name}</strong>,</p>
        <p>Your session is booked! Here are the details:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #fff; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 12px; font-weight: bold; width: 40%;">Service</td>
            <td style="padding: 10px 12px;">${booking.service_label}</td>
          </tr>
          <tr style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 12px; font-weight: bold;">Date</td>
            <td style="padding: 10px 12px;">${booking.booking_date}</td>
          </tr>
          <tr style="background: #fff; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 12px; font-weight: bold;">Time</td>
            <td style="padding: 10px 12px;">${booking.booking_time}</td>
          </tr>
          <tr style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 12px; font-weight: bold;">Duration</td>
            <td style="padding: 10px 12px;">${booking.duration_minutes} minutes</td>
          </tr>
          ${booking.player_name ? `
          <tr style="background: #fff; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 12px; font-weight: bold;">Player</td>
            <td style="padding: 10px 12px;">${booking.player_name}</td>
          </tr>` : ''}
          <tr style="background: #f3f4f6;">
            <td style="padding: 10px 12px; font-weight: bold;">Amount Paid</td>
            <td style="padding: 10px 12px; color: #d97706; font-weight: bold;">$${(booking.amount_cents / 100).toFixed(0)}</td>
          </tr>
        </table>

        <div style="background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold; color: #166534;">📍 Location</p>
          <p style="margin: 4px 0 0; color: #15803d;">2519 NW 66th Ave, Des Moines, IA</p>
        </div>

        <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">🎒 What to Bring</p>
          <ul style="margin: 8px 0 0; padding-left: 20px; color: #78350f;">
            <li>Athletic cleats or sneakers (no metal spikes)</li>
            <li>Your own bat and batting gloves (recommended)</li>
            <li>Water bottle</li>
            <li>Athletic attire</li>
          </ul>
        </div>

        <p style="color: #6b7280; font-size: 14px;">Questions? Email us at <a href="mailto:info@trainingyarddsm.com" style="color: #1B4332;">info@trainingyarddsm.com</a></p>
        <p style="color: #6b7280; font-size: 14px;">See you on the field!</p>
        <p style="color: #6b7280; font-size: 14px;">— The Training Yard Team</p>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: `"Training Yard DSM" <info@trainingyarddsm.com>`,
    to: booking.customer_email,
    subject: `Booking Confirmed — ${booking.service_label} on ${booking.booking_date}`,
    html,
  })
}

export async function sendAdminNotification(booking: any) {
  const transporter = getTransporter()
  if (!transporter) return

  const adminEmail = process.env.ADMIN_EMAIL || 'adam@trainingyarddsm.com'

  const text = `
NEW BOOKING CONFIRMED
=====================
Service:  ${booking.service_label}
Date:     ${booking.booking_date}
Time:     ${booking.booking_time}
Duration: ${booking.duration_minutes} min

Customer: ${booking.customer_name}
Email:    ${booking.customer_email}
Phone:    ${booking.customer_phone}
${booking.player_name ? `Player:   ${booking.player_name} (age ${booking.player_age || 'N/A'})` : ''}
${booking.sport ? `Sport:    ${booking.sport}` : ''}
${booking.notes ? `Notes:    ${booking.notes}` : ''}

Amount:   $${(booking.amount_cents / 100).toFixed(0)}
Stripe:   ${booking.stripe_session_id}
Booking ID: ${booking.id}
  `.trim()

  await transporter.sendMail({
    from: `"Training Yard Booking" <info@trainingyarddsm.com>`,
    to: adminEmail,
    subject: `[New Booking] ${booking.customer_name} — ${booking.service_label} on ${booking.booking_date}`,
    text,
  })
}
