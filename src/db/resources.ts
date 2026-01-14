import { createClient, Database } from '../utils/supabase/client';
import { Resource, ResourceStatus, ResourceType } from '../types';

type DBResource = Database['public']['Tables']['resources']['Row'];
type DBResourceInsert = Database['public']['Tables']['resources']['Insert'];

export async function createResource(resource: DBResourceInsert): Promise<{ data: Resource | null; error: Error | null }> {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('resources')
            .insert(resource)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
}

export async function getResources(filters?: {
    status?: ResourceStatus | 'all';
    type?: ResourceType | 'all';
}): Promise<{ data: Resource[] | null; error: Error | null }> {
    const supabase = createClient();
    try {
        let query = supabase.from('resources').select('*');

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }
        if (filters?.type && filters.type !== 'all') {
            query = query.eq('type', filters.type);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
}

export async function updateResourceStatus(id: string, status: ResourceStatus): Promise<{ error: Error | null }> {
    const supabase = createClient();
    const { error } = await supabase
        .from('resources')
        .update({ status })
        .eq('id', id);
    return { error };
}

export function subscribeToResources(callback: (resource: Resource) => void) {
    const supabase = createClient();
    const subscription = supabase
        .channel('resources-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, (payload) => {
            const row = (payload.new || payload.old) as Resource | null;
            if (row) callback(row);
        })
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}
