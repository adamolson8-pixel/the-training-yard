import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const signerName = String(body.signerName || '').trim()
  const participantName = String(body.participantName || signerName).trim()
  if (!body.liabilityAccepted || signerName.length < 2 || participantName.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'A legal name and waiver acceptance are required.' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data: document, error: documentError } = await (supabase as any).from('waiver_documents')
    .select('*').eq('slug', 'facility-liability-release').eq('active', true).order('version', { ascending: false }).limit(1).single()
  if (documentError || !document) throw createError({ statusCode: 503, statusMessage: 'The waiver document is unavailable.' })

  const { data: signature, error } = await (supabase as any).from('waiver_signatures').insert({
    document_id: document.id,
    user_id: user.id,
    participant_name: participantName,
    participant_date_of_birth: body.participantDateOfBirth || null,
    signer_name: signerName,
    guardian_relationship: body.guardianRelationship || null,
    liability_accepted: true,
    photo_consent: body.photoConsent === true,
    ip_address: getRequestIP(event, { xForwardedFor: true }) || null,
    user_agent: getHeader(event, 'user-agent') || null,
    document_snapshot: {
      slug: document.slug, version: document.version, title: document.title,
      content: document.content, content_hash: document.content_hash,
    },
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }).select('id,signed_at').single()
  if (error || !signature) throw createError({ statusCode: 500, statusMessage: 'Unable to record the waiver.' })

  const { error: profileError } = await (supabase as any).from('profiles').update({
    waiver_signed: true,
    waiver_signed_at: signature.signed_at,
  }).eq('id', user.id)
  if (profileError) throw createError({ statusCode: 500, statusMessage: 'The signature was recorded, but the profile could not be updated.' })
  return { success: true, signatureId: signature.id, signedAt: signature.signed_at }
})
