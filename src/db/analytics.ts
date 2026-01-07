import { createClient } from '../utils/supabase/client';
import type { Database } from '../utils/supabase/client';
import { getDistrictsForZone, getZoneForCity } from '../utils/cityZones';

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

export interface WasteCompositionSlice {
  name: string;
  value: number;
}

export interface StatusDistributionSlice {
  name: string;
  value: number;
}

/**
 * Get analytics overview for dashboard cards
 */
// Rewritten filter helper for in-memory consistency
const matchesFilters = (report: any, filters?: { zone?: string; district?: string }) => {
  if (!filters) return true;

  // Zone Check
  if (filters.zone && filters.zone !== 'all') {
    if (getZoneForCity(report.city) !== filters.zone) return false;
  }

  // District Check
  if (filters.district && filters.district !== 'all') {
    if (!report.city?.toLowerCase().includes(filters.district.toLowerCase())) return false;
  }

  return true;
};

export async function getAnalyticsOverview(filters?: { zone?: string; district?: string }): Promise<{ data: AnalyticsOverview | null; error: Error | null }> {
  const supabase = createClient();

  try {
    // 1. Fetch raw data (Optimization: fetch all active/recent if generic, but for now fetch required fields)
    // We fetch everything relevant (status, created_at, city) and filter in memory to ensure logic match.
    const { data: allReports, error } = await supabase
      .from('reports')
      .select('status, created_at, city');

    if (error) throw error;
    if (!allReports) return { data: null, error: null };

    // 2. Filter in Memory
    const filteredReports = allReports.filter((r: any) => matchesFilters(r, filters));

    // 3. Process Dates
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const thisMonthReports = filteredReports.filter((r: any) => new Date(r.created_at) >= startOfMonth);
    const lastMonthReports = filteredReports.filter((r: any) => {
      const d = new Date(r.created_at);
      return d >= startOfLastMonth && d < startOfMonth;
    });

    // 4. Calculate Stats
    const thisMonthTotal = thisMonthReports.length;
    const lastMonthTotal = lastMonthReports.length;
    const thisMonthChange = lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    const overview: AnalyticsOverview = {
      totalReports: filteredReports.length,
      openReports: filteredReports.filter((r: any) => r.status === 'open').length,
      inProgressReports: filteredReports.filter((r: any) => r.status === 'in_progress').length,
      resolvedReports: filteredReports.filter((r: any) => r.status === 'resolved').length,
      falseReports: filteredReports.filter((r: any) => r.status === 'false_report').length,
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
  streetName?: string,
  filters?: { zone?: string; district?: string }
): Promise<{ data: StreetStatistics[] | null; error: Error | null }> {
  const supabase = createClient();

  try {
    // Fetch all for consistent filtering
    let query = supabase
      .from('reports')
      .select('street_name, city, status, created_at');

    const { data: allReports, error } = await query;
    if (error) throw error;
    if (!allReports) return { data: null, error: null };

    // Apply strict filters in JS
    const reports = allReports.filter((r: any) => {
      if (streetName && r.street_name !== streetName) return false;
      return matchesFilters(r, filters);
    });

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

    reports.forEach((report: any) => {
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
  months: number = 6,
  filters?: { zone?: string; district?: string }
): Promise<{ data: MonthlyInsight[] | null; error: Error | null }> {
  const supabase = createClient();

  try {
    // Calculate start date
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Fetch defaults
    const query = supabase
      .from('reports')
      .select('status, created_at, city')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    const { data: allReports, error } = await query;
    if (error) throw error;
    if (!allReports) return { data: null, error: null };

    const reports = allReports.filter((r: any) => matchesFilters(r, filters));

    // Group by month
    const monthMap = new Map<string, {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      falseReports: number;
    }>();

    reports.forEach((report: any) => {
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
 * Get overall waste composition (by waste_type) and status distribution
 */
export async function getCompositionAndStatus(
  startDate?: Date,
  filters?: { zone?: string; district?: string }
): Promise<{
  composition: WasteCompositionSlice[] | null;
  status: StatusDistributionSlice[] | null;
  error: Error | null;
}> {
  const supabase = createClient();

  try {
    // Fetch defaults
    const query = supabase
      .from('reports')
      .select('waste_type, status, city, created_at'); // added city and created_at for filtering

    const { data: allReports, error } = await query;

    if (error) throw error;
    if (!allReports) return { composition: null, status: null, error: null };

    // Filter in memory
    const reports = allReports.filter((r: any) => {
      if (startDate && new Date(r.created_at) < startDate) return false;
      return matchesFilters(r, filters);
    });

    const compositionMap = new Map<string, number>();
    const statusMap = new Map<string, number>();

    reports.forEach((r: any) => {
      const wt = (r.waste_type || 'general').toLowerCase();
      compositionMap.set(wt, (compositionMap.get(wt) || 0) + 1);

      const st = r.status || 'open';
      statusMap.set(st, (statusMap.get(st) || 0) + 1);
    });

    const composition = Array.from(compositionMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    const status = Array.from(statusMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    return { composition, status, error: null };
  } catch (error) {
    console.error('Error fetching composition/status:', error);
    return { composition: null, status: null, error: error as Error };
  }
}

/**
 * Get heatmap data (reports grouped by location)
 */
export async function getHeatmapData(filters?: { zone?: string; district?: string }): Promise<{
  data: Array<{ lat: number; lng: number; intensity: number }> | null;
  error: Error | null
}> {
  const supabase = createClient();

  try {
    // Fetch defaults
    const query = supabase
      .from('reports')
      .select('latitude, longitude, status, city')
      .in('status', ['open', 'in_progress']);

    const { data: allReports, error } = await query;

    if (error) throw error;
    if (!allReports) return { data: null, error: null };

    const reports = allReports.filter((r: any) => matchesFilters(r, filters));

    // Group nearby reports (simple grid-based clustering)
    const gridSize = 0.01; // ~1km
    const heatmap = new Map<string, { lat: number; lng: number; count: number }>();

    reports.forEach((report: any) => {
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

export interface WeeklyStat {
  week: string;
  open: number;
  inProgress: number;
  resolved: number;
}

/**
 * Get weekly statistics for the current month
 */
export async function getCurrentMonthWeeklyStats(filters?: { zone?: string; district?: string }): Promise<{ data: WeeklyStat[] | null; error: Error | null }> {
  const supabase = createClient();

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Fetch defaults
    const query = supabase
      .from('reports')
      .select('status, created_at, city')
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: true });

    const { data: allReports, error } = await query;

    if (error) throw error;
    if (!allReports) return { data: [], error: null };

    const reports = allReports.filter((r: any) => matchesFilters(r, filters));

    // Initialize weeks (assuming max 5 weeks)
    const weeklyData: WeeklyStat[] = Array(5).fill(0).map((_, i) => ({
      week: `Week ${i + 1}`,
      open: 0,
      inProgress: 0,
      resolved: 0,
    }));

    reports.forEach((report: any) => {
      const date = new Date(report.created_at);
      const dayOfMonth = date.getDate();
      // Simple week calculation: (day - 1) / 7
      const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 4);

      if (report.status === 'open') weeklyData[weekIndex].open++;
      if (report.status === 'in_progress') weeklyData[weekIndex].inProgress++;
      if (report.status === 'resolved') weeklyData[weekIndex].resolved++;
    });

    return { data: weeklyData, error: null };
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    return { data: null, error: error as Error };
  }
}
