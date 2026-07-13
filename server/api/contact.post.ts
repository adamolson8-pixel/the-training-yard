import nodemailer from 'nodemailer'
import { escapeHtml, escapeHtmlWithBreaks } from '../utils/sanitize'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  const { name, email, phone, interest, message } = body

  if (!name || !email || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    })
  }

  // Configure transporter using Zoho SMTP
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: Number(config.smtpPort),
    secure: Number(config.smtpPort) === 465, // true for 465, false for other ports
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  })

  // Sanitize ALL user inputs before embedding in HTML
  const htmlContent = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone) || 'Not provided'}</p>
    <p><strong>Interested In:</strong> ${escapeHtml(interest) || 'Not specified'}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtmlWithBreaks(message)}</p>
  `

  try {
    await transporter.sendMail({
      from: `"The Training Yard Website" <${config.smtpUser}>`, // Must match authenticated user
      to: 'info@trainingyarddsm.com',
      replyTo: email,
      subject: `New Inquiry from ${escapeHtml(name)} - ${escapeHtml(interest) || 'Website Contact'}`,
      html: htmlContent,
    })

    return { success: true, message: 'Message sent successfully' }
  } catch (error) {
    console.error('SMTP Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send email. Please try again later.',
    })
  }
})
