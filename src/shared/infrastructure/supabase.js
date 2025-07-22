import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create singleton instance to prevent multiple GoTrueClient instances
let supabaseInstance = null

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        debug: false,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()