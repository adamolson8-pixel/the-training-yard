import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/auth'
import { recordAdminAction } from '../../../utils/adminAudit'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const status = String(body.status || '')
  if (!['pending', 'signed', 'active', 'expired', 'revoked'].includes(status)) throw createError({ statusCode: 400, statusMessage: 'Invalid status.' })
  const supabase = serverSupabaseServiceRole(event)
  const { data, error } = await (supabase as any).from('compliance_documents').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to update the document.' })
  if (data.document_type === 'waiver' && data.id) {
    await (supabase as any).from('waiver_signatures').update({ revoked_at: status === 'revoked' ? new Date().toISOString() : null }).eq('provider_envelope_id', data.id)
  }
  await recordAdminAction(supabase, admin.id, `compliance.${status}`, 'compliance_document', id)
  return data
})
