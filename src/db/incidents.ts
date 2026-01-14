import { createClient, type Database } from '../utils/supabase/client';
import { Incident, IncidentStatus, Severity, IncidentCategory } from '../types';

export async function createIncident(incident: Omit<Partial<Incident>, 'id' | 'created_at' | 'updated_at' | 'resolved_at' | 'status' | 'citizen_id'>): Promise<{ data: Incident | null; error: Error | null }> {
    console.log('📝 [db/incidents] createIncident: Initiating with data:', incident);
    const supabase = createClient();

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;

        const { data, error } = await supabase
            .from('incidents')
            .insert({
                ...incident,
                citizen_id: userId,
                status: 'open',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                resolved_at: null,
            } as any)  // Temporary type assertion to fix type error
            .select()
            .single();

        if (error) {
            console.error('❌ [db/incidents] createIncident: Supabase API Error:', error);
            throw error;
        }

        console.log('✅ [db/incidents] createIncident: Success!', data);
        return { data, error: null };
    } catch (error) {
        console.error('❌ [db/incidents] createIncident: Unexpected Exception:', error);
        return { data: null, error: error as Error };
    }
}

export async function getIncidents(filters?: {
    status?: IncidentStatus | IncidentStatus[] | 'all';
    severity?: Severity | 'all';
    category?: IncidentCategory | 'all';
    streetName?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}): Promise<{ data: Incident[] | null; error: Error | null }> {
    const supabase = createClient();

    try {
        let query = supabase
            .from('incidents')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
            if (Array.isArray(filters.status)) {
                query = query.in('status', filters.status);
            } else {
                query = query.eq('status', filters.status);
            }
        }

        if (filters?.severity && filters.severity !== 'all') {
            query = query.eq('severity', filters.severity);
        }

        if (filters?.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }

        if (filters?.streetName) {
            query = query.ilike('street_name', `%${filters.streetName}%`);
        }

        if (filters?.city) {
            query = query.eq('city', filters.city);
        }

        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('❌ [db/incidents] getIncidents: Error:', error);
        return { data: null, error: error as Error };
    }
}

export async function updateIncidentStatus(id: string, status: IncidentStatus, userId: string): Promise<{ error: Error | null }> {
    const supabase = createClient();
    const { error } = await (supabase.from('incidents') as any)
        .update({ status })
        .eq('id', id);
    return { error };
}

export async function uploadIncidentImage(file: File): Promise<{ url: string | null; error: Error | null }> {
    const supabase = createClient();
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `incidents/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('waste-reports') // Keeping bucket name same for now unless user wants migration
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('waste-reports')
            .getPublicUrl(filePath);

        return { url: publicUrl, error: null };
    } catch (error) {
        return { url: null, error: error as Error };
    }
}

export function subscribeToIncidents(callback: (incident: Incident) => void) {
    const supabase = createClient();
    const subscription = supabase
        .channel('incidents-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
            const row = (payload.new || payload.old) as Incident | null;
            if (row) callback(row);
        })
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}
