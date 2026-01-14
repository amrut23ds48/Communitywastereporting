import React, { useState, useEffect } from 'react';
import {
    Bell, LogOut, Radio, Truck, Users, AlertTriangle, Clock, CheckCircle,
    MapPin, Phone, MessageSquare, Camera, RefreshCw, Filter, ChevronRight,
    Building2, Flame, Shield, Activity, Target, Plus, Send, FileText,
    Navigation, Eye, MoreVertical
} from 'lucide-react';
import { CrisisMap } from './CrisisMap';
import { getIncidents, updateIncidentStatus } from '../db/incidents';
import type { Incident, IncidentStatus } from '../types';

interface AgencyDashboardProps {
    onLogout: () => void;
    userId: string;
}

// Dummy agency data
const AGENCY_INFO = {
    name: 'Mumbai Fire Brigade',
    type: 'fire',
    zone: 'Western Zone',
    contact: '+91 22 2305 5555'
};

// Dummy team resources
const TEAM_RESOURCES = [
    { id: 't1', name: 'Fire Engine #101', type: 'vehicle', status: 'available', personnel: 4 },
    { id: 't2', name: 'Fire Engine #102', type: 'vehicle', status: 'dispatched', personnel: 4 },
    { id: 't3', name: 'Rescue Unit #201', type: 'vehicle', status: 'available', personnel: 3 },
    { id: 't4', name: 'Water Tanker #301', type: 'vehicle', status: 'available', personnel: 2 },
    { id: 't5', name: 'Ambulance #401', type: 'medical', status: 'dispatched', personnel: 2 },
];

type TabType = 'incidents' | 'map' | 'resources' | 'logs';

