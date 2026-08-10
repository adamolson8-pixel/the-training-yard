export default async () => {
  const siteUrl = (process.env.URL || 'https://trainingyarddsm.com').replace(/\/$/, '')
  const cronSecret = process.env.NUXT_CRON_SECRET || process.env.CRON_SECRET
  if (!cronSecret) return new Response('CRON secret is not configured.', { status: 503 })
  const headers = { authorization: `Bearer ${cronSecret}` }
  const [reminders, cleanup] = await Promise.all([
    fetch(`${siteUrl}/api/cron/reminders`, { headers }),
    fetch(`${siteUrl}/api/cron/cleanup`, { headers }),
  ])
  if (!reminders.ok || !cleanup.ok) {
    return new Response(`Reminder status ${reminders.status}; cleanup status ${cleanup.status}`, { status: 502 })
  }
  return new Response('Booking operations completed.', { status: 200 })
}

export const config = { schedule: '0 * * * *' }
