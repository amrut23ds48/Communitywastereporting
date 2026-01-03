import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Loader2, Filter, Navigation, Calendar, Building, ChevronRight, Layers 
} from 'lucide-react';
import { getReports } from '../db/reports';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['reports']['Row'];

interface WasteMapProps {
  viewType: 'citizen' | 'admin';
  userLocation?: { latitude: number; longitude: number } | null;
  cityFilter?: string;
}

// Smooth map move
function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Legend
function MapLegend() {
  return (
    <div className="absolute bottom-5 left-5 z-[1000] bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      <h4 className="flex items-center gap-2 font-bold text-gray-800 text-sm mb-3">
        <Layers className="w-4 h-4" /> Map Legend
      </h4>
      <div className="space-y-2">
        <LegendDot color="bg-red-500" text="Reported (Open)" />
        <LegendDot color="bg-yellow-500" text="Cleanup In Progress" />
        <LegendDot color="bg-green-500" text="Resolved & Cleaned" />
        <LegendDot color="bg-blue-500" text="Your Location" />
      </div>
    </div>
  );
}

function LegendDot({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color} shadow-sm`} />
      <span className="text-xs text-gray-600 font-medium">{text}</span>
    </div>
  );
}

export function WasteMap({ viewType, userLocation, cityFilter }: WasteMapProps) {

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapZoom, setMapZoom] = useState<number>(13);

  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);

  // When user location available
  useEffect(() => {
    if (userLocation 
      && !isNaN(userLocation.latitude) 
      && !isNaN(userLocation.longitude)
    ) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      setMapZoom(15);
    }
  }, [userLocation]);

  // Fetch reports
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

        // 🔥 Keep only valid coordinates
        const validReports = data.filter(r =>
          typeof r.latitude === "number" &&
          typeof r.longitude === "number" &&
          !isNaN(r.latitude) &&
          !isNaN(r.longitude)
        );

        setReports(validReports);

        // 🔥 Set map center safely
        if (viewType === 'admin' && !userLocation && validReports.length > 0) {
          setMapCenter([validReports[0].latitude, validReports[0].longitude]);
        }
      }
    } 
    catch (error) {
      console.error('Error:', error);
    } 
    finally {
      setLoading(false);
    }
  };

  // Pin icon generator
  const createPinIcon = (color: string) =>
    new L.DivIcon({
      className: 'bg-transparent border-none',
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" 
        viewBox="0 0 24 24" fill="${color}">
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3" fill="white"/>
        </svg>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

  const icons = {
    open: createPinIcon('#EF4444'),
    in_progress: createPinIcon('#EAB308'),
    resolved: createPinIcon('#22C55E'),
    user: createPinIcon('#3B82F6')
  };

  const getIcon = (status: string) =>
    status === "resolved" ? icons.resolved :
    status === "in_progress" ? icons.in_progress :
    icons.open;

  const activeReportsCount =
    reports.filter(r => r.status === 'open' || r.status === 'in_progress').length;

  if (loading) return (
    <div className="relative w-full h-[500px] flex justify-center items-center bg-gray-100 rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden">

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
      >

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapUpdater center={mapCenter} zoom={mapZoom} />

        {userLocation &&
         !isNaN(userLocation.latitude) &&
         !isNaN(userLocation.longitude) && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={icons.user}
          />
        )}

        {/* 🔥 SAFE REPORT MARKERS */}
        {reports.map(r => (
          <Marker
            key={r.id}
            position={[r.latitude, r.longitude]}
            icon={getIcon(r.status)}
          >
            <Popup>
              <b>{r.street_name || "Unknown Location"}</b><br />
              {r.city}<br />
              Status: {r.status}
            </Popup>
          </Marker>
        ))}

      </MapContainer>

      <MapLegend />
    </div>
  );
}
