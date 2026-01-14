import React, { useEffect, useState } from 'react';
import { getResources } from '../../db/resources';
import { Resource } from '../../types';
import { MapPin, Phone, Box, Truck, HeartPulse, Shield, Home, Utensils, Droplets, Wifi, Users, Clock, Navigation, AlertCircle } from 'lucide-react';

// Dummy data for when database is empty
const DUMMY_SAFE_PLACES: Resource[] = [
    {
        id: 'dummy-1',
        name: 'Municipal Relief Camp A',
        type: 'shelter',
        quantity: 200,
        latitude: 19.0760,
        longitude: 72.8777,
        status: 'available',
        contact_info: '+91 22 2266 1234',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'dummy-2',
        name: 'District Hospital Emergency',
        type: 'personnel',
        quantity: 50,
        latitude: 19.0330,
        longitude: 73.0297,
        status: 'available',
        contact_info: '108',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'dummy-3',
        name: 'Red Cross Supply Distribution',
        type: 'supplies',
        quantity: 500,
        latitude: 19.1136,
        longitude: 72.8697,
        status: 'available',
        contact_info: '+91 22 2202 0000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'dummy-4',
        name: 'Community Water Tanker Point',
        type: 'supplies',
        quantity: 10,
        latitude: 19.0596,
        longitude: 72.8295,
        status: 'dispatched',
        contact_info: '+91 22 2265 5555',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'dummy-5',
        name: 'Emergency Ambulance Bay',
        type: 'ambulance',
        quantity: 5,
        latitude: 19.0821,
        longitude: 72.8416,
        status: 'available',
        contact_info: '102',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'dummy-6',
        name: 'School Emergency Shelter',
        type: 'shelter',
        quantity: 150,
        latitude: 19.0178,
        longitude: 72.8478,
        status: 'available',
        contact_info: '+91 22 2345 6789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

export function SafePlacesView() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [useDummy, setUseDummy] = useState(false);

    useEffect(() => {
        async function load() {
            const { data } = await getResources();
            if (data && data.length > 0) {
                setResources(data);
            } else {
                // Use dummy data if no real data
                setResources(DUMMY_SAFE_PLACES);
                setUseDummy(true);
            }
            setLoading(false);
        }
        load();
    }, []);

    const filtered = resources.filter(r => filter === 'all' || r.type === filter);

    const getIcon = (type: string) => {
        const iconClass = "w-6 h-6";
        switch (type) {
            case 'ambulance': return <Truck className={`${iconClass} text-blue-500`} />;
            case 'personnel': return <HeartPulse className={`${iconClass} text-rose-500`} />;
            case 'supplies': return <Droplets className={`${iconClass} text-cyan-500`} />;
            case 'shelter': return <Home className={`${iconClass} text-amber-500`} />;
            case 'equipment': return <Box className={`${iconClass} text-purple-500`} />;
            default: return <Shield className={`${iconClass} text-slate-500`} />;
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'available': return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
            case 'dispatched': return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
            case 'depleted': return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
        }
    };

    // Using valid ResourceType values: 'ambulance' | 'personnel' | 'supplies' | 'equipment' | 'shelter' | 'other'
    const filterOptions = [
        { key: 'all', label: 'All', icon: Box },
        { key: 'shelter', label: 'Shelter', icon: Home },
        { key: 'personnel', label: 'Personnel', icon: HeartPulse },
        { key: 'supplies', label: 'Supplies', icon: Droplets },
        { key: 'ambulance', label: 'Ambulance', icon: Truck },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Demo Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-200">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Safe Places & Resources</h2>
                        <p className="text-sm text-slate-500">Find nearby help and emergency resources</p>
                    </div>
                    {useDummy && (
                        <span className="ml-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200 animate-pulse">
                            DEMO DATA
                        </span>
                    )}
                </div>

                {/* Stats Summary */}
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-2xl font-bold text-emerald-600">{resources.filter(r => r.status === 'available').length}</span>
                        <span className="text-xs text-slate-500 ml-1">Available</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-2xl font-bold text-slate-700">{resources.length}</span>
                        <span className="text-xs text-slate-500 ml-1">Total</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {filterOptions.map(f => {
                    const Icon = f.icon;
                    const isActive = filter === f.key;
                    return (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${isActive
                                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-300'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                            {f.label}
                            {f.key !== 'all' && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                                    {resources.filter(r => r.type === f.key).length}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="w-14 h-14 bg-slate-100 rounded-xl"></div>
                                <div className="w-20 h-6 bg-slate-100 rounded-full"></div>
                            </div>
                            <div className="w-3/4 h-5 bg-slate-100 rounded mb-2"></div>
                            <div className="w-1/2 h-4 bg-slate-50 rounded mb-4"></div>
                            <div className="space-y-2">
                                <div className="w-full h-4 bg-slate-50 rounded"></div>
                                <div className="w-2/3 h-4 bg-slate-50 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                /* Empty State */
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                    <div className="w-20 h-20 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No resources found</h3>
                    <p className="text-slate-500">Try adjusting your filter or check back later</p>
                </div>
            ) : (
                /* Resource Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(r => {
                        const statusConfig = getStatusConfig(r.status || 'available');
                        return (
                            <div
                                key={r.id}
                                className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl group-hover:scale-110 transition-transform">
                                        {getIcon(r.type)}
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text} text-[10px] uppercase font-bold px-2.5 py-1.5 rounded-full`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${r.status === 'available' ? 'animate-pulse' : ''}`}></span>
                                        {r.status}
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{r.name}</h3>
                                <p className="text-sm text-slate-500 mb-4 capitalize flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs font-medium">{r.type}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" />
                                        {r.quantity} Units
                                    </span>
                                </p>

                                <div className="space-y-2.5 text-sm">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="text-xs">Lat: {r.latitude?.toFixed(4)}, Lng: {r.longitude?.toFixed(4)}</span>
                                    </div>
                                    {r.contact_info && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                                                <Phone className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <span className="font-medium text-emerald-700">{r.contact_info}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                <button className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-600 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-white">
                                    <Navigation className="w-4 h-4" />
                                    Get Directions
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Help Banner */}
            <div className="bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl shadow-rose-200/50">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Phone className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Need Immediate Help?</h3>
                            <p className="text-rose-100 text-sm">Call the 24/7 Emergency Hotline</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="tel:112" className="px-6 py-3 bg-white text-rose-600 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                            Call 112
                        </a>
                        <a href="tel:108" className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/30 transition-all">
                            Ambulance 108
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
