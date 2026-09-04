import { createClient } from '@supabase/supabase-js';

/**
 * Server-only administrative Supabase client using the service role key.
 * DO NOT expose to client components, public API responses, or NEXT_PUBLIC env vars.
 */
export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (typeof window !== 'undefined') {
    throw new Error('FATAL SECURITY ERROR: Supabase admin client cannot be invoked in the browser runtime.');
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
