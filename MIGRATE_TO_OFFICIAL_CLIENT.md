# Migrate to Official Supabase Client (Fix CORS)

## Problem
The custom Supabase client is causing CORS errors. The official `@supabase/supabase-js` client is already installed and handles CORS automatically.

## Solution: Replace Custom Client with Official Client

### Step 1: Update `src/utils/supabase/client.ts`

Replace the entire file content with this:

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Database type definitions (keep this!)
export type Database = {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string;
          image_url: string;
          latitude: number;
          longitude: number;
          street_name: string;
          city: string;
          waste_type: string;
          urgency: 'low' | 'medium' | 'high';
          description: string;
          status: 'open' | 'in_progress' | 'resolved' | 'false_report';
          citizen_id: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          image_url: string;
          latitude: number;
          longitude: number;
          street_name: string;
          city: string;
          waste_type?: string;
          urgency?: 'low' | 'medium' | 'high';
          description: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'false_report';
          citizen_id?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          image_url?: string;
          latitude?: number;
          longitude?: number;
          street_name?: string;
          city?: string;
          waste_type?: string;
          urgency?: 'low' | 'medium' | 'high';
          description?: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'false_report';
          citizen_id?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
      };
      admin_actions: {
        Row: {
          id: string;
          admin_id: string;
          report_id: string;
          previous_status: string;
          new_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          report_id: string;
          previous_status: string;
          new_status: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          report_id: string;
          citizen_id: string | null;
          message: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          citizen_id?: string | null;
          message: string;
          type: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      citizens: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          total_points: number;
          current_level: number;
          rank_title: string;
          total_reports: number;
          resolved_reports: number;
          neighborhood: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          total_points?: number;
          current_level?: number;
          rank_title?: string;
          total_reports?: number;
          resolved_reports?: number;
          neighborhood?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          total_points?: number;
          current_level?: number;
          rank_title?: string;
          total_reports?: number;
          resolved_reports?: number;
          neighborhood?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      citizen_activity: {
        Row: {
          id: string;
          citizen_id: string;
          report_id: string | null;
          activity_type: string;
          points_awarded: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          citizen_id: string;
          report_id?: string | null;
          activity_type: string;
          points_awarded?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          citizen_id?: string;
          report_id?: string | null;
          activity_type?: string;
          points_awarded?: number;
          description?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      citizen_leaderboard: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          total_points: number;
          current_level: number;
          rank_title: string;
          total_reports: number;
          resolved_reports: number;
          city: string | null;
          neighborhood: string | null;
          global_rank: number;
          city_rank: number | null;
          neighborhood_rank: number | null;
        };
      };
      citizen_stats: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          total_points: number;
          current_level: number;
          rank_title: string;
          total_reports: number;
          resolved_reports: number;
          neighborhood: string | null;
          city: string | null;
          points_to_next_level: number | null;
          current_level_points: number;
          global_rank: number;
          city_rank: number | null;
          neighborhood_rank: number | null;
        };
      };
    };
  };
};

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
```

### Step 2: Test

1. Restart your dev server
2. Try signing up again
3. CORS error should be resolved!

### What Changed?

- ✅ Replaced custom client with official `@supabase/supabase-js`
- ✅ Kept all Database types (no breaking changes)
- ✅ Automatic CORS handling
- ✅ Better error messages
- ✅ Session persistence
- ✅ Auto token refresh

### Benefits

- **No more CORS errors** - handled automatically
- **Better performance** - optimized official client
- **Full feature support** - all Supabase features work
- **Type safety** - TypeScript types preserved
- **Future-proof** - official client is maintained

### Note

All your existing code using `createClient()` will work exactly the same - no other changes needed!

