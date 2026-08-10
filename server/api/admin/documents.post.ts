import { randomUUID } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'
import { recordAdminAction } from '../../utils/adminAudit'
import { facilityWindow } from '../../utils/booking'

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode: 400, statusMessage: 'Form data is required.' })
  const fields: Record<string, string> = {}
  let upload: { filename?: string; type?: string; data: Buffer } | undefined
  for (const part of parts) {
    if (part.filename) upload = part as any
    else if (part.name) fields[part.name] = part.data.toString('utf8')
  }
  const documentType = fields.document_type
  const entityType = fields.entity_type
  if (!['waiver', 'contract', 'other'].includes(documentType) || !['user', 'team', 'participant'].includes(entityType)) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a valid document and subject type.' })
  }
  if (documentType === 'waiver' && entityType === 'team') {
    throw createError({ statusCode: 400, statusMessage: 'Waivers must be assigned to an account or individual participant.' })
  }
  const entityId = fields.entity_id
  if (!entityId) throw createError({ statusCode: 400, statusMessage: 'Choose an account, team, or participant.' })
  const signerName = String(fields.signer_name || '').trim()
  if (documentType === 'waiver' && signerName.length < 2) throw createError({ statusCode: 400, statusMessage: 'Signer name is required for a waiver.' })
  if (upload && (!ALLOWED_TYPES.has(upload.type || '') || upload.data.length > 10 * 1024 * 1024)) {
    throw createError({ statusCode: 400, statusMessage: 'Attach a PDF, JPG, or PNG no larger than 10 MB.' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const documentId = randomUUID()
  const safeName = String(upload?.filename || 'document').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-120)
  const storagePath = upload ? `${entityType}/${entityId}/${documentId}-${safeName}` : null
  const entityFields: Record<string, string | null> = { user_id: null, team_id: null, participant_id: null }
  entityFields[`${entityType}_id`] = entityId
  let participant: any = null
  let profile: any = null
  if (entityType === 'participant') {
    const result = await (supabase as any).from('team_participants').select('*').eq('id', entityId).maybeSingle()
    participant = result.data
    if (!participant) throw createError({ statusCode: 404, statusMessage: 'Participant not found.' })
    entityFields.team_id = participant.team_id
  } else if (entityType === 'user') {
    const result = await (supabase as any).from('profiles').select('*').eq('id', entityId).maybeSingle()
    profile = result.data
    if (!profile) throw createError({ statusCode: 404, statusMessage: 'Account not found.' })
  }
  let activeWaiverDocument: any = null
  if (documentType === 'waiver') {
    const result = await (supabase as any).from('waiver_documents').select('*')
      .eq('slug', 'facility-liability-release').eq('active', true).order('version', { ascending: false }).limit(1).single()
    activeWaiverDocument = result.data
    if (!activeWaiverDocument) throw createError({ statusCode: 503, statusMessage: 'The active waiver version is unavailable.' })
  }

  const signedAt = fields.signed_at ? facilityWindow(fields.signed_at, '12:00', 1).startAt : new Date()
  const expiresAt = fields.expires_at ? facilityWindow(fields.expires_at, '23:59', 1).startAt : documentType === 'waiver' ? new Date(signedAt.getTime() + 365 * 24 * 60 * 60 * 1000) : null
  if (!Number.isFinite(signedAt.getTime()) || (expiresAt && !Number.isFinite(expiresAt.getTime()))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid signed or expiration date.' })
  }
  if (upload && storagePath) {
    const { error } = await supabase.storage.from('compliance-documents').upload(storagePath, upload.data, {
      contentType: upload.type, upsert: false,
    })
    if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to securely store the document.' })
  }
  const { data: compliance, error: complianceError } = await (supabase as any).from('compliance_documents').insert({
    id: documentId,
    document_type: documentType,
    entity_type: entityType,
    ...entityFields,
    title: String(fields.title || (documentType === 'waiver' ? 'Paper Liability Waiver' : 'Signed Contract')).trim(),
    status: fields.status || 'signed',
    storage_path: storagePath,
    original_filename: upload?.filename || null,
    mime_type: upload?.type || null,
    signer_name: signerName || null,
    signed_at: signedAt.toISOString(),
    expires_at: expiresAt?.toISOString() || null,
    notes: String(fields.notes || '').trim() || null,
    uploaded_by: admin.id,
  }).select('*').single()
  if (complianceError) {
    if (storagePath) await supabase.storage.from('compliance-documents').remove([storagePath])
    throw createError({ statusCode: 500, statusMessage: 'Unable to save the compliance record.' })
  }

  if (documentType === 'waiver') {
    const { data: signature, error: signatureError } = await (supabase as any).from('waiver_signatures').insert({
      document_id: activeWaiverDocument.id,
      user_id: entityType === 'user' ? entityId : null,
      team_id: participant?.team_id || null,
      participant_id: entityType === 'participant' ? entityId : null,
      participant_name: participant?.full_name || profile?.full_name || signerName,
      participant_date_of_birth: participant?.date_of_birth || null,
      signer_name: signerName,
      guardian_relationship: fields.guardian_relationship || participant?.guardian_relationship || null,
      liability_accepted: true,
      photo_consent: fields.photo_consent === 'true',
      provider: 'admin',
      provider_envelope_id: documentId,
      document_snapshot: {
        slug: activeWaiverDocument.slug, version: activeWaiverDocument.version, title: activeWaiverDocument.title,
        content: activeWaiverDocument.content, content_hash: activeWaiverDocument.content_hash,
        paper_record: true,
      },
      signed_at: signedAt.toISOString(),
      expires_at: expiresAt?.toISOString(),
    }).select('id').single()
    if (signatureError || !signature) {
      await (supabase as any).from('compliance_documents').delete().eq('id', documentId)
      if (storagePath) await supabase.storage.from('compliance-documents').remove([storagePath])
      throw createError({ statusCode: 500, statusMessage: 'Unable to record the waiver evidence.' })
    }
    if (entityType === 'user') {
      await (supabase as any).from('profiles').update({ waiver_signed: true, waiver_signed_at: signedAt.toISOString(), waiver_override_by: admin.id }).eq('id', entityId)
    } else {
      await (supabase as any).from('team_participants').update({ waiver_signature_id: signature.id }).eq('id', entityId)
    }
  }

  await recordAdminAction(supabase, admin.id, 'compliance.recorded', 'compliance_document', documentId, {
    document_type: documentType, entity_type: entityType, entity_id: entityId, has_file: Boolean(upload),
  })
  return { success: true, document: compliance }
})
