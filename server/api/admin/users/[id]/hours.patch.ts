import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const userId = getRouterParam(event, 'id')
  
  if (!userId) {
    throw createError({ statusCode: 400, message: 'Missing user ID' })
  }

  const body = await readBody(event)
  const { team_standard_hours, team_buyout_hours } = body

  // Ensure they are numbers
  const updates: any = {}
  if (typeof team_standard_hours === 'number') updates.team_standard_hours = team_standard_hours
  if (typeof team_buyout_hours === 'number') updates.team_buyout_hours = team_buyout_hours

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No valid fields to update' })
  }

  const { error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) {
    console.error('Failed to update user hours:', error)
    throw createError({ statusCode: 500, message: 'Failed to update user hours' })
  }

  return { success: true }
})
