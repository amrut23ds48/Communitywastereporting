import { createClient } from '../utils/supabase/client';

export interface SystemStats {
    reportsResolved: number;
    activeVolunteers: number;
    wasteCollected: number; // Placeholder as we don't track weight yet
}

/**
 * Fetch global system stats
 * Uses efficient COUNT queries
 */
export async function getSystemStats(): Promise<{ data: SystemStats | null; error: Error | null }> {
    const supabase = createClient();

    try {
        // 1. Count Resolved Reports
        const { count: resolvedCount, error: reportsError } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'resolved');

        if (reportsError) throw reportsError;

        // 2. Count Active Citizens (Volunteers)
        const { count: citizensCount, error: citizensError } = await supabase
            .from('citizens')
            .select('*', { count: 'exact', head: true });

        if (citizensError) throw citizensError;

        return {
            data: {
                reportsResolved: resolvedCount || 0,
                activeVolunteers: citizensCount || 0,
                wasteCollected: (resolvedCount || 0) * 15 // Estimate: 15kg per report
            },
            error: null
        };

    } catch (error) {
        console.error('Error fetching system stats:', error);
        return { data: null, error: error as Error };
    }
}
