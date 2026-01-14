import { createClient } from '../utils/supabase/client';

export interface SystemStats {
    reportsResolved: number;
    activeVolunteers: number;
    incidentsActive: number;
}

/**
 * Fetch global system stats
 * Uses efficient COUNT queries
 */
export async function getSystemStats(): Promise<{ data: SystemStats | null; error: Error | null }> {
    const supabase = createClient();

    try {
        // 1. Count Resolved Incidents
        const { count: resolvedCount, error: reportsError } = await supabase
            .from('incidents')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'resolved');

        if (reportsError) throw reportsError;

        // 2. Count Active Citizens (Volunteers)
        const { count: citizensCount, error: citizensError } = await supabase
            .from('citizens')
            .select('*', { count: 'exact', head: true });

        if (citizensError) throw citizensError;

        // 3. Count Active Incidents (Open + Dispatched + On Scene)
        const { count: activeCount, error: activeError } = await supabase
            .from('incidents')
            .select('*', { count: 'exact', head: true })
            .in('status', ['open', 'dispatched', 'on_scene']);

        if (activeError) throw activeError;

        return {
            data: {
                reportsResolved: resolvedCount || 0,
                activeVolunteers: citizensCount || 0,
                incidentsActive: activeCount || 0
            },
            error: null
        };

    } catch (error) {
        console.error('Error fetching system stats:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Fetch impact trends for charts
 * Fetches recent incidents to calculate trends client-side
 */
export async function getImpactTrends() {
    const supabase = createClient();
    try {
        // Fetch last 100 incidents for charting to keep it lightweight
        const { data, error } = await supabase
            .from('incidents')
            .select('created_at, status, category')
            .order('created_at', { ascending: false })
            .limit(100);

        return { data, error };
    } catch (err) {
        return { data: null, error: err as Error };
    }
}
