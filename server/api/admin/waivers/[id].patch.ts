import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/auth'
import { recordAdminAction } from '../../../utils/adminAudit'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const targetId = getRouterParam(event, 'id')  // profile ID
  const supabase = serverSupabaseServiceRole(event)

  if (!targetId) throw createError({ statusCode: 400, statusMessage: 'User ID required.' })

  const body = await readBody(event).catch(() => ({}))
  const { data: profile } = await (supabase as any).from('profiles').select('full_name,email').eq('id', targetId).maybeSingle()
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Account not found.' })
  const { data: document } = await (supabase as any).from('waiver_documents').select('*')
    .eq('slug', 'facility-liability-release').eq('active', true).order('version', { ascending: false }).limit(1).single()
  if (!document) throw createError({ statusCode: 503, statusMessage: 'The active waiver version is unavailable.' })
  const signedAt = new Date().toISOString()
  const { error: signatureError } = await (supabase as any).from('waiver_signatures').insert({
    document_id: document.id,
    user_id: targetId,
    participant_name: profile.full_name || profile.email,
    signer_name: String(body.signer_name || profile.full_name || profile.email),
    liability_accepted: true,
    photo_consent: body.photo_consent === true,
    provider: 'admin',
    document_snapshot: {
      slug: document.slug, version: document.version, title: document.title,
      content: document.content, content_hash: document.content_hash, paper_record: true,
    },
    signed_at: signedAt,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  })
  if (signatureError) throw createError({ statusCode: 500, statusMessage: 'Failed to record waiver evidence.' })

  const { data, error } = await (supabase as any)
    .from('profiles')
    .update({
      waiver_signed: true,
      waiver_signed_at: signedAt,
      waiver_override_by: admin.id,
    })
    .eq('id', targetId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to update waiver status.' })

  await recordAdminAction(supabase, admin.id, 'waiver.recorded', 'user', targetId)

  return data
})
