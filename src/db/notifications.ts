import { createClient } from '../utils/supabase/client';
import type { Database } from '../utils/supabase/client';

type Notification = Database['public']['Tables']['notifications']['Row'];

/**
 * Subscribe to new notifications
 */
export function subscribeToNotifications(
  callback: (notification: Notification) => void
) {
  const supabase = createClient();
  
  const subscription = supabase
    .channel('notifications-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Get recent notifications
 */
export async function getRecentNotifications(limit: number = 10): Promise<{ 
  data: Notification[] | null; 
  error: Error | null 
}> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Subscribe to new reports for real-time updates
 */
export function subscribeToNewReports(
  callback: (payload: any) => void
) {
  const supabase = createClient();
  
  const subscription = supabase
    .channel('reports-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reports',
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}