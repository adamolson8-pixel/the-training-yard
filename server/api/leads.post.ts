import { serverSupabaseServiceRole } from '#supabase/server'
import { sendEmail } from '../utils/email'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, resource, source } = body

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required',
    })
  }

  // 1. Send Notification to Admin
  const config = useRuntimeConfig()
  const adminEmail = config.adminEmail || 'info@trainingyarddsm.com'

  const htmlContent = `
    <div style="font-family: sans-serif; color: #333;">
      <h2 style="color: #d97706;">New Resource Download (Lead)</h2>
      <p>A user has just downloaded a free resource from the website.</p>
      <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Email</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Resource</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${resource || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Source</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${source || 'Website'}</td>
        </tr>
      </table>
      <p style="margin-top: 20px; font-size: 0.9em; color: #777;">You can now add this email to your marketing list.</p>
    </div>
  `

  try {
    await sendEmail({
      to: adminEmail,
      subject: `[New Lead] Download: ${resource || 'Resource'}`,
      html: htmlContent,
      text: `New lead from ${email} downloaded ${resource}`,
    })
  } catch (err) {
    console.error('[leads.post] Failed to send email to admin:', err)
  }

  // 2. Attempt to save to Supabase (if 'leads' table is set up)
  try {
    // If the leads table exists, this will insert it. 
    // If not, it will fail gracefully so the user still gets their download.
    const supabase = await serverSupabaseServiceRole(event)
    await supabase.from('leads').insert({
      email,
      resource_downloaded: resource || 'Unknown',
      source: source || 'Website',
      // Supabase automatically sets created_at for new records if configured,
      // but we can pass it just in case.
    })
  } catch (err) {
    console.error('[leads.post] Database insert failed or table does not exist:', err)
  }

  return { success: true, message: 'Lead captured successfully' }
})
