import type Stripe from 'stripe'

/**
 * Keeps a member's profile in step with their Stripe membership subscription.
 *
 * Handles both Stripe object shapes: since API version 2025-03-31 the billing
 * period lives on each subscription item instead of the subscription, and an
 * invoice names its subscription under parent.subscription_details instead of
 * invoice.subscription. Webhook payloads use the endpoint's API version while
 * SDK calls use the version the SDK pins, so either shape can arrive.
 */

// Stripe subscription status -> profiles.membership_status (limited by a CHECK constraint).
const MEMBERSHIP_STATUS: Record<string, string> = {
  active: 'active',
  trialing: 'active',
  past_due: 'past_due',
  unpaid: 'past_due',
  canceled: 'canceled',
  paused: 'canceled',
  incomplete: 'none',
  incomplete_expired: 'none',
}

export const membershipStatusFor = (status: string) => MEMBERSHIP_STATUS[status] ?? 'none'

const stripeId = (value: any): string | null => (typeof value === 'string' ? value : value?.id || null)
const isoFromUnix = (value: any) => (typeof value === 'number' ? new Date(value * 1000).toISOString() : null)

/** When the subscription's current billing period ends (its next renewal), or null. */
export function subscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const itemEnds = (subscription.items?.data || [])
    .map(item => (item as any).current_period_end)
    .filter((end): end is number => typeof end === 'number')
  return isoFromUnix(itemEnds.length ? Math.max(...itemEnds) : (subscription as any).current_period_end)
}

/** The subscription an invoice bills, or null for one-off invoices. */
export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  return stripeId((invoice as any).parent?.subscription_details?.subscription ?? (invoice as any).subscription)
}

/** True for subscriptions our membership checkout created (they carry membership_type metadata). */
export const isMembershipSubscription = (subscription: Stripe.Subscription) =>
  ['individual', 'family'].includes(subscription.metadata?.membership_type || '')

/**
 * Writes a membership subscription's status and renewal date to its member's profile.
 *
 * The profile is found by the user id in the subscription metadata, else by
 * Stripe customer id. A subscription without membership metadata is still
 * treated as the membership when the profile already tracks it (memberships
 * bought before the metadata existed). With `onlyIfCurrent`, a profile that
 * tracks a different subscription is left alone, so events about an old
 * subscription cannot cancel a newer one.
 */
export async function syncMembershipProfile(
  supabase: any,
  subscription: Stripe.Subscription,
  options: { status?: string; onlyIfCurrent?: boolean; extra?: Record<string, any> } = {},
) {
  const customerId = stripeId(subscription.customer)
  const userId = subscription.metadata?.supabase_user_id
  if (!userId && !customerId) return { updated: 0 }

  const query = supabase.from('profiles').select('id, stripe_subscription_id')
  const { data: profiles, error } = await (userId ? query.eq('id', userId) : query.eq('stripe_customer_id', customerId))
  if (error) throw error

  const status = options.status ?? membershipStatusFor(subscription.status)
  const periodEnd = subscriptionPeriodEnd(subscription)
  let updated = 0
  for (const profile of profiles || []) {
    const tracked = profile.stripe_subscription_id
    if (!isMembershipSubscription(subscription) && tracked !== subscription.id) continue
    if (options.onlyIfCurrent && tracked && tracked !== subscription.id) continue

    const fields: Record<string, any> = {
      membership_status: status,
      stripe_subscription_id: status === 'canceled' ? null : subscription.id,
      ...options.extra,
    }
    if (periodEnd) fields.membership_expires = periodEnd
    if (subscription.metadata?.membership_type) fields.membership_type = subscription.metadata.membership_type
    if (customerId) fields.stripe_customer_id = customerId

    const { error: updateError } = await supabase.from('profiles').update(fields).eq('id', profile.id)
    if (updateError) throw updateError
    updated++
  }
  return { updated }
}
