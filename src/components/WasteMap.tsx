import React, { useState, useEffect } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { getReports } from '../db/reports';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['reports']['Row'];

interface WasteMapProps {
  viewType: 'citizen' | 'admin';
}

export function WasteMap({ viewType }: WasteMapProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReports, setMapReports] = useState<Array<{
    id: string;
    street: string;
    count: number;
    lat: number;
    lng: number;
    status: string;
    imageUrl: string;
    description: string;
    city: string;
  }>>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await getReports({
        status: viewType === 'admin' ? undefined : ['open', 'in_progress'],
      });

      if (error) {
        console.error('Error fetching reports:', error);
      } else if (data) {
        setReports(data);
        processReportsForMap(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processReportsForMap = (reportsData: Report[]) => {
    // Group reports by street for clustering
    const streetMap = new Map<string, Report[]>();
    
    reportsData.forEach(report => {
      const existing = streetMap.get(report.street_name);
      if (existing) {
        existing.push(report);
      } else {
        streetMap.set(report.street_name, [report]);
      }
    });

    // Convert to map markers with normalized coordinates
    const markers = Array.from(streetMap.entries()).map(([street, streetReports], index) => {
      // Calculate average coordinates for the street
      const avgLat = streetReports.reduce((sum, r) => sum + r.latitude, 0) / streetReports.length;
      const avgLng = streetReports.reduce((sum, r) => sum + r.longitude, 0) / streetReports.length;
      
      // Normalize to 0-100 range for display (we'll use a simple distribution)
      // In production, you'd use proper map projection
      const normalizedLat = ((index * 15 + 25) % 80) + 10;
      const normalizedLng = ((index * 20 + 15) % 80) + 10;

      return {
        id: streetReports[0].id,
        street,
        count: streetReports.length,
        lat: normalizedLat,
        lng: normalizedLng,
        status: streetReports[0].status,
        imageUrl: streetReports[0].image_url,
        description: streetReports[0].description,
        city: streetReports[0].city,
      };
    });

    setMapReports(markers);
  };

  const getMarkerColor = (count: number) => {
    if (count >= 7) return 'bg-red-500';
    if (count >= 4) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const getMarkerSize = (count: number) => {
    if (count >= 7) return 'w-8 h-8';
    if (count >= 4) return 'w-6 h-6';
    return 'w-4 h-4';
  };

  const handleMarkerClick = (marker: typeof mapReports[0]) => {
    if (viewType === 'admin') {
      // Find the actual report from the marker
      const report = reports.find(r => r.street_name === marker.street);
      if (report) {
        setSelectedReport(report);
      }
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (mapReports.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No reports to display</p>
          <p className="text-xs text-gray-500 mt-1">Reports will appear here once submitted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden border border-gray-200">
      {/* Map Background with Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Report Markers */}
      {mapReports.map((marker) => (
        <div
          key={marker.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
          style={{ left: `${marker.lng}%`, top: `${marker.lat}%` }}
          onClick={() => handleMarkerClick(marker)}
        >
          <div className={`${getMarkerColor(marker.count)} ${getMarkerSize(marker.count)} rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110`}>
            <MapPin className="w-full h-full p-1 text-white" />
          </div>
          
          {/* Tooltip */}
          {viewType === 'citizen' && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl">
                <div className="text-white">{marker.street}</div>
                <div className="text-gray-300">{marker.count} reports</div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-3 space-y-2">
        <p className="text-xs text-gray-900 mb-2">Report Density</p>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Low (1-3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Medium (4-6)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="text-xs text-gray-600">High (7+)</span>
        </div>
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
          Total: {reports.length} reports
        </div>
      </div>

      {/* Simulated Streets */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#94a3b8" strokeWidth="3" />
        <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#94a3b8" strokeWidth="3" />
        <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#94a3b8" strokeWidth="3" />
        <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#94a3b8" strokeWidth="3" />
      </svg>

      {/* Report Details Modal */}
      {selectedReport && viewType === 'admin' && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-gray-900">Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <img
                src={selectedReport.image_url}
                alt="Waste report"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">{selectedReport.street_name}, {selectedReport.city}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedReport.description}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Status:</span>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                    selectedReport.status === 'open' ? 'bg-red-100 text-red-700' :
                    selectedReport.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    selectedReport.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedReport.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Reported: {new Date(selectedReport.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}