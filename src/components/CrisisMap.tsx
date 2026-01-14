import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Loader2, Layers, AlertTriangle, Truck, Eye
} from 'lucide-react';
import { getIncidents } from '../db/incidents';
import { getResources } from '../db/resources';
import { Incident, Resource, IncidentCategory, ResourceType } from '../types';
import { getDistrictsForZone } from '../utils/cityZones';

interface CrisisMapProps {
    viewType: 'community' | 'agency';
    userLocation?: { latitude: number; longitude: number } | null;
    cityFilter?: string;
    zone?: string;
    district?: string;
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

export function CrisisMap({ viewType, userLocation, cityFilter, zone, district }: CrisisMapProps) {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapZoom, setMapZoom] = useState<number>(13);
    const [showIncidents, setShowIncidents] = useState(true);
    const [showResources, setShowResources] = useState(true);

    const defaultCenter: [number, number] = [20.5937, 78.9629];
    const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);

    // When user location available
    useEffect(() => {
        if (userLocation && !isNaN(userLocation.latitude) && !isNaN(userLocation.longitude)) {
            setMapCenter([userLocation.latitude, userLocation.longitude]);
            setMapZoom(15);
        }
    }, [userLocation]);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, [viewType, cityFilter, zone, district]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let targetCity = cityFilter;
            if (district && district !== 'all') targetCity = district;

            const [incidentsRes, resourcesRes] = await Promise.all([
                getIncidents({
                    status: viewType === 'agency' ? 'all' : ['open', 'dispatched', 'on_scene', 'resolved'],
                    city: targetCity
                }),
                getResources()
            ]);

            if (incidentsRes.data) {
                let validIncidents = incidentsRes.data.filter(r =>
                    typeof r.latitude === "number" && !isNaN(r.latitude) &&
                    typeof r.longitude === "number" && !isNaN(r.longitude)
                );
                // Zone filtering if needed client-side
                if (zone && zone !== 'all' && (!district || district === 'all')) {
                    const allowedCities = getDistrictsForZone(zone).map(c => c.toLowerCase());
                    validIncidents = validIncidents.filter(r => r.city && allowedCities.includes(r.city.toLowerCase()));
                }
                setIncidents(validIncidents);

                // Center map on first incident if agency view
                if (viewType === 'agency' && !userLocation && validIncidents.length > 0) {
                    setMapCenter([validIncidents[0].latitude, validIncidents[0].longitude]);
                }
            }

            if (resourcesRes.data) {
                setResources(resourcesRes.data.filter(r =>
                    typeof r.latitude === "number" && !isNaN(r.latitude) &&
                    typeof r.longitude === "number" && !isNaN(r.longitude)
                ));
            }

        } catch (error) {
            console.error('Error fetching map data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Icons
    const createIcon = (color: string, shape: 'circle' | 'square' = 'circle') =>
        new L.DivIcon({
            className: 'bg-transparent border-none',
            html: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}">
          ${shape === 'circle'
                    ? '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="white"/>'
                    : '<rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="12" cy="12" r="3" fill="white"/>'}
        </svg>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

    const getIncidentIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return createIcon('#EF4444'); // Red
            case 'high': return createIcon('#F97316'); // Orange
            case 'medium': return createIcon('#EAB308'); // Yellow
            default: return createIcon('#64748B'); // Gray/Low
        }
    };

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'ambulance': return createIcon('#3B82F6', 'square'); // Blue
            case 'fire_truck': return createIcon('#DC2626', 'square'); // Red Square
            case 'police': return createIcon('#1E40AF', 'square'); // Dark Blue
            default: return createIcon('#10B981', 'square'); // Green
        }
    };

    return (
        <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-slate-200">
            <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapUpdater center={mapCenter} zoom={mapZoom} />

                {/* User Location */}
                {userLocation && (
                    <Marker position={[userLocation.latitude, userLocation.longitude]} icon={createIcon('#8B5CF6')} />
                )}

                {/* Incidents Layer */}
                {showIncidents && incidents.map(inc => (
                    <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={getIncidentIcon(inc.severity)}>
                        <Popup>
                            <div className="p-1">
                                <span className="text-xs font-bold uppercase text-slate-500">{inc.category}</span>
                                <h4 className="font-bold text-sm">{inc.street_name || 'Unknown Location'}</h4>
                                <p className="text-xs text-slate-600 mb-2">{inc.description}</p>
                                <div className="flex gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${inc.severity === 'critical' ? 'bg-red-50 text-red-600 border-red-200' :
                                            inc.severity === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                'bg-yellow-50 text-yellow-600 border-yellow-200'
                                        }`}>{inc.severity}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold">{inc.status}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Resources Layer */}
                {showResources && resources.map(res => (
                    <Marker key={res.id} position={[res.latitude, res.longitude]} icon={getResourceIcon(res.type)}>
                        <Popup>
                            <div className="p-1">
                                <span className="text-xs font-bold uppercase text-blue-500">Resource</span>
                                <h4 className="font-bold text-sm">{res.name}</h4>
                                <p className="text-xs text-slate-600">Type: {res.type}</p>
                                <p className="text-xs text-slate-600">Qty: {res.quantity}</p>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-bold mt-1 inline-block">{res.status}</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}

            </MapContainer>

            {/* Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button
                    onClick={() => setShowIncidents(!showIncidents)}
                    className={`p-2 rounded-lg shadow-md border transition-all ${showIncidents ? 'bg-white text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                >
                    <AlertTriangle className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setShowResources(!showResources)}
                    className={`p-2 rounded-lg shadow-md border transition-all ${showResources ? 'bg-white text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                >
                    <Truck className="w-5 h-5" />
                </button>
            </div>

            {loading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-[1001]">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            )}
        </div>
    );
}
