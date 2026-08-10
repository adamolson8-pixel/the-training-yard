import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const [{ data: documents, error: documentError }, { data: signatures, error: signatureError }] = await Promise.all([
    (supabase as any).from('compliance_documents').select('*').order('created_at', { ascending: false }).limit(1000),
    (supabase as any).from('waiver_signatures').select('*,waiver_documents(title,version,slug)').order('signed_at', { ascending: false }).limit(1000),
  ])
  if (documentError || signatureError) throw createError({ statusCode: 500, statusMessage: 'Unable to load compliance records.' })

  const [{ data: profiles }, { data: teams }, { data: participants }] = await Promise.all([
    (supabase as any).from('profiles').select('id,full_name,email,waiver_signed'),
    (supabase as any).from('teams').select('id,name,organization_name'),
    (supabase as any).from('team_participants').select('id,full_name,team_id,guardian_name,guardian_email,waiver_signature_id').eq('status', 'active'),
  ])
  const profileMap = new Map((profiles || []).map((row: any) => [row.id, row]))
  const teamMap = new Map((teams || []).map((row: any) => [row.id, row]))
  const participantMap = new Map((participants || []).map((row: any) => [row.id, row]))
  const attachmentSignatureIds = new Set((signatures || []).map((row: any) => row.provider_envelope_id).filter(Boolean))
  const now = Date.now()
  const statusFor = (row: any) => row.revoked_at ? 'revoked' : row.expires_at && new Date(row.expires_at).getTime() < now ? 'expired' : row.status || 'signed'
  const subjectFor = (row: any) => row.participant_id
    ? participantMap.get(row.participant_id)
    : row.team_id ? teamMap.get(row.team_id) : profileMap.get(row.user_id)

  setHeader(event, 'Cache-Control', 'no-store')
  const currentSignature = (row: any) => !row.revoked_at && (!row.expires_at || new Date(row.expires_at).getTime() > now)
  const requirements = [
    ...(profiles || []).filter((profile: any) => !(signatures || []).some((signature: any) => signature.user_id === profile.id && currentSignature(signature))).map((profile: any) => ({
      kind: 'account_waiver', entity_type: 'user', entity_id: profile.id, subject: profile.full_name || profile.email, detail: profile.email,
    })),
    ...(participants || []).filter((participant: any) => !(signatures || []).some((signature: any) => signature.participant_id === participant.id && currentSignature(signature))).map((participant: any) => ({
      kind: 'participant_waiver', entity_type: 'participant', entity_id: participant.id, subject: participant.full_name, detail: teamMap.get(participant.team_id)?.name || 'Team participant',
    })),
    ...(teams || []).filter((team: any) => !(documents || []).some((document: any) => document.team_id === team.id && document.document_type === 'contract' && ['signed', 'active'].includes(statusFor(document)))).map((team: any) => ({
      kind: 'team_contract', entity_type: 'team', entity_id: team.id, subject: team.name, detail: 'No current signed contract',
    })),
  ]
  return {
    requirements,
    records: [
      ...(signatures || []).map((row: any) => ({
        ...row, source: 'signature', document_type: 'waiver', title: row.waiver_documents?.title || 'Liability Waiver',
        document_version: row.waiver_documents?.version, status: statusFor(row), subject: subjectFor(row),
      })),
      ...(documents || []).filter((row: any) => row.document_type !== 'waiver' || !attachmentSignatureIds.has(row.id)).map((row: any) => ({
        ...row, source: 'upload', status: statusFor(row), subject: subjectFor(row), has_file: Boolean(row.storage_path),
      })),
    ].sort((a: any, b: any) => new Date(b.signed_at || b.created_at).getTime() - new Date(a.signed_at || a.created_at).getTime()),
  }
})
