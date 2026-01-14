import { createClient } from '../utils/supabase/client';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['incidents']['Row'];
type ReportUpdate = Database['public']['Tables']['incidents']['Update'];
type ReportStatus = Report['status'];
type AdminAction = Database['public']['Tables']['admin_actions']['Row'];
type AdminActionInsert = Database['public']['Tables']['admin_actions']['Insert'];

/**
 * Update report status (Coordinator only)
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
      .from('incidents')
      .select('*')
      .eq('id', reportId)
      .single() as { data: Report | null; error: any };

    if (fetchError) throw fetchError;
    if (!currentReport) throw new Error('Incident not found');

    const previousStatus = currentReport.status;

    // Update the report status
    const updateData = { status: newStatus };
    const { data: updatedReport, error: updateError } = await (supabase.from('incidents') as any)
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the admin action
    // Note: admin_actions table usually references incidents via report_id
    const adminActionData = {
      admin_id: adminId,
      report_id: reportId,
      previous_status: previousStatus,
      new_status: newStatus,
    };
    const { error: actionError } = await (supabase.from('admin_actions') as any)
      .insert(adminActionData);

    if (actionError) {
      console.error('Error logging coordinator action:', actionError);
    }

    return { data: updatedReport, error: null };
  } catch (error) {
    console.error('Error updating incident status:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Bulk update multiple reports (Coordinator only)
 */
export async function bulkUpdateReportStatus(
  reportIds: string[],
  newStatus: ReportStatus,
  adminId: string
): Promise<{ data: Report[] | null; error: Error | null }> {
  const supabase = createClient();

  try {
    const { data: currentReports, error: fetchError } = await (supabase.from('incidents') as any)
      .select('*')
      .in('id', reportIds);

    if (fetchError) throw fetchError;
    if (!currentReports || currentReports.length === 0) {
      throw new Error('No incidents found');
    }

    const updateData = { status: newStatus };
    const { data: updatedReports, error: updateError } = await (supabase.from('incidents') as any)
      .update(updateData)
      .in('id', reportIds)
      .select();

    if (updateError) throw updateError;

    const adminActions = currentReports.map((report: any) => ({
      admin_id: adminId,
      report_id: report.id,
      previous_status: report.status,
      new_status: newStatus,
    }));

    const { error: actionsError } = await (supabase.from('admin_actions') as any)
      .insert(adminActions);

    if (actionsError) {
      console.error('Error logging coordinator actions:', actionsError);
    }

    return { data: updatedReports, error: null };
  } catch (error) {
    console.error('Error bulk updating incidents:', error);
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

    if (filters?.adminId) query = query.eq('admin_id', filters.adminId);
    if (filters?.reportId) query = query.eq('report_id', filters.reportId);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching admin actions:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a report (Coordinator only)
 */
export async function deleteReport(
  reportId: string,
  adminId: string
): Promise<{ success: boolean; error: Error | null }> {
  const supabase = createClient();
  try {
    const { data: report, error: fetchError } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', reportId)
      .single() as { data: Report | null; error: any };

    if (fetchError) throw fetchError;

    const deleteActionData = {
      admin_id: adminId,
      report_id: reportId,
      previous_status: report!.status,
      new_status: 'deleted',
    };
    await supabase
      .from('admin_actions')
      .insert(deleteActionData as any);

    const { error: deleteError } = await supabase
      .from('incidents')
      .delete()
      .eq('id', reportId);

    if (deleteError) throw deleteError;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting incident:', error);
    return { success: false, error: error as Error };
  }
}

export async function signInAdmin(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { userId: null, error };
  return { userId: data.user?.id, error: null };
}

export async function signOutAdmin() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { success: !error, error };
}

export async function getCurrentAdmin() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  return { userId: session?.user?.id || null, email: session?.user?.email || null, error };
}

export function subscribeToAuthChanges(callback: (userId: string | null) => void) {
  const supabase = createClient();
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => callback(session?.user?.id || null));
  return () => subscription.unsubscribe();
}
