import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Loader2, MapPin, Filter, Layers, Navigation, 
  Maximize2, RefreshCw, AlertCircle, Info, Calendar, 
  Building, ChevronRight, X, Plus, Minus, BarChart3
} from 'lucide-react';
import { getReports } from '../db/reports';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['reports']['Row'];

interface WasteMapProps {
  viewType: 'citizen' | 'admin';
  userLocation?: { latitude: number; longitude: number } | null;
  cityFilter?: string;
}

// --- sub-components ---

// Smooth Map Centering
function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || map.getZoom(), {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [center, zoom, map]);
  return null;
}

// Floating Control Bar
function MapControls({ 
  onZoomIn, onZoomOut, onRefresh, onLocate, isLocating 
}: { 
  onZoomIn: () => void; 
  onZoomOut: () => void; 
  onRefresh: () => void;
  onLocate: () => void;
  isLocating: boolean;
}) {
  return (
    <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
      {/* Zoom Group */}
      <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-white/40 overflow-hidden">
        <button onClick={onZoomIn} className="p-3 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100">
          <Plus className="w-5 h-5 text-slate-600" />
        </button>
        <button onClick={onZoomOut} className="p-3 hover:bg-slate-50 active:bg-slate-100 transition-colors">
          <Minus className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Action Group */}
      <button 
        onClick={onLocate}
        className={`p-3 rounded-2xl shadow-xl border border-white/40 transition-all duration-300 ${
          isLocating 
            ? 'bg-blue-500 text-white shadow-blue-200' 
            : 'bg-white/90 backdrop-blur-md text-slate-600 hover:bg-white'
        }`}
      >
        <Navigation className={`w-5 h-5 ${isLocating ? 'animate-pulse' : ''}`} />
      </button>

      <button 
        onClick={onRefresh}
        className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-white/40 text-slate-600 hover:rotate-180 transition-all duration-500"
      >
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
  );
}

