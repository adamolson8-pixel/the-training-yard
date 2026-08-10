export async function recordAdminAction(
  supabase: any,
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase.from('admin_audit_log').insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    metadata,
  })
  if (error) console.error('[admin audit] Unable to write audit record:', error)
}
