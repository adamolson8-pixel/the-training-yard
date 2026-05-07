import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NUXT_SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('system_settings').select('*')
  console.log('system_settings:', data, error)
  const { data: d2, error: e2 } = await supabase.from('settings').select('*')
  console.log('settings:', d2, e2)
}
run()
