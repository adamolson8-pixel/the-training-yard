import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

const TEAM_PACKAGES: Record<string, { name: string; priceCents: number; hours: number; type: 'standard' | 'buyout' }> = {
  'standard-single': { name: 'Standard Team – Single Practice (1 hr)', priceCents: 15000, hours: 1, type: 'standard' },
  'standard-6hr': { name: 'Standard Team – 6-Hour Package', priceCents: 85500, hours: 6, type: 'standard' },
  'standard-12hr': { name: 'Standard Team – 12-Hour Package', priceCents: 153000, hours: 12, type: 'standard' },
  'standard-vip': { name: 'Standard Team VIP – 24-Hour Annual', priceCents: 270000, hours: 24, type: 'standard' },
  'buyout-single': { name: 'Full Facility Buyout – Single Practice (1 hr)', priceCents: 22500, hours: 1, type: 'buyout' },
  'buyout-6hr': { name: 'Full Facility Buyout – 6-Hour Package', priceCents: 128250, hours: 6, type: 'buyout' },
  'buyout-12hr': { name: 'Full Facility Buyout – 12-Hour Package', priceCents: 229500, hours: 12, type: 'buyout' },
  'buyout-vip': { name: 'Full Facility VIP – 24-Hour Annual', priceCents: 405000, hours: 24, type: 'buyout' },
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const packageId = String(body.packageId || '')
  const teamName = String(body.teamName || '').trim()
  const pkg = TEAM_PACKAGES[packageId]
  if (!pkg || teamName.length < 2 || teamName.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'Select a valid package and enter a team name.' })
  }

  const supabase = serverSupabaseServiceRole(event)
  let { data: team } = await (supabase as any).from('teams').select('id').eq('created_by', user.id).ilike('name', teamName).limit(1).maybeSingle()
  if (!team) {
    const { data: createdTeam, error: teamError } = await (supabase as any).from('teams').insert({ name: teamName, created_by: user.id }).select('id').single()
    if (teamError || !createdTeam) throw createError({ statusCode: 500, statusMessage: 'Unable to create the team account.' })
    team = createdTeam
    const { error: memberError } = await (supabase as any).from('team_members').insert({
      team_id: team.id, user_id: user.id, email: user.email, full_name: (user as any).user_metadata?.full_name || null, role: 'owner', status: 'active',
    })
    if (memberError) throw createError({ statusCode: 500, statusMessage: 'Unable to create team ownership.' })
  }

  const config = useRuntimeConfig()
  const isTestMode = String(config.stripeTestMode) === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  if (!stripeKey) throw createError({ statusCode: 503, statusMessage: 'Checkout is temporarily unavailable.' })
  const stripe = new Stripe(stripeKey)
  const siteUrl = String(config.public.siteUrl || process.env.URL || 'https://trainingyarddsm.com').replace(/\/$/, '')

  const { data: pendingPackage, error: packageError } = await (supabase as any).from('team_packages').insert({
    team_id: team.id, purchased_by: user.id, package_type: pkg.type, package_name: pkg.name,
    hours_purchased: pkg.hours, hours_remaining: 0, amount_cents: pkg.priceCents, status: 'pending',
  }).select('id').single()
  if (packageError || !pendingPackage) throw createError({ statusCode: 500, statusMessage: 'Unable to prepare the package purchase.' })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', customer_email: user.email,
      line_items: [{ price_data: { currency: 'usd', unit_amount: pkg.priceCents, product_data: { name: pkg.name, description: `${pkg.hours} booking hours for ${teamName}` } }, quantity: 1 }],
      metadata: { type: 'team_package', user_id: user.id, team_id: team.id, team_package_id: pendingPackage.id, package_id: packageId },
      payment_intent_data: { metadata: { type: 'team_package', team_id: team.id, team_package_id: pendingPackage.id } },
      success_url: `${siteUrl}/team-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/teams?checkout=cancelled`,
    })
    await (supabase as any).from('team_packages').update({ stripe_session_id: session.id }).eq('id', pendingPackage.id)
    return { url: session.url }
  } catch (error) {
    await (supabase as any).from('team_packages').update({ status: 'cancelled' }).eq('id', pendingPackage.id)
    console.error('[team checkout] Failed:', error)
    throw createError({ statusCode: 503, statusMessage: 'Checkout could not be started. Please try again.' })
  }
})