// Collapsible Legend
function MapLegend({ viewType }: { viewType: 'citizen' | 'admin' }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="absolute bottom-6 left-6 z-[1000] transition-all duration-300">
      <div className={`bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-200/50 border border-white/40 overflow-hidden transition-all duration-300 ${isOpen ? 'w-64' : 'w-12 h-12 rounded-full'}`}>
        
        {/* Header / Toggle */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between p-3 cursor-pointer ${isOpen ? 'bg-slate-50/50 border-b border-slate-100' : 'h-full justify-center'}`}
        >
          {isOpen ? (
            <>
              <span className="font-bold text-slate-800 text-sm">Map Legend</span>
              <X className="w-4 h-4 text-slate-400" />
            </>
          ) : (
            <Layers className="w-5 h-5 text-slate-600" />
          )}
        </div>

        {/* Content */}
        {isOpen && (
          <div className="p-4 space-y-3">
            {[
              { color: '#EF4444', label: 'Reported (Action Required)', pulse: true },
              { color: '#F59E0B', label: 'Cleanup In Progress' },
              { color: '#10B981', label: 'Resolved & Verified' },
              { color: '#3B82F6', label: 'My Location' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  {item.pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: item.color }}></span>}
                  <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: item.color }}></span>
                </span>
                <span className="text-xs font-medium text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Floating Stats Card
function MapStats({ reports }: { reports: Report[] }) {
  const stats = useMemo(() => {
    return {
      open: reports.filter(r => r.status === 'open').length,
      progress: reports.filter(r => r.status === 'in_progress').length,
      resolved: reports.filter(r => r.status === 'resolved').length
    };
  }, [reports]);

  return (
    <div className="absolute top-6 right-6 z-[1000] hidden md:block">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-white/40 p-1 flex gap-1">
        <div className="px-4 py-2 text-center border-r border-slate-100">
          <div className="text-lg font-bold text-red-500 leading-none">{stats.open}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pending</div>
        </div>
        <div className="px-4 py-2 text-center border-r border-slate-100">
          <div className="text-lg font-bold text-amber-500 leading-none">{stats.progress}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active</div>
        </div>
        <div className="px-4 py-2 text-center">
          <div className="text-lg font-bold text-emerald-500 leading-none">{stats.resolved}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Done</div>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export function WasteMap({ viewType, userLocation, cityFilter }: WasteMapProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Default: Center of India approx
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);

  // Sync user location
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      setMapZoom(15);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchReports();
  }, [viewType, cityFilter, refreshTrigger]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await getReports({
        status: viewType === 'admin' ? undefined : ['open', 'in_progress', 'resolved'],
        city: cityFilter,
      });

      if (data) {
        setReports(data);
        // If admin view and no user loc, center on hotspot
        if (viewType === 'admin' && !userLocation && data.length > 0) {
          // Simple logic to find first city
          setMapCenter([data[0].latitude, data[0].longitude]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setLoading(false), 800); // Artificial delay for smooth load transition
    }
  };

  // --- Icon Generators ---
  const createPinIcon = (color: string, pulse = false) => {
    // A more modern, SVG-based pin
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
      </svg>
    `;

    const html = `
      <div class="relative flex items-center justify-center">
        ${pulse ? `<div class="absolute w-full h-full rounded-full bg-[${color}] opacity-75 animate-ping"></div>` : ''}
        <div class="relative z-10 drop-shadow-xl transform hover:-translate-y-1 transition-transform duration-200">
          ${svg}
        </div>
      </div>
    `;

    return new L.DivIcon({
      className: 'bg-transparent border-none',
      html,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'resolved': return createPinIcon('#10B981'); // Emerald
      case 'in_progress': return createPinIcon('#F59E0B'); // Amber
      default: return createPinIcon('#EF4444', true); // Red + Pulse
    }
  };

  const userIcon = createPinIcon('#3B82F6');

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white opacity-50"></div>
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin relative z-10" />
        <p className="text-sm font-medium text-slate-400 relative z-10 animate-pulse">Establishing Satellite Connection...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-200/50 isolate">
      
      {/* Controls Layer */}
      <MapControls 
        onZoomIn={() => setMapZoom(z => Math.min(z + 1, 18))}
        onZoomOut={() => setMapZoom(z => Math.max(z - 1, 10))}
        onRefresh={() => setRefreshTrigger(n => n + 1)}
        onLocate={() => { if(userLocation) { setMapCenter([userLocation.latitude, userLocation.longitude]); setMapZoom(16); }}}
        isLocating={!!userLocation}
      />
      
      <MapStats reports={reports} />
      <MapLegend viewType={viewType} />

      {/* Filter Badge */}
      {cityFilter && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-sm font-medium">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Zone: {cityFilter}</span>
        </div>
      )}

      {/* Map Layer */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        className="bg-slate-50 z-0"
      >
        {/* Professional "Voyager" Tiles - Cleaner look */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapUpdater center={mapCenter} zoom={mapZoom} />

        {/* User Marker */}
        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
            <Circle 
              center={[userLocation.latitude, userLocation.longitude]}
              radius={200}
              pathOptions={{ fillColor: '#3B82F6', color: '#3B82F6', opacity: 0.1, fillOpacity: 0.1 }}
            />
          </Marker>
        )}

        {/* Reports */}
        {reports.map((report) => (
          <React.Fragment key={report.id}>
            <Marker position={[report.latitude, report.longitude]} icon={getIcon(report.status)}>
              <Popup className="custom-popup" closeButton={false}>
                <div className="w-[300px] overflow-hidden rounded-2xl bg-white shadow-none">
                  {/* Image Header */}
                  <div className="relative h-40 bg-slate-100">
                    <img 
                      src={report.image_url || 'https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image'} 
                      className="w-full h-full object-cover"
                      alt="Report"
                    />
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur rounded-lg text-white text-[10px] font-bold uppercase tracking-wider">
                      {report.status.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-4">
                    <h3 className="font-bold text-slate-800 text-base mb-1 truncate">{report.street_name || "Unknown Location"}</h3>
                    <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <Building className="w-3 h-3" />
                      <span>{report.city}</span>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
                      {report.description || "No detailed description provided."}
                    </p>

                    <button className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2">
                      View Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

      </MapContainer>

      {/* Global CSS for Popups */}
      <style>{`
        .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: 300px !important;
        }
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-popup-tip-container {
          visibility: hidden;
        }
      `}</style>
    </div>
  );
}