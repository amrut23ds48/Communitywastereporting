import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Loader2, MapPin, Filter, Navigation, RefreshCw, 
  Calendar, Building, ChevronRight, Layers 
} from 'lucide-react';
import { getReports } from '../db/reports';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['reports']['Row'];

interface WasteMapProps {
  viewType: 'citizen' | 'admin';
  userLocation?: { latitude: number; longitude: number } | null;
  cityFilter?: string;
}

// Helper to smooth scroll map
function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || map.getZoom(), {
      duration: 1.2
    });
  }, [center, zoom, map]);
  return null;
}

// Classic Legend with White Background
function MapLegend() {
  return (
    <div className="absolute bottom-5 left-5 z-[1000] bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      <h4 className="flex items-center gap-2 font-bold text-gray-800 text-sm mb-3">
        <Layers className="w-4 h-4" /> Map Legend
      </h4>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
          <span className="text-xs text-gray-600 font-medium">Reported (Open)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
          <span className="text-xs text-gray-600 font-medium">Cleanup In Progress</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
          <span className="text-xs text-gray-600 font-medium">Resolved & Cleaned</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm border-2 border-white"></div>
          <span className="text-xs text-gray-600 font-medium">Your Location</span>
        </div>
      </div>
    </div>
  );
}

export function WasteMap({ viewType, userLocation, cityFilter }: WasteMapProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapZoom, setMapZoom] = useState<number>(13);
  
  // Default center (India approx)
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      setMapZoom(15);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchReports();
  }, [viewType, cityFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await getReports({
        status: viewType === 'admin' ? undefined : ['open', 'in_progress', 'resolved'],
        city: cityFilter,
      });

      if (data) {
        setReports(data);
        if (viewType === 'admin' && !userLocation && data.length > 0) {
            setMapCenter([data[0].latitude, data[0].longitude]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Classic Pin Icon Generator ---
  // Using the classic "Teardrop" shape you prefer
  const createPinIcon = (color: string) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
      </svg>
    `;
    return new L.DivIcon({
      className: 'bg-transparent border-none',
      html: `<div style="transform: translate(-50%, -100%); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">${svg}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  const reportIcon = createPinIcon('#EF4444'); // Red
  const resolvedIcon = createPinIcon('#22C55E'); // Green
  const inProgressIcon = createPinIcon('#EAB308'); // Yellow
  const userIcon = createPinIcon('#3B82F6'); // Blue

  const getIconForStatus = (status: string) => {
    switch (status) {
      case 'resolved': return resolvedIcon;
      case 'in_progress': return inProgressIcon;
      default: return reportIcon;
    }
  };

  const activeReportsCount = reports.filter(r => r.status === 'open' || r.status === 'in_progress').length;

  if (loading) {
    return (
      <div className="relative w-full h-[500px] bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow-md bg-white z-0">
      
      {/* Top Right Stats Panel */}
      <div className="absolute top-4 right-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200 flex items-center gap-3">
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Active Reports</p>
          <p className="text-xl font-bold text-gray-800 leading-none">{activeReportsCount}</p>
        </div>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total</p>
          <p className="text-xl font-bold text-gray-800 leading-none">{reports.length}</p>
        </div>
      </div>

      {/* Recenter Button */}
      {userLocation && (
        <button
          onClick={() => {
            setMapCenter([userLocation.latitude, userLocation.longitude]);
            setMapZoom(15);
          }}
          className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-lg shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          title="Go to my location"
        >
          <Navigation className="w-5 h-5" />
        </button>
      )}

      {/* Filter Badge */}
      {cityFilter && (
        <div className="absolute top-4 left-16 z-[1000] bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold">
          <Filter className="w-3 h-3" />
          {cityFilter}
        </div>
      )}

      {/* Main Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        {/* Classic OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={mapCenter} zoom={mapZoom} />

        {/* User Location */}
        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-gray-800">You are here</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Reports */}
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={getIconForStatus(report.status)}
          >
            <Popup className="custom-popup">
              <div className="w-[260px]">
                {/* Image */}
                <div className="relative h-32 w-full bg-gray-100 rounded-t-lg overflow-hidden">
                  <img
                    src={report.image_url || 'https://placehold.co/600x400?text=No+Image'}
                    alt="Waste"
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white ${
                    report.status === 'open' ? 'bg-red-500' :
                    report.status === 'in_progress' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}>
                    {report.status.replace('_', ' ')}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="font-bold text-gray-800 text-sm mb-1 truncate">{report.street_name || "Unknown Street"}</h3>
                  
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(report.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {report.city}</span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                    {report.description || "No description provided."}
                  </p>

                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                      View Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <MapLegend />

      {/* Clean Popup Style Override */}
      <style>{`
        .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: 260px !important;
        }
      `}</style>
    </div>
  );
}