import { createClient } from '../utils/supabase/client';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['reports']['Row'];

export interface AnalyticsOverview {
  totalReports: number;
  openReports: number;
  inProgressReports: number;
  resolvedReports: number;
  falseReports: number;
  thisMonthTotal: number;
  thisMonthChange: number;
}

export interface StreetStatistics {
  streetName: string;
  city: string;
  totalReports: number;
  openReports: number;
  inProgressReports: number;
  resolvedReports: number;
  falseReports: number;
  lastReportDate: string;
}

export interface MonthlyInsight {
  month: string;
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  falseReports: number;
}

/**
 * Get analytics overview for dashboard cards
 */
export async function getAnalyticsOverview(): Promise<{ data: AnalyticsOverview | null; error: Error | null }> {
  const supabase = createClient();
  
  try {
    // Get all reports
    const { data: allReports, error: allError } = await supabase
      .from('reports')
      .select('status, created_at');

    if (allError) throw allError;
    if (!allReports) return { data: null, error: null };

    // Get this month's reports
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: thisMonthReports, error: monthError } = await supabase
      .from('reports')
      .select('id')
      .gte('created_at', startOfMonth.toISOString());

    if (monthError) throw monthError;

    // Get last month's count for comparison
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const { data: lastMonthReports, error: lastMonthError } = await supabase
      .from('reports')
      .select('id')
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString());

    if (lastMonthError) throw lastMonthError;

    // Calculate statistics
    const thisMonthTotal = thisMonthReports?.length || 0;
    const lastMonthTotal = lastMonthReports?.length || 0;
    const thisMonthChange = lastMonthTotal > 0 
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    const overview: AnalyticsOverview = {
      totalReports: allReports.length,
      openReports: allReports.filter(r => r.status === 'open').length,
      inProgressReports: allReports.filter(r => r.status === 'in_progress').length,
      resolvedReports: allReports.filter(r => r.status === 'resolved').length,
      falseReports: allReports.filter(r => r.status === 'false_report').length,
      thisMonthTotal,
      thisMonthChange,
    };

    return { data: overview, error: null };
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get street-level statistics
 */
export async function getStreetStatistics(
  streetName?: string
): Promise<{ data: StreetStatistics[] | null; error: Error | null }> {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('reports')
      .select('street_name, city, status, created_at');

    if (streetName) {
      query = query.eq('street_name', streetName);
    }

    const { data: reports, error } = await query;

    if (error) throw error;
    if (!reports) return { data: null, error: null };

    // Group by street
    const streetMap = new Map<string, {
      city: string;
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      falseReports: number;
      lastDate: string;
    }>();

    reports.forEach(report => {
      const existing = streetMap.get(report.street_name);
      
      if (existing) {
        existing.total++;
        if (report.status === 'open') existing.open++;
        if (report.status === 'in_progress') existing.inProgress++;
        if (report.status === 'resolved') existing.resolved++;
        if (report.status === 'false_report') existing.falseReports++;
        if (new Date(report.created_at) > new Date(existing.lastDate)) {
          existing.lastDate = report.created_at;
        }
      } else {
        streetMap.set(report.street_name, {
          city: report.city,
          total: 1,
          open: report.status === 'open' ? 1 : 0,
          inProgress: report.status === 'in_progress' ? 1 : 0,
          resolved: report.status === 'resolved' ? 1 : 0,
          falseReports: report.status === 'false_report' ? 1 : 0,
          lastDate: report.created_at,
        });
      }
    });

    const data: StreetStatistics[] = Array.from(streetMap.entries()).map(([streetName, stats]) => ({
      streetName,
      city: stats.city,
      totalReports: stats.total,
      openReports: stats.open,
      inProgressReports: stats.inProgress,
      resolvedReports: stats.resolved,
      falseReports: stats.falseReports,
      lastReportDate: stats.lastDate,
    }));

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching street statistics:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get monthly insights for charts
 */
export async function getMonthlyInsights(
  months: number = 6
): Promise<{ data: MonthlyInsight[] | null; error: Error | null }> {
  const supabase = createClient();
  
  try {
    // Calculate start date
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const { data: reports, error } = await supabase
      .from('reports')
      .select('status, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!reports) return { data: null, error: null };

    // Group by month
    const monthMap = new Map<string, {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      falseReports: number;
    }>();

    reports.forEach(report => {
      const date = new Date(report.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthMap.get(monthKey);
      
      if (existing) {
        existing.total++;
        if (report.status === 'open') existing.open++;
        if (report.status === 'in_progress') existing.inProgress++;
        if (report.status === 'resolved') existing.resolved++;
        if (report.status === 'false_report') existing.falseReports++;
      } else {
        monthMap.set(monthKey, {
          total: 1,
          open: report.status === 'open' ? 1 : 0,
          inProgress: report.status === 'in_progress' ? 1 : 0,
          resolved: report.status === 'resolved' ? 1 : 0,
          falseReports: report.status === 'false_report' ? 1 : 0,
        });
      }
    });

    // Fill in missing months with zeros
    const data: MonthlyInsight[] = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < months; i++) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const stats = monthMap.get(monthKey) || {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        falseReports: 0,
      };
      
      data.push({
        month: monthKey,
        total: stats.total,
        open: stats.open,
        inProgress: stats.inProgress,
        resolved: stats.resolved,
        falseReports: stats.falseReports,
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching monthly insights:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get heatmap data (reports grouped by location)
 */
export async function getHeatmapData(): Promise<{ 
  data: Array<{ lat: number; lng: number; intensity: number }> | null; 
  error: Error | null 
}> {
  const supabase = createClient();
  
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('latitude, longitude, status')
      .in('status', ['open', 'in_progress']);

    if (error) throw error;
    if (!reports) return { data: null, error: null };

    // Group nearby reports (simple grid-based clustering)
    const gridSize = 0.01; // ~1km
    const heatmap = new Map<string, { lat: number; lng: number; count: number }>();

    reports.forEach(report => {
      const gridLat = Math.floor(report.latitude / gridSize) * gridSize;
      const gridLng = Math.floor(report.longitude / gridSize) * gridSize;
      const key = `${gridLat}-${gridLng}`;
      
      const existing = heatmap.get(key);
      if (existing) {
        existing.count++;
        existing.lat = (existing.lat * (existing.count - 1) + report.latitude) / existing.count;
        existing.lng = (existing.lng * (existing.count - 1) + report.longitude) / existing.count;
      } else {
        heatmap.set(key, {
          lat: report.latitude,
          lng: report.longitude,
          count: 1,
        });
      }
    });

    const data = Array.from(heatmap.values()).map(point => ({
      lat: point.lat,
      lng: point.lng,
      intensity: point.count,
    }));

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return { data: null, error: error as Error };
  }
}
