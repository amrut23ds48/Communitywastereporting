// Official Supabase Client Implementation
// This replaces the custom client to fix CORS issues and provide full Supabase functionality

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';
import type { Database } from './client';

const supabaseUrl = `https://${projectId}.supabase.co`;

/**
 * Create Supabase client using official @supabase/supabase-js
 * This automatically handles CORS and provides all Supabase features
 */
export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, publicAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

