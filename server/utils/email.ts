/**
 * Email Service — The Training Yard
 *
 * Provider Priority:
 *   1. Resend  (preferred — set NUXT_RESEND_API_KEY)
 *   2. Zoho SMTP via nodemailer (fallback — existing SMTP_* env vars)
 *
 * All public-facing emails are sent FROM:
 *   "The Training Yard" <info@trainingyarddsm.com>
 */

import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const FROM_ADDRESS = '"The Training Yard" <info@trainingyarddsm.com>'
const BRAND_COLOR = '#d97706'   // amber-600
const DARK_BG = '#111827'       // gray-900
const FACILITY_ADDRESS = '2519 NW 66th Ave, Des Moines, IA 50313'

// ─── Provider helpers ────────────────────────────────────────────────────────

function getResend(): Resend | null {
  const config = useRuntimeConfig()
  const key = config.resendApiKey || process.env.NUXT_RESEND_API_KEY || process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function getSmtpTransporter() {
  const config = useRuntimeConfig()
  const host = config.smtpHost || process.env.SMTP_HOST
  if (!host) return null
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

/**
 * Admin notification recipients.
 * NOTE: adam@trainingyarddsm.com is NOT a real mailbox - never use it as a default.
 * Env value (ADMIN_EMAIL / NUXT_ADMIN_EMAIL) may be a comma-separated list.
 */
const DEFAULT_ADMIN_RECIPIENTS = [
  'adam@heartlandroofingandsiding.com',
  'jesse@heartlandroofingandsiding.com',
]

export function getAdminEmail(): string[] {
  const config = useRuntimeConfig()
  const raw = String((config.adminEmail as string) || process.env.ADMIN_EMAIL || '').trim()
  const parsed = raw.split(',').map(a => a.trim()).filter(Boolean)
  return parsed.length ? parsed : [...DEFAULT_ADMIN_RECIPIENTS]
}

async function getEmailTemplates() {
  const defaultTemplates = {
    booking_confirm: `Hi {{name}},\n\nYour session at The Training Yard is confirmed!\n\n📅 Date: {{date}}\n⚾ Service: {{service}}\n\nSee you on the field!\n— The Training Yard Team`,
    booking_reminder: `Hi {{name}},\n\nReminder: You have a session tomorrow at The Training Yard.\n\n📅 Date: {{date}}\n⚾ Service: {{service}}\n\nQuestions? Reply to this email.\n— The Training Yard Team`,
    booking_cancel: `Hi {{name}},\n\nYour session on {{date}} has been cancelled. If a refund is due, allow 5–10 business days to appear.\n\nWe hope to see you again soon!\n— The Training Yard Team`
  }

  const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NUXT_SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return defaultTemplates

  const supabase = createClient(url, key)
  try {
    const { data, error } = await supabase.from('system_settings').select('value').eq('key', 'email_templates').single()
    if (data && data.value && Array.isArray(data.value)) {
      const dbTemplates: Record<string, string> = {}
      data.value.forEach((t: any) => { dbTemplates[t.key] = t.body })
      return { ...defaultTemplates, ...dbTemplates }
    }
  } catch (e) {
    // Ignore error if table doesn't exist yet
  }
  return defaultTemplates
}

// ─── Core send function ───────────────────────────────────────────────────────

export async function sendEmail({ to, subject, html, text }: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  const recipients = (Array.isArray(to) ? to : String(to).split(','))
    .map(a => a.trim())
    .filter(Boolean)
  if (!recipients.length) throw new Error('[email] No recipients provided')

  const resend = getResend()

  if (resend) {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject,
      html,
      text,
    })
    if (error) {
      console.error('[email:resend] Failed to send:', error)
      // Throw so callers can record an accurate delivery status instead of assuming success.
      throw new Error(`Resend send failed: ${error.message || error.name || 'unknown error'}`)
    }
    return
  }

  // Fallback: Zoho SMTP
  const transporter = getSmtpTransporter()
  if (!transporter) {
    console.warn('[email] No provider configured. Email not sent. Set NUXT_RESEND_API_KEY or SMTP_* env vars.')
    return
  }
  await transporter.sendMail({ from: FROM_ADDRESS, to: recipients, subject, html, text })
}

// ─── Shared HTML wrapper ─────────────────────────────────────────────────────

function emailWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:${DARK_BG};padding:28px 32px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">The Training Yard</div>
            <div style="font-size:13px;color:${BRAND_COLOR};margin-top:4px;font-weight:600;">Des Moines, Iowa</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">${FACILITY_ADDRESS}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">
              <a href="mailto:info@trainingyarddsm.com" style="color:${BRAND_COLOR};text-decoration:none;">info@trainingyarddsm.com</a>
              &nbsp;·&nbsp;
              <a href="https://trainingyarddsm.com" style="color:${BRAND_COLOR};text-decoration:none;">trainingyarddsm.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Booking Detail Table ─────────────────────────────────────────────────────

function bookingTable(booking: any): string {
  const rows = [
    ['Service', booking.service_label ?? '—'],
    ['Date', booking.booking_date ?? '—'],
    ['Time', booking.booking_time ?? '—'],
    ['Duration', booking.duration_minutes ? `${booking.duration_minutes} minutes` : '—'],
    ...(booking.player_name ? [['Player', booking.player_name]] : []),
    ['Amount', `$${((booking.amount_cents ?? 0) / 100).toFixed(2)}`],
  ]
  const rowsHtml = rows.map(([label, value], i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td style="padding:10px 14px;font-weight:600;color:#374151;font-size:14px;width:38%;border-bottom:1px solid #f3f4f6;">${label}</td>
      <td style="padding:10px 14px;color:#111827;font-size:14px;border-bottom:1px solid #f3f4f6;">${value}</td>
    </tr>`).join('')

  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;margin:20px 0;">
    ${rowsHtml}
  </table>`
}

// ─── Booking Confirmation ─────────────────────────────────────────────────────

export async function sendBookingConfirmation(booking: any) {
  const templates = await getEmailTemplates()
  let customText = templates.booking_confirm
    .replace(/{{name}}/g, booking.customer_name)
    .replace(/{{date}}/g, booking.booking_date)
    .replace(/{{service}}/g, booking.service_label)

  const customHtml = customText.replace(/\n/g, '<br/>')

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Booking Confirmed ✅</h2>
    <div style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.5;">${customHtml}</div>

    ${bookingTable(booking)}

    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-weight:700;color:#92400e;font-size:13px;">📍 Location</p>
      <p style="margin:6px 0 0;color:#78350f;font-size:14px;">${FACILITY_ADDRESS}</p>
    </div>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-weight:700;color:#166534;font-size:13px;">🎒 What to Bring</p>
      <ul style="margin:8px 0 0;padding-left:18px;color:#15803d;font-size:14px;line-height:1.8;">
        <li>Athletic cleats or sneakers (no metal spikes)</li>
        <li>Your own bat and batting gloves (recommended)</li>
        <li>Water bottle</li>
        <li>Athletic attire</li>
      </ul>
    </div>

    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">Need to cancel or reschedule? Log in to your <a href="https://trainingyarddsm.com/portal/bookings" style="color:${BRAND_COLOR};font-weight:600;">Customer Portal</a> or email us.</p>
    <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">— The Training Yard Team</p>
  `

  await sendEmail({
    to: booking.customer_email,
    subject: `✅ Booking Confirmed — ${booking.service_label} on ${booking.booking_date}`,
    html: emailWrapper('Booking Confirmed', body),
    text: `Hi ${booking.customer_name}, your session at The Training Yard is confirmed!\n\nService: ${booking.service_label}\nDate: ${booking.booking_date}\nTime: ${booking.booking_time}\nAmount: $${((booking.amount_cents ?? 0) / 100).toFixed(2)}\n\nLocation: ${FACILITY_ADDRESS}\n— The Training Yard Team`,
  })
}

// ─── Booking Reminder (24 hrs) ────────────────────────────────────────────────

export async function sendBookingReminder(booking: any) {
  const templates = await getEmailTemplates()
  let customText = templates.booking_reminder
    .replace(/{{name}}/g, booking.customer_name)
    .replace(/{{date}}/g, booking.booking_date)
    .replace(/{{service}}/g, booking.service_label)

  const customHtml = customText.replace(/\n/g, '<br/>')

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Your Session is Tomorrow 🗓️</h2>
    <div style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.5;">${customHtml}</div>

    ${bookingTable(booking)}

    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-weight:700;color:#92400e;font-size:13px;">📍 Location</p>
      <p style="margin:6px 0 0;color:#78350f;font-size:14px;">${FACILITY_ADDRESS}</p>
    </div>

    <p style="margin:20px 0 4px;font-size:13px;color:#9ca3af;">⚠️ Cancellations within 24 hours of your session are subject to a 50% fee. <a href="https://trainingyarddsm.com/portal/bookings" style="color:${BRAND_COLOR};">Manage your booking →</a></p>
    <p style="margin:16px 0 0;font-size:14px;color:#6b7280;">See you soon!<br/>— The Training Yard Team</p>
  `

  await sendEmail({
    to: booking.customer_email,
    subject: `⏰ Reminder — Your Training Yard session is tomorrow (${booking.booking_date})`,
    html: emailWrapper('Session Reminder', body),
    text: `Hi ${booking.customer_name}, just a reminder that your session is tomorrow!\n\nService: ${booking.service_label}\nDate: ${booking.booking_date}\nTime: ${booking.booking_time}\n\nLocation: ${FACILITY_ADDRESS}\n— The Training Yard Team`,
  })
}

// ─── Cancellation Confirmation ────────────────────────────────────────────────

export async function sendCancellationConfirmation(booking: any, isFullRefund: boolean) {
  const templates = await getEmailTemplates()
  let customText = templates.booking_cancel
    .replace(/{{name}}/g, booking.customer_name)
    .replace(/{{date}}/g, booking.booking_date)
    .replace(/{{service}}/g, booking.service_label)

  const customHtml = customText.replace(/\n/g, '<br/>')

  const refundNote = isFullRefund
    ? 'A <strong>full refund</strong> has been issued and should appear within 5–10 business days.'
    : 'A <strong>50% refund</strong> has been issued (cancellation within 24 hours of your session). Please allow 5–10 business days.'

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Session Cancelled</h2>
    <div style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.5;">${customHtml}</div>

    ${bookingTable(booking)}

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#991b1b;">${refundNote}</p>
    </div>

    <p style="margin:20px 0 4px;font-size:14px;color:#6b7280;">We hope to see you again soon. <a href="https://trainingyarddsm.com/portal/book" style="color:${BRAND_COLOR};font-weight:600;">Book another session →</a></p>
    <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">— The Training Yard Team</p>
  `

  await sendEmail({
    to: booking.customer_email,
    subject: `Session Cancelled — ${booking.service_label} on ${booking.booking_date}`,
    html: emailWrapper('Session Cancelled', body),
    text: `Hi ${booking.customer_name}, your session on ${booking.booking_date} has been cancelled.\n\n${isFullRefund ? 'A full refund has been issued.' : 'A 50% refund has been issued.'} Allow 5–10 business days.\n\n— The Training Yard Team`,
  })
}

// ─── Admin New Booking Notification ──────────────────────────────────────────

export async function sendAdminNotification(booking: any) {
  const adminEmail = getAdminEmail()
  const text = `
NEW BOOKING
===========
Service:    ${booking.service_label}
Date:       ${booking.booking_date}
Time:       ${booking.booking_time}
Duration:   ${booking.duration_minutes} min
Amount:     $${((booking.amount_cents ?? 0) / 100).toFixed(2)}

Customer:   ${booking.customer_name}
Email:      ${booking.customer_email}
Phone:      ${booking.customer_phone || '—'}
${booking.player_name ? `Player:     ${booking.player_name} (age ${booking.player_age ?? 'N/A'})` : ''}
${booking.sport ? `Sport:      ${booking.sport}` : ''}
${booking.notes ? `Notes:      ${booking.notes}` : ''}

Booking ID: ${booking.id}
  `.trim()

  const html = emailWrapper('New Booking', `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#111827;">🆕 New Booking Received</h2>
    ${bookingTable(booking)}
    <p style="font-size:13px;color:#6b7280;margin-top:16px;">Booking ID: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${booking.id}</code></p>
    <a href="https://trainingyarddsm.com/admin/bookings" style="display:inline-block;margin-top:16px;background:${DARK_BG};color:#fff;font-weight:700;font-size:14px;padding:10px 20px;border-radius:8px;text-decoration:none;">View in Admin →</a>
  `)

  await sendEmail({
    to: adminEmail,
    subject: `[New Booking] ${booking.customer_name} — ${booking.service_label} on ${booking.booking_date}`,
    html,
    text,
  })
}
