import { createClient } from '../utils/supabase/client';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportStatus = Report['status'];
type AdminAction = Database['public']['Tables']['admin_actions']['Row'];

/**
 * Update report status (Admin only)
 */
export async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  adminId: string
): Promise<{ data: Report | null; error: Error | null }> {
  const supabase = createClient();
  
  try {
    // First, get the current report to track previous status
    const { data: currentReport, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentReport) throw new Error('Report not found');

    const previousStatus = currentReport.status;

    // Update the report status
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the admin action
    const { error: actionError } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        report_id: reportId,
        previous_status: previousStatus,
        new_status: newStatus,
      });

    if (actionError) {
      console.error('Error logging admin action:', actionError);
      // Don't fail the entire operation if logging fails
    }

    return { data: updatedReport, error: null };
  } catch (error) {
    console.error('Error updating report status:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Bulk update multiple reports (Admin only)
 */
export async function bulkUpdateReportStatus(
  reportIds: string[],
  newStatus: ReportStatus,
  adminId: string
): Promise<{ data: Report[] | null; error: Error | null }> {
  const supabase = createClient();
  
  try {
    // Get current reports
    const { data: currentReports, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .in('id', reportIds);

    if (fetchError) throw fetchError;
    if (!currentReports || currentReports.length === 0) {
      throw new Error('No reports found');
    }

    // Update all reports
    const { data: updatedReports, error: updateError } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .in('id', reportIds)
      .select();

    if (updateError) throw updateError;

    // Log admin actions for each report
    const adminActions = currentReports.map(report => ({
      admin_id: adminId,
      report_id: report.id,
      previous_status: report.status,
      new_status: newStatus,
    }));

    const { error: actionsError } = await supabase
      .from('admin_actions')
      .insert(adminActions);

    if (actionsError) {
      console.error('Error logging admin actions:', actionsError);
    }

    return { data: updatedReports, error: null };
  } catch (error) {
    console.error('Error bulk updating reports:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get admin actions (audit log)
 */
export async function getAdminActions(filters?: {
  adminId?: string;
  reportId?: string;
  limit?: number;
}): Promise<{ data: AdminAction[] | null; error: Error | null }> {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.adminId) {
      query = query.eq('admin_id', filters.adminId);
    }

    if (filters?.reportId) {
      query = query.eq('report_id', filters.reportId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching admin actions:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a report (Admin only)
 */
export async function deleteReport(
  reportId: string,
  adminId: string
): Promise<{ success: boolean; error: Error | null }> {
  const supabase = createClient();
  
  try {
    // Get the report to log action
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;

    // Log the deletion action
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        report_id: reportId,
        previous_status: report.status,
        new_status: 'deleted',
      });

    // Delete the report
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) throw deleteError;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting report:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Sign in admin user
 */
export async function signInAdmin(
  email: string,
  password: string
): Promise<{ userId: string | null; error: Error | null }> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    return { userId: data.user.id, error: null };
  } catch (error) {
    console.error('Error signing in admin:', error);
    return { userId: null, error: error as Error };
  }
}

/**
 * Sign out admin user
 */
export async function signOutAdmin(): Promise<{ success: boolean; error: Error | null }> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Get current admin session
 */
export async function getCurrentAdmin(): Promise<{ userId: string | null; email: string | null; error: Error | null }> {
  const supabase = createClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    return {
      userId: session?.user?.id || null,
      email: session?.user?.email || null,
      error: null,
    };
  } catch (error) {
    console.error('Error getting current admin:', error);
    return { userId: null, email: null, error: error as Error };
  }
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthChanges(
  callback: (userId: string | null) => void
) {
  const supabase = createClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user?.id || null);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}
