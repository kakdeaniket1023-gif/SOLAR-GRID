import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined.'
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton for browser-side components
export const supabase = typeof window !== 'undefined'
  ? createClient()
  : (null as unknown as ReturnType<typeof createBrowserClient>);
