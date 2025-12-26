import { createClient } from '../utils/supabase/client';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportInsert = Database['public']['Tables']['reports']['Insert'];
type ReportStatus = Report['status'];

/**
 * Create a new waste report (citizen)
 */
export async function createReport(report: ReportInsert): Promise<{ data: Report | null; error: Error | null }> {
  console.log('📝 [db/reports] createReport: Initiating with data:', report);
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        ...report,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [db/reports] createReport: Supabase API Error:', error);
      throw error;
    }

    console.log('✅ [db/reports] createReport: Success!', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ [db/reports] createReport: Unexpected Exception:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all reports with optional filters
 */
export async function getReports(filters?: {
  status?: ReportStatus | ReportStatus[] | 'all';
  streetName?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<{ data: Report[] | null; error: Error | null }> {
  console.log('🔍 [db/reports] getReports: Fetching with filters:', filters);
  const supabase = createClient();

  try {
    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
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

    if (error) {
      console.error('❌ [db/reports] getReports: Supabase API Error:', error);
      throw error;
    }

    console.log(`✅ [db/reports] getReports: Successfully retrieved ${data?.length || 0} reports`, data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ [db/reports] getReports: Unexpected Exception:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single report by ID
 */
export async function getReportById(reportId: string): Promise<{ data: Report | null; error: Error | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching report:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get reports for a specific location (for map markers)
 */
export async function getReportsByLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 0.5
): Promise<{ data: Report[] | null; error: Error | null }> {
  const supabase = createClient();

  try {
    // Simple bounding box query (for production, use PostGIS)
    const latDelta = radiusKm / 111; // Rough conversion
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .gte('latitude', latitude - latDelta)
      .lte('latitude', latitude + latDelta)
      .gte('longitude', longitude - lngDelta)
      .lte('longitude', longitude + lngDelta);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching reports by location:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get reports grouped by street (for heatmap)
 */
export async function getReportsByStreet(): Promise<{
  data: Array<{ street_name: string; city: string; count: number; lat: number; lng: number }> | null;
  error: Error | null
}> {
  const supabase = createClient();

  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('street_name, city, latitude, longitude, status');

    if (error) throw error;
    if (!reports) return { data: null, error: null };

    // Group by street and calculate averages
    const streetMap = new Map<string, {
      count: number;
      totalLat: number;
      totalLng: number;
      city: string;
      openCount: number;
    }>();

    reports.forEach((report: Pick<Report, 'street_name' | 'city' | 'latitude' | 'longitude' | 'status'>) => {
      const key = `${report.street_name}-${report.city}`;
      const existing = streetMap.get(key);

      if (existing) {
        existing.count++;
        existing.totalLat += report.latitude;
        existing.totalLng += report.longitude;
        if (report.status === 'open') existing.openCount++;
      } else {
        streetMap.set(key, {
          count: 1,
          totalLat: report.latitude,
          totalLng: report.longitude,
          city: report.city,
          openCount: report.status === 'open' ? 1 : 0,
        });
      }
    });

    const data = Array.from(streetMap.entries()).map(([key, value]) => ({
      street_name: key.split('-')[0],
      city: value.city,
      count: value.count,
      lat: value.totalLat / value.count,
      lng: value.totalLng / value.count,
    }));

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching street reports:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadReportImage(file: File): Promise<{ url: string | null; error: Error | null }> {
  console.log('📤 [db/reports] uploadReportImage: Uploading file', file.name);
  const supabase = createClient();

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `reports/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('waste-reports')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [db/reports] uploadReportImage: Storage Error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('waste-reports')
      .getPublicUrl(filePath);

    console.log('✅ [db/reports] uploadReportImage: Success, URL:', publicUrl);
    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('❌ [db/reports] uploadReportImage: Exception:', error);
    return { url: null, error: error as Error };
  }
}

/**
 * Subscribe to real-time report changes
 */
export function subscribeToReports(
  callback: (report: Report) => void,
  filters?: { status?: ReportStatus }
) {
  const supabase = createClient();
  console.log('📡 [db/reports] subscribeToReports: Subscribing to changes...');

  let subscription = supabase
    .channel('reports-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reports',
        filter: filters?.status ? `status=eq.${filters.status}` : undefined,
      },
      (payload) => {
        console.log('🔔 [db/reports] Realtime Update Received:', payload);
        if (payload.new) {
          callback(payload.new as Report);
        }
      }
    )
    .subscribe();

  return () => {
    console.log('🔕 [db/reports] subscribeToReports: Unsubscribing');
    subscription.unsubscribe();
  };
}