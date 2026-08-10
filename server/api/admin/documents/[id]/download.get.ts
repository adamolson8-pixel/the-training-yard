import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)
  const { data: document } = await (supabase as any).from('compliance_documents').select('storage_path').eq('id', id).maybeSingle()
  if (!document?.storage_path) throw createError({ statusCode: 404, statusMessage: 'No file is attached to this record.' })
  const { data, error } = await supabase.storage.from('compliance-documents').createSignedUrl(document.storage_path, 60)
  if (error || !data?.signedUrl) throw createError({ statusCode: 500, statusMessage: 'Unable to create a secure download.' })
  return { url: data.signedUrl, expiresIn: 60 }
})
