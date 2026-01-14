import React, { useEffect, useState } from 'react';
import { getResources } from '../../db/resources';
import { Resource } from '../../types';
import {
    MapPin, Phone, Box, Truck, HeartPulse, Shield, Home, Utensils, Droplets,
    Plus, Edit2, Trash2, MoreVertical, Check, X, Clock, AlertTriangle,
    Package, Activity, Users, TrendingUp, RefreshCw
} from 'lucide-react';

// Dummy data for when database is empty
const DUMMY_RESOURCES: Resource[] = [
    {
        id: 'res-1',
        name: 'Fire Engine Unit Alpha',
        type: 'ambulance',
        quantity: 3,
        latitude: 19.0760,
        longitude: 72.8777,
        status: 'available',
        contact_info: 'Station: Fire HQ Alpha',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'res-2',
        name: 'Mobile Medical Unit',
        type: 'personnel',
        quantity: 2,
        latitude: 19.0330,
        longitude: 73.0297,
        status: 'dispatched',
        contact_info: 'Dr. Sharma Team',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'res-3',
        name: 'Relief Supply Truck #7',
        type: 'supplies',
        quantity: 500,
        latitude: 19.1136,
        longitude: 72.8697,
        status: 'available',
        contact_info: 'Warehouse B',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'res-4',
        name: 'Emergency Shelter Camp',
        type: 'shelter',
        quantity: 200,
        latitude: 19.0596,
        longitude: 72.8295,
        status: 'available',
        contact_info: 'Camp Coordinator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'res-5',
        name: 'Heavy Equipment Crane',
        type: 'equipment',
        quantity: 1,
        latitude: 19.0821,
        longitude: 72.8416,
        status: 'available',
        contact_info: 'Ops Control',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'res-6',
        name: 'Water Tanker Fleet',
        type: 'supplies',
        quantity: 8,
        latitude: 19.0178,
        longitude: 72.8478,
        status: 'dispatched',
        contact_info: 'Municipal Water Dept',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

export function ResourceManagementView() {
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
                setResources(DUMMY_RESOURCES);
                setUseDummy(true);
            }
            setLoading(false);
        }
        load();
    }, []);

    const filtered = resources.filter(r => filter === 'all' || r.type === filter);

    const getIcon = (type: string) => {
        const iconClass = "w-5 h-5";
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
            case 'available': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Available' };
            case 'dispatched': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Dispatched' };
            case 'depleted': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Depleted' };
            case 'maintenance': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Maintenance' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
        }
    };

    // Calculate stats
    const stats = {
        total: resources.length,
        available: resources.filter(r => r.status === 'available').length,
        dispatched: resources.filter(r => r.status === 'dispatched').length,
        capacity: resources.reduce((sum, r) => sum + (r.quantity || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Header with Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Resource Management</h2>
                        <p className="text-sm text-slate-500">Monitor and dispatch emergency resources</p>
                    </div>
                    {useDummy && (
                        <span className="ml-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200 animate-pulse">
                            DEMO DATA
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all">
                        <Plus className="w-4 h-4" />
                        Add Resource
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <Box className="w-5 h-5 text-slate-600" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    <p className="text-xs text-slate-500 font-medium">Total Resources</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Check className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">READY</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
                    <p className="text-xs text-slate-500 font-medium">Available Now</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Truck className="w-5 h-5 text-amber-600" />
                        </div>
                        <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{stats.dispatched}</p>
                    <p className="text-xs text-slate-500 font-medium">In Field</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{stats.capacity.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 font-medium">Total Capacity</p>
                </div>
            </div>

            {/* Filter Tabs - Using valid ResourceType values */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {['all', 'ambulance', 'personnel', 'supplies', 'equipment', 'shelter', 'other'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-all ${filter === f
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {f === 'all' ? 'All Types' : f}
                    </button>
                ))}
            </div>

            {/* Resource Table/List */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="w-1/3 h-4 bg-slate-100 rounded"></div>
                                    <div className="w-1/4 h-3 bg-slate-50 rounded"></div>
                                </div>
                                <div className="w-20 h-6 bg-slate-100 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-4">Resource</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Capacity</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-slate-100">
                        {filtered.map(r => {
                            const statusConfig = getStatusConfig(r.status || 'available');
                            return (
                                <div
                                    key={r.id}
                                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group"
                                >
                                    {/* Name & Contact */}
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-100 rounded-xl group-hover:bg-white transition-colors">
                                            {getIcon(r.type)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                                            <p className="text-xs text-slate-500">{r.contact_info}</p>
                                        </div>
                                    </div>

                                    {/* Type */}
                                    <div className="col-span-2">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg capitalize">
                                            {r.type}
                                        </span>
                                    </div>

                                    {/* Capacity */}
                                    <div className="col-span-2">
                                        <span className="text-sm font-bold text-slate-700">{r.quantity}</span>
                                        <span className="text-xs text-slate-400 ml-1">units</span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 ${statusConfig.bg} ${statusConfig.text} text-xs font-bold rounded-full`}>
                                            {r.status === 'available' && <Check className="w-3 h-3" />}
                                            {r.status === 'dispatched' && <Truck className="w-3 h-3" />}
                                            {statusConfig.label}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors" title="Dispatch">
                                            <Truck className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Remove">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {filtered.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">No resources found</h3>
                            <p className="text-sm text-slate-500">Try a different filter or add new resources</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
