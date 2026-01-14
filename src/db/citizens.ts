import { createClient } from '../utils/supabase/client';
import type { Database } from '../utils/supabase/client';

type Citizen = Database['public']['Tables']['citizens']['Row'];
type CitizenUpdate = Database['public']['Tables']['citizens']['Update'];
type CitizenActivity = Database['public']['Tables']['citizen_activity']['Row'];
type LeaderboardEntry = Database['public']['Views']['citizen_leaderboard']['Row'];
type CitizenStats = Database['public']['Views']['citizen_stats']['Row'];

/**
 * Get citizen profile by user ID
 */
export async function getCitizenProfile(
  userId: string
): Promise<{ data: Citizen | null; error: Error | null }> {
  console.log('👤 [db/citizens] getCitizenProfile: Fetching profile for user:', userId);
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('citizens')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [db/citizens] getCitizenProfile: Error:', error);
      throw error;
    }

    console.log('✅ [db/citizens] getCitizenProfile: Success', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ [db/citizens] getCitizenProfile: Exception:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get citizen stats (includes calculated fields like rank, points to next level)
 */
export async function getCitizenStats(
  userId: string
): Promise<{ data: CitizenStats | null; error: Error | null }> {
  console.log('📊 [db/citizens] getCitizenStats: Fetching stats for user:', userId);
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('citizen_stats')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [db/citizens] getCitizenStats: Error:', error);
      throw error;
    }

    console.log('✅ [db/citizens] getCitizenStats: Success', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ [db/citizens] getCitizenStats: Exception:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update citizen profile (name, avatar, neighborhood, city)
 */
export async function updateCitizenProfile(
  userId: string,
  updates: CitizenUpdate
): Promise<{ data: Citizen | null; error: Error | null }> {
  console.log('✏️ [db/citizens] updateCitizenProfile: Updating profile for user:', userId, updates);
  const supabase = createClient();

  try {
    const query = supabase.from('citizens') as any;
    const { data, error } = await query
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [db/citizens] updateCitizenProfile: Error:', error);
      throw error;
    }

    console.log('✅ [db/citizens] updateCitizenProfile: Success', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ [db/citizens] updateCitizenProfile: Exception:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get leaderboard with optional filters
 */
export async function getCitizenLeaderboard(options?: {
  city?: string;
  neighborhood?: string;
  limit?: number;
}): Promise<{ data: LeaderboardEntry[] | null; error: Error | null }> {
  console.log('🏆 [db/citizens] getCitizenLeaderboard: Fetching leaderboard', options);
  const supabase = createClient();

  try {
    let query = supabase
      .from('citizen_leaderboard')
      .select('*')
      .order('global_rank', { ascending: true });

    if (options?.city) {
      query = query.eq('city', options.city);
    }

    if (options?.neighborhood) {
      query = query.eq('neighborhood', options.neighborhood);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [db/citizens] getCitizenLeaderboard: Error:', error);
      throw error;
    }

    console.log(`✅ [db/citizens] getCitizenLeaderboard: Success, ${data?.length || 0} entries`);
    return { data, error: null };
  } catch (error) {
    console.error('❌ [db/citizens] getCitizenLeaderboard: Exception:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get citizen's activity feed
 */
export async function getCitizenActivity(
  userId: string,
  limit: number = 20
): Promise<{ data: CitizenActivity[] | null; error: Error | null }> {
  console.log('📜 [db/citizens] getCitizenActivity: Fetching activity for user:', userId);
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('citizen_activity')
      .select('*')
      .eq('citizen_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [db/citizens] getCitizenActivity: Error:', error);
      throw error;
    }

    console.log(`✅ [db/citizens] getCitizenActivity: Success, ${data?.length || 0} activities`);
    return { data, error: null };
  } catch (error) {
    console.error('❌ [db/citizens] getCitizenActivity: Exception:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get citizen's reports with optional filters
 */
export async function getCitizenReports(
  userId: string,
  filters?: {
    status?: 'open' | 'in_progress' | 'resolved' | 'false_report' | 'all';
    limit?: number;
  }
): Promise<{ data: Database['public']['Tables']['incidents']['Row'][] | null; error: Error | null }> {
  console.log('📋 [db/citizens] getCitizenReports: Fetching reports for user:', userId, filters);
  const supabase = createClient();

  try {
    let query = (supabase.from('incidents') as any)
      .select('*')
      .eq('citizen_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [db/citizens] getCitizenReports: Error:', error);
      throw error;
    }

    console.log(`✅ [db/citizens] getCitizenReports: Success, ${data?.length || 0} reports`);
    return { data, error: null };
  } catch (error) {
    console.error('❌ [db/citizens] getCitizenReports: Exception:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get citizen's recent reports (for dashboard overview)
 */
export async function getCitizenRecentReports(
  userId: string,
  limit: number = 3
): Promise<{ data: Database['public']['Tables']['incidents']['Row'][] | null; error: Error | null }> {
  return getCitizenReports(userId, { limit, status: 'all' });
}

/**
 * Subscribe to citizen profile changes (real-time)
 */
export function subscribeToCitizenProfile(
  userId: string,
  callback: (citizen: Citizen) => void
) {
  const supabase = createClient();
  console.log('📡 [db/citizens] subscribeToCitizenProfile: Subscribing to changes...');

  const subscription = supabase
    .channel('citizen-profile-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'citizens',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        console.log('🔔 [db/citizens] Profile Update Received:', payload);
        const citizen = payload.new as Citizen;
        if (citizen) callback(citizen);
      }
    )
    .subscribe();

  return () => {
    console.log('🔕 [db/citizens] subscribeToCitizenProfile: Unsubscribing');
    subscription.unsubscribe();
  };
}

