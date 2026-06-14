import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

// Server-only — service-role key bypasses RLS, must never be imported from client components
export function createServerClient() {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  )
}
