import nodemailer from 'nodemailer'

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
    port: config.smtpPort as number,
    secure: config.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  })

  const htmlContent = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    <p><strong>Interested In:</strong> ${interest || 'Not specified'}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `

  try {
    await transporter.sendMail({
      from: `"The Training Yard Website" <${config.smtpUser}>`, // Must match authenticated user
      to: 'info@trainingyarddsm.com',
      cc: 'Adam@heartlandroofingandsiding.com',
      replyTo: email,
      subject: `New Inquiry from ${name} - ${interest || 'Website Contact'}`,
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
