import { createHash } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const body = method === 'POST' ? await readBody(event) : getQuery(event)
  const token = String(body.token || '')
  if (token.length < 32) throw createError({ statusCode: 400, statusMessage: 'Invalid waiver link.' })
  const supabase = serverSupabaseServiceRole(event)
  const { data: participant } = await (supabase as any).from('team_participants')
    .select('id,team_id,full_name,date_of_birth,guardian_name,guardian_email,waiver_signature_id,waiver_token_expires_at,teams(name)')
    .eq('waiver_token_hash', hashToken(token)).maybeSingle()
  if (!participant || participant.waiver_signature_id || !participant.waiver_token_expires_at || new Date(participant.waiver_token_expires_at) <= new Date()) {
    throw createError({ statusCode: 400, statusMessage: 'This waiver link is invalid, expired, or already completed.' })
  }
  if (method === 'GET') {
    setHeader(event, 'Cache-Control', 'no-store')
    return { participantName: participant.full_name, teamName: participant.teams?.name || '', guardianName: participant.guardian_name || '' }
  }
  const signerName = String(body.signerName || '').trim()
  const relationship = String(body.guardianRelationship || '').trim()
  if (!body.liabilityAccepted || signerName.length < 2 || relationship.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Signer name, relationship, and liability acceptance are required.' })
  }
  const { data: document } = await (supabase as any).from('waiver_documents').select('*')
    .eq('slug', 'facility-liability-release').eq('active', true).order('version', { ascending: false }).limit(1).single()
  if (!document) throw createError({ statusCode: 503, statusMessage: 'The waiver document is unavailable.' })
  const { data: signature, error } = await (supabase as any).from('waiver_signatures').insert({
    document_id: document.id, team_id: participant.team_id, participant_id: participant.id,
    participant_name: participant.full_name, participant_date_of_birth: participant.date_of_birth,
    signer_name: signerName, guardian_relationship: relationship, liability_accepted: true,
    photo_consent: body.photoConsent === true, ip_address: getRequestIP(event, { xForwardedFor: true }) || null,
    user_agent: getHeader(event, 'user-agent') || null,
    document_snapshot: { slug: document.slug, version: document.version, title: document.title, content: document.content, content_hash: document.content_hash },
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }).select('id').single()
  if (error || !signature) throw createError({ statusCode: 500, statusMessage: 'Unable to record the waiver.' })
  await (supabase as any).from('team_participants').update({
    waiver_signature_id: signature.id, guardian_name: signerName, guardian_relationship: relationship,
    waiver_token_hash: null, waiver_token_expires_at: null,
  }).eq('id', participant.id)
  return { success: true }
})
