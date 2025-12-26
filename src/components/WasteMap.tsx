import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin } from 'lucide-react';
import { getReports } from '../db/reports';
import type { Database } from '../utils/supabase/client';


type Report = Database['public']['Tables']['reports']['Row'];

interface WasteMapProps {
  viewType: 'citizen' | 'admin';
  userLocation?: { latitude: number; longitude: number } | null;
}

// Component to handle map centering updates
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function WasteMap({ viewType, userLocation, cityFilter }: WasteMapProps & { cityFilter?: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Default center (fallback - India)
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);

  // Update center when userLocation changes
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchReports();
  }, [viewType, cityFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await getReports({
        status: viewType === 'admin' ? undefined : ['open', 'in_progress', 'resolved'],
        city: cityFilter,
      });

      if (error) {
        console.error('Error fetching reports:', error);
      } else if (data) {
        setReports(data);

        // Auto-center for Admin view on the busiest area if no user location is specified
        if (viewType === 'admin' && !userLocation && data.length > 0) {
          const cityCounts = data.reduce((acc, report) => {
            acc[report.city] = (acc[report.city] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const busiestCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0][0];
          const cityReports = data.filter(r => r.city === busiestCity);

          if (cityReports.length > 0) {
            const avgLat = cityReports.reduce((sum, r) => sum + r.latitude, 0) / cityReports.length;
            const avgLng = cityReports.reduce((sum, r) => sum + r.longitude, 0) / cityReports.length;
            setMapCenter([avgLat, avgLng]);
          }
        } else if (data.length > 0 && !userLocation && !cityFilter) {
          // For general view without location, maybe just center on the first report? 
          // Or keep default. But Admin requested "city with most pins".
          // The above block handles 'admin'. 
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Custom icons using DivIcon for consistent "Solid Pin" look
  const createPinIcon = (color: string) => {
    // using a simple SVG string that looks like a MapPin
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
      </svg>
    `;
    return new L.DivIcon({
      className: 'bg-transparent border-none',
      html: `<div style="transform: translate(-50%, -100%); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">${svg}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  const reportIcon = createPinIcon('#EF4444'); // Red-500
  const resolvedIcon = createPinIcon('#22C55E'); // Green-500
  const inProgressIcon = createPinIcon('#EAB308'); // Yellow-500
  const userIcon = createPinIcon('#3B82F6'); // Blue-500

  const getIconForStatus = (status: string) => {
    switch (status) {
      case 'resolved': return resolvedIcon;
      case 'in_progress': return inProgressIcon;
      default: return reportIcon;
    }
  };

  // Debugging logs
  useEffect(() => {
    console.log('WasteMap Render:', { viewType, reportsCount: reports.length, cityFilter });
  }, [reports, viewType, cityFilter]);

  const getStreetCount = (streetName: string) => {
    return reports.filter(r => r.street_name === streetName).length;
  };

  if (loading) {
    return (
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-200 z-0">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={mapCenter} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">You are here</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Report Markers */}
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={getIconForStatus(report.status)}
          >
            <Popup>
              <div className="min-w-[200px]">
                <img
                  src={report.image_url}
                  alt="Waste"
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
                <p className="font-semibold text-sm mb-1">{report.street_name}</p>
                <p className="text-xs text-gray-600 mb-2">{report.description}</p>

                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider ${report.status === 'open' ? 'bg-red-100 text-red-700' :
                    report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                    {report.status.replace('_', ' ')}
                  </span>

                  {viewType === 'admin' && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {getStreetCount(report.street_name)} reports here
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}