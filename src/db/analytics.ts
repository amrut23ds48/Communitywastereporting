import { createClient } from '../utils/supabase/client';
import type { Database } from '../utils/supabase/client';
import { getDistrictsForZone, getZoneForCity } from '../utils/cityZones';

type Incident = Database['public']['Tables']['incidents']['Row'];

export interface AnalyticsOverview {
  totalIncidents: number;
  openIncidents: number;
  activeIncidents: number; // dispatched + on_scene + open? Or just dispatched/on_scene
  resolvedIncidents: number;
  falseAlarms: number;
  thisMonthTotal: number;
  thisMonthChange: number;
}

export interface StreetStatistics {
  streetName: string;
  city: string;
  totalReports: number;
  openReports: number;
  inProgressReports: number; // Maps to active/dispatched
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

export interface CategoryDistributionSlice {
  name: string;
  value: number;
}

export interface StatusDistributionSlice {
  name: string;
  value: number;
}

/**
 * Filter helper
 */
const matchesFilters = (incident: any, filters?: { zone?: string; district?: string }) => {
  if (!filters) return true;

  // Zone Check
  if (filters.zone && filters.zone !== 'all') {
    if (getZoneForCity(incident.city) !== filters.zone) return false;
  }

  // District Check
  if (filters.district && filters.district !== 'all') {
    if (!incident.city?.toLowerCase().includes(filters.district.toLowerCase())) return false;
  }

  return true;
};

export async function getAnalyticsOverview(filters?: { zone?: string; district?: string }): Promise<{ data: AnalyticsOverview | null; error: Error | null }> {
  const supabase = createClient();

  try {
    const { data: allIncidents, error } = await supabase
      .from('incidents')
      .select('status, created_at, city');

    if (error) throw error;
    if (!allIncidents) return { data: null, error: null };

    const filtered = allIncidents.filter((r: any) => matchesFilters(r, filters));

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const thisMonthIncidents = filtered.filter((r: any) => new Date(r.created_at) >= startOfMonth);
    const lastMonthIncidents = filtered.filter((r: any) => {
      const d = new Date(r.created_at);
      return d >= startOfLastMonth && d < startOfMonth;
    });

    const thisMonthTotal = thisMonthIncidents.length;
    const lastMonthTotal = lastMonthIncidents.length;
    const thisMonthChange = lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    const overview: AnalyticsOverview = {
      totalIncidents: filtered.length,
      openIncidents: filtered.filter((r: any) => r.status === 'open').length,
      activeIncidents: filtered.filter((r: any) => ['dispatched', 'on_scene'].includes(r.status)).length,
      resolvedIncidents: filtered.filter((r: any) => r.status === 'resolved').length,
      falseAlarms: filtered.filter((r: any) => r.status === 'false_report').length,
      thisMonthTotal,
      thisMonthChange,
    };

    return { data: overview, error: null };
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return { data: null, error: error as Error };
  }
}

export async function getStreetStatistics(
  streetName?: string,
  filters?: { zone?: string; district?: string }
): Promise<{ data: StreetStatistics[] | null; error: Error | null }> {
  const supabase = createClient();

  try {
    const { data: allIncidents, error } = await supabase
      .from('incidents')
      .select('street_name, city, status, created_at');

    if (error) throw error;
    if (!allIncidents) return { data: null, error: null };

    const incidents = allIncidents.filter((r: any) => {
      if (streetName && r.street_name !== streetName) return false;
      return matchesFilters(r, filters);
    });

    const streetMap = new Map<string, {
      city: string;
      total: number;
      open: number;
      inProgress: number; // Active (dispatched/on_scene)
      resolved: number;
      falseReports: number;
      lastDate: string;
    }>();

    incidents.forEach((inc: any) => {
      const existing = streetMap.get(inc.street_name);

      const isActive = ['dispatched', 'on_scene'].includes(inc.status);

      if (existing) {
        existing.total++;
        if (inc.status === 'open') existing.open++;
        if (isActive) existing.inProgress++;
        if (inc.status === 'resolved') existing.resolved++;
        if (inc.status === 'false_report') existing.falseReports++;
        if (new Date(inc.created_at) > new Date(existing.lastDate)) {
          existing.lastDate = inc.created_at;
        }
      } else {
        streetMap.set(inc.street_name, {
          city: inc.city,
          total: 1,
          open: inc.status === 'open' ? 1 : 0,
          inProgress: isActive ? 1 : 0,
          resolved: inc.status === 'resolved' ? 1 : 0,
          falseReports: inc.status === 'false_report' ? 1 : 0,
          lastDate: inc.created_at,
        });
      }
    });

    const data: StreetStatistics[] = Array.from(streetMap.entries()).map(([name, stats]) => ({
      streetName: name,
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

export async function getMonthlyInsights(
  months: number = 6,
  filters?: { zone?: string; district?: string }
): Promise<{ data: MonthlyInsight[] | null; error: Error | null }> {
  const supabase = createClient();

  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const { data: allIncidents, error } = await supabase
      .from('incidents')
      .select('status, created_at, city')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!allIncidents) return { data: null, error: null };

    const incidents = allIncidents.filter((r: any) => matchesFilters(r, filters));

    const monthMap = new Map<string, {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      falseReports: number;
    }>();

    incidents.forEach((inc: any) => {
      const date = new Date(inc.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const isActive = ['dispatched', 'on_scene'].includes(inc.status);

      const existing = monthMap.get(monthKey);
      if (existing) {
        existing.total++;
        if (inc.status === 'open') existing.open++;
        if (isActive) existing.inProgress++;
        if (inc.status === 'resolved') existing.resolved++;
        if (inc.status === 'false_report') existing.falseReports++;
      } else {
        monthMap.set(monthKey, {
          total: 1,
          open: inc.status === 'open' ? 1 : 0,
          inProgress: isActive ? 1 : 0,
          resolved: inc.status === 'resolved' ? 1 : 0,
          falseReports: inc.status === 'false_report' ? 1 : 0,
        });
      }
    });

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

export async function getCompositionAndStatus(
  startDate?: Date,
  filters?: { zone?: string; district?: string }
): Promise<{
  composition: CategoryDistributionSlice[] | null;
  status: StatusDistributionSlice[] | null;
  error: Error | null;
}> {
  const supabase = createClient();

  try {
    const { data: allIncidents, error } = await supabase
      .from('incidents')
      .select('category, status, city, created_at');

    if (error) throw error;
    if (!allIncidents) return { composition: null, status: null, error: null };

    const incidents = allIncidents.filter((r: any) => {
      if (startDate && new Date(r.created_at) < startDate) return false;
      return matchesFilters(r, filters);
    });

    const compositionMap = new Map<string, number>();
    const statusMap = new Map<string, number>();

    incidents.forEach((r: any) => {
      const cat = (r.category || 'general').toLowerCase();
      compositionMap.set(cat, (compositionMap.get(cat) || 0) + 1);

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

export async function getCurrentMonthWeeklyStats(filters?: { zone?: string; district?: string }): Promise<{ data: any[] | null; error: Error | null }> {
  const supabase = createClient();

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: allIncidents, error } = await supabase
      .from('incidents')
      .select('status, created_at, city')
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!allIncidents) return { data: [], error: null };

    const incidents = allIncidents.filter((r: any) => matchesFilters(r, filters));

    const weeklyData = Array(5).fill(0).map((_, i) => ({
      week: `Week ${i + 1}`,
      open: 0,
      active: 0,
      resolved: 0,
    }));

    incidents.forEach((inc: any) => {
      const date = new Date(inc.created_at);
      const dayOfMonth = date.getDate();
      const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 4);
      const isActive = ['dispatched', 'on_scene'].includes(inc.status);

      if (inc.status === 'open') weeklyData[weekIndex].open++;
      if (isActive) weeklyData[weekIndex].active++;
      if (inc.status === 'resolved') weeklyData[weekIndex].resolved++;
    });

    return { data: weeklyData, error: null };
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    return { data: null, error: error as Error };
  }
}