export function AgencyDashboard({ onLogout, userId }: AgencyDashboardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('incidents');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [fieldNote, setFieldNote] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [refreshKey, setRefreshKey] = useState(0);

    // Fetch incidents
    useEffect(() => {
        async function loadIncidents() {
            setLoading(true);
            const { data } = await getIncidents();
            if (data) {
                // For demo: filter to show incidents that aren't resolved/false_report
                const activeIncidents = data.filter(i =>
                    ['open', 'dispatched', 'on_scene'].includes(i.status)
                );
                setIncidents(activeIncidents);
            }
            setLoading(false);
        }
        loadIncidents();
    }, [refreshKey]);

    const filteredIncidents = incidents.filter(i =>
        statusFilter === 'all' || i.status === statusFilter
    );

    const handleStatusUpdate = async (incidentId: string, newStatus: IncidentStatus) => {
        const { error } = await updateIncidentStatus(incidentId, newStatus, userId);
        if (!error) {
            setRefreshKey(k => k + 1);
            if (selectedIncident?.id === incidentId) {
                setSelectedIncident(prev => prev ? { ...prev, status: newStatus } : null);
            }
        }
    };

    const handleRefresh = () => {
        setRefreshKey(k => k + 1);
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'open': return { bg: 'bg-rose-100', text: 'text-rose-700', label: 'New Alert', icon: AlertTriangle };
            case 'dispatched': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Dispatched', icon: Truck };
            case 'on_scene': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'On Scene', icon: MapPin };
            case 'resolved': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Resolved', icon: CheckCircle };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600', label: status, icon: Activity };
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'fire': return <Flame className="w-5 h-5 text-orange-500" />;
            case 'medical': return <Plus className="w-5 h-5 text-rose-500" />;
            case 'crime': return <Shield className="w-5 h-5 text-slate-700" />;
            default: return <AlertTriangle className="w-5 h-5 text-amber-500" />;
        }
    };

    // Stats
    const stats = {
        total: incidents.length,
        open: incidents.filter(i => i.status === 'open').length,
        dispatched: incidents.filter(i => i.status === 'dispatched').length,
        onScene: incidents.filter(i => i.status === 'on_scene').length,
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-gradient-to-b from-violet-900 to-purple-900 text-white flex flex-col fixed h-full z-30 hidden lg:flex">
                {/* Agency Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/10 rounded-xl">
                            <Building2 className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">{AGENCY_INFO.name}</h1>
                            <p className="text-xs text-violet-300">{AGENCY_INFO.zone}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-violet-300">
                        <Phone className="w-3 h-3" />
                        <span>{AGENCY_INFO.contact}</span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="p-4 border-b border-white/10">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                            <span className="text-2xl font-bold text-rose-400">{stats.open}</span>
                            <p className="text-[10px] text-violet-300 uppercase">New Alerts</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                            <span className="text-2xl font-bold text-amber-400">{stats.dispatched}</span>
                            <p className="text-[10px] text-violet-300 uppercase">En Route</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                            <span className="text-2xl font-bold text-blue-400">{stats.onScene}</span>
                            <p className="text-[10px] text-violet-300 uppercase">On Scene</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                            <span className="text-2xl font-bold text-emerald-400">{stats.total}</span>
                            <p className="text-[10px] text-violet-300 uppercase">Total Active</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-violet-400 mb-3 font-bold">Operations</p>
                    <ul className="space-y-1">
                        {[
                            { id: 'incidents', label: 'Assigned Incidents', icon: Radio, badge: stats.total },
                            { id: 'map', label: 'Live Map', icon: MapPin },
                            { id: 'resources', label: 'Team Resources', icon: Truck },
                            { id: 'logs', label: 'Activity Logs', icon: FileText },
                        ].map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setActiveTab(item.id as TabType)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? 'bg-white text-violet-900 font-bold shadow-lg'
                                            : 'text-violet-200 hover:bg-white/10'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="flex-1 text-left">{item.label}</span>
                                        {item.badge && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-violet-100 text-violet-700' : 'bg-white/20'
                                                }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-violet-300 hover:bg-white/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72">
                {/* Top Header */}
                <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="lg:hidden p-2 bg-violet-100 rounded-xl">
                            <Building2 className="w-5 h-5 text-violet-600" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">
                            {activeTab === 'incidents' && 'Assigned Incidents'}
                            {activeTab === 'map' && 'Live Situation Map'}
                            {activeTab === 'resources' && 'Team Resources'}
                            {activeTab === 'logs' && 'Activity Logs'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 text-slate-600" />
                        </button>
                        <button className="relative p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                            <Bell className="w-4 h-4 text-slate-600" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-6">
                    {/* Incidents Tab */}
                    {activeTab === 'incidents' && (
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Incidents List */}
                            <div className="lg:col-span-2 space-y-4">
                                {/* Filters */}
                                <div className="flex items-center gap-3 mb-4">
                                    <Filter className="w-4 h-4 text-slate-400" />
                                    {['all', 'open', 'dispatched', 'on_scene'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${statusFilter === status
                                                ? 'bg-violet-600 text-white'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {status === 'all' ? 'All' : status.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>

                                {loading ? (
                                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                                        <div className="w-10 h-10 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-slate-400">Loading incidents...</p>
                                    </div>
                                ) : filteredIncidents.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                                        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                        <h3 className="font-bold text-slate-900 mb-2">All Clear!</h3>
                                        <p className="text-slate-500 text-sm">No active incidents requiring attention</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredIncidents.map(incident => {
                                            const statusConfig = getStatusConfig(incident.status);
                                            const StatusIcon = statusConfig.icon;
                                            const isSelected = selectedIncident?.id === incident.id;

                                            return (
                                                <button
                                                    key={incident.id}
                                                    onClick={() => setSelectedIncident(incident)}
                                                    className={`w-full text-left bg-white rounded-xl border-2 p-4 transition-all hover:shadow-md ${isSelected ? 'border-violet-500 shadow-lg' : 'border-slate-100'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-3 bg-slate-100 rounded-xl">
                                                            {getCategoryIcon(incident.category)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h3 className="font-bold text-slate-900 truncate">{incident.street_name}</h3>
                                                                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                                                                    <StatusIcon className="w-3 h-3" />
                                                                    {statusConfig.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-500 mb-2">{incident.city}</p>
                                                            {incident.description && (
                                                                <p className="text-sm text-slate-600 line-clamp-2">{incident.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(incident.created_at).toLocaleTimeString()}
                                                                </span>
                                                                <span className="capitalize">{incident.category}</span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-slate-300" />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Incident Detail Panel */}
                            <div className="lg:col-span-1">
                                {selectedIncident ? (
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm sticky top-24">
                                        {/* Header */}
                                        <div className="p-4 border-b border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusConfig(selectedIncident.status).bg} ${getStatusConfig(selectedIncident.status).text}`}>
                                                    {getStatusConfig(selectedIncident.status).label}
                                                </span>
                                                <button className="p-2 hover:bg-slate-100 rounded-lg">
                                                    <MoreVertical className="w-4 h-4 text-slate-400" />
                                                </button>
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-900">{selectedIncident.street_name}</h3>
                                            <p className="text-sm text-slate-500">{selectedIncident.city}</p>
                                        </div>

                                        {/* Details */}
                                        <div className="p-4 space-y-4">
                                            {selectedIncident.description && (
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Description</p>
                                                    <p className="text-sm text-slate-700">{selectedIncident.description}</p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-slate-50 rounded-xl p-3">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
                                                    <p className="text-sm font-bold text-slate-800 capitalize">{selectedIncident.category}</p>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl p-3">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Reported</p>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {new Date(selectedIncident.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Location */}
                                            <div className="bg-blue-50 rounded-xl p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MapPin className="w-4 h-4 text-blue-500" />
                                                    <span className="text-xs font-bold text-blue-700">Location</span>
                                                </div>
                                                <p className="text-xs text-blue-600">
                                                    {selectedIncident.latitude?.toFixed(4)}, {selectedIncident.longitude?.toFixed(4)}
                                                </p>
                                                <button className="mt-2 text-xs font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800">
                                                    <Navigation className="w-3 h-3" /> Get Directions
                                                </button>
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="p-4 border-t border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-3">Update Status</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {selectedIncident.status === 'open' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(selectedIncident.id, 'dispatched')}
                                                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors"
                                                    >
                                                        <Truck className="w-4 h-4" /> Dispatch
                                                    </button>
                                                )}
                                                {selectedIncident.status === 'dispatched' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(selectedIncident.id, 'on_scene')}
                                                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors"
                                                    >
                                                        <MapPin className="w-4 h-4" /> Arrived
                                                    </button>
                                                )}
                                                {(selectedIncident.status === 'dispatched' || selectedIncident.status === 'on_scene') && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(selectedIncident.id, 'resolved')}
                                                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors col-span-2"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Mark Resolved
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Field Notes */}
                                        <div className="p-4 border-t border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-3">Add Field Note</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={fieldNote}
                                                    onChange={(e) => setFieldNote(e.target.value)}
                                                    placeholder="Type note..."
                                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                                                />
                                                <button className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors">
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <button className="flex-1 flex items-center justify-center gap-1 p-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200">
                                                    <Camera className="w-3 h-3" /> Photo
                                                </button>
                                                <button className="flex-1 flex items-center justify-center gap-1 p-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200">
                                                    <MessageSquare className="w-3 h-3" /> Voice
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                                        <Eye className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <h3 className="font-bold text-slate-900 mb-1">Select an Incident</h3>
                                        <p className="text-sm text-slate-500">Click on an incident to view details and take action</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Map Tab */}
                    {activeTab === 'map' && (
                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden h-[calc(100vh-180px)]">
                            <CrisisMap viewType="agency" key={refreshKey} />
                        </div>
                    )}

                    {/* Resources Tab */}
                    {activeTab === 'resources' && (
                        <div className="space-y-6">
                            {/* Resource Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 bg-violet-100 rounded-lg">
                                            <Truck className="w-5 h-5 text-violet-600" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{TEAM_RESOURCES.length}</p>
                                    <p className="text-xs text-slate-500">Total Units</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-emerald-100 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {TEAM_RESOURCES.filter(r => r.status === 'available').length}
                                    </p>
                                    <p className="text-xs text-slate-500">Available</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-amber-100 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <Activity className="w-5 h-5 text-amber-600" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-amber-600">
                                        {TEAM_RESOURCES.filter(r => r.status === 'dispatched').length}
                                    </p>
                                    <p className="text-xs text-slate-500">Deployed</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-blue-100 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Users className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {TEAM_RESOURCES.reduce((sum, r) => sum + r.personnel, 0)}
                                    </p>
                                    <p className="text-xs text-slate-500">Personnel</p>
                                </div>
                            </div>

                            {/* Resource List */}
                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900">Team Units</h3>
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">DEMO DATA</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {TEAM_RESOURCES.map(resource => (
                                        <div key={resource.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-slate-100 rounded-xl">
                                                    <Truck className="w-5 h-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{resource.name}</p>
                                                    <p className="text-sm text-slate-500">{resource.personnel} personnel</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${resource.status === 'available'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {resource.status === 'available' ? 'Available' : 'Deployed'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logs Tab */}
                    {activeTab === 'logs' && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-8">
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="font-bold text-slate-900 mb-2">Activity Logs</h3>
                                <p className="text-slate-500 text-sm max-w-md mx-auto">
                                    Activity logs will appear here showing status updates, dispatch times, and field notes from your team.
                                </p>
                                <span className="inline-block mt-4 px-3 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                                    Coming Soon
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-40">
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { id: 'incidents', icon: Radio, label: 'Incidents' },
                        { id: 'map', icon: MapPin, label: 'Map' },
                        { id: 'resources', icon: Truck, label: 'Resources' },
                        { id: 'logs', icon: FileText, label: 'Logs' },
                    ].map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as TabType)}
                                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${isActive ? 'text-violet-600' : 'text-slate-400'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] font-bold">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
