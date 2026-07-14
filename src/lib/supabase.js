import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const hasValidSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'))

export const supabase = hasValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const hasSupabaseConfig = () => hasValidSupabaseConfig

export default supabase
