import React, { useState, useEffect } from 'react';
import {
    Bell, BarChart3, FileText, LogOut, User, X, ShieldCheck,
    LayoutDashboard, Map as MapIcon, ChevronRight, Megaphone,
    Search, Truck, Users, AlertTriangle, Download, Settings,
    Filter, Calendar, MoreVertical, Fuel, Gauge, Siren, Radio, Box
} from 'lucide-react';
import { AnalyticsCards } from './AnalyticsCards';
import { CrisisMap } from './CrisisMap';
import { ReportsTable } from './ReportsTable'; // Will reuse for now, maybe rename later
import { signOutAdmin } from '../db/admin';
import { getRecentNotifications, subscribeToNewReports } from '../db/notifications';
import { getAnalyticsOverview } from '../db/analytics';
import { MAHARASHTRA_ZONES, getDistrictsForZone } from '../utils/cityZones';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { ExportDialog } from './ExportDialog';
import type { Database } from '../utils/supabase/client';
import { ResourceManagementView } from './dashboard-views/ResourceManagementView';
import { CoordinatorAnalyticsSection } from './dashboard-views/CoordinatorAnalyticsSection';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface CoordinatorDashboardProps {
    onLogout: () => void;
    userId: string;
}

type Tab = 'dashboard' | 'reports' | 'map' | 'resources' | 'settings';

export function CoordinatorDashboard({ onLogout, userId }: CoordinatorDashboardProps) {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [showNotifications, setShowNotifications] = useState(false);
    const [reportFilter, setReportFilter] = useState<string>('all');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [globalZone, setGlobalZone] = useState('all');
    const [globalDistrict, setGlobalDistrict] = useState('all');
    const [districts, setDistricts] = useState<string[]>([]);
    const [showExport, setShowExport] = useState(false);
    const zones = Object.values(MAHARASHTRA_ZONES);

    useEffect(() => {
        if (globalZone !== 'all') {
            setDistricts(getDistrictsForZone(globalZone));
        } else {
            setDistricts([]);
        }
        setGlobalDistrict('all');
    }, [globalZone]);

    useEffect(() => {
        fetchNotifications();
        const unsubscribe = subscribeToNewReports((payload) => {
            fetchNotifications();
            setRefreshKey(prev => prev + 1);
        });
        return () => unsubscribe();
    }, []);

    const fetchNotifications = async () => {
        const { data } = await getRecentNotifications(10);
        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    const handleCardClick = (filter: string) => {
        setReportFilter(filter);
        setActiveTab('reports');
    };

    const handleLogout = async () => {
        const { success } = await signOutAdmin();
        if (success) onLogout();
    };

    const handleExport = async (format: 'csv' | 'pdf') => {
        const { data } = await getAnalyticsOverview({
            zone: globalZone === 'all' ? undefined : globalZone,
            district: globalDistrict === 'all' ? undefined : globalDistrict
        });
        if (!data) return;
        const exportData = [{ 'Total Incidents': data.totalIncidents, 'Zone': globalZone, 'Date': new Date().toLocaleDateString() }];
        if (format === 'csv') exportToCSV(exportData, 'dashboard_summary');
        else exportToPDF(exportData, ['Total Incidents', 'Zone'], 'Dashboard Summary');
        setShowExport(false);
    };

    const DesktopNavItem = ({ view, icon: Icon, label }: { view: Tab, icon: any, label: string }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium relative overflow-hidden ${activeTab === view
                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            {activeTab === view && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-xl" />}
            <Icon className={`w-5 h-5 transition-colors ${activeTab === view ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <span>{label}</span>
            {activeTab === view && <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />}
        </button>
    );

    return (
        <div className="h-[100dvh] w-full bg-slate-50 flex font-sans text-slate-800 selection:bg-blue-100 overflow-hidden">
            <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 fixed h-full z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-6">
                    <div className="flex items-center gap-3 text-blue-700 font-bold text-xl tracking-tight">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="block leading-none">Agency</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Command Center</span>
                        </div>
                    </div>
                </div>

                <div className="px-4 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Operations</div>
                    <DesktopNavItem view="dashboard" icon={LayoutDashboard} label="Command Center" />
                    <DesktopNavItem view="reports" icon={FileText} label="Incidents" />
                    <DesktopNavItem view="map" icon={MapIcon} label="Surveillance" />
                    <DesktopNavItem view="resources" icon={Box} label="Resources" />
                    <DesktopNavItem view="settings" icon={Settings} label="Settings" />
                </div>

                <div className="p-4 mt-auto">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-sm font-bold">
                        <LogOut className="w-4 h-4" /> <span>Secure Logout</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 lg:pl-72 flex flex-col h-full relative w-full max-w-full bg-slate-50/50">
                <header className="sticky top-0 z-20 px-4 md:px-8 py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex justify-between items-center transition-all shrink-0 h-16">
                    <div className="hidden md:flex items-center flex-1 max-w-md bg-slate-100/50 hover:bg-white transition-colors border border-slate-200 rounded-xl px-4 py-2 mr-8">
                        <Search className="w-4 h-4 text-slate-400 mr-2" />
                        <input type="text" placeholder="Search incidents..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 text-slate-800" />
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 shrink-0 ml-auto">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`relative p-2.5 rounded-full border transition-all ${showNotifications ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>}
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative z-0 pb-24 lg:pb-8 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {activeTab === 'dashboard' && (
                            <div className="space-y-6">
                                <AnalyticsCards onCardClick={handleCardClick} refreshKey={refreshKey} filters={{ zone: globalZone === 'all' ? undefined : globalZone, district: globalDistrict === 'all' ? undefined : globalDistrict }} />
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1 h-[500px] flex flex-col">
                                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                        <h2 className="font-bold flex items-center gap-2"><MapIcon className="w-5 h-5 text-blue-500" /> Live Situation Map</h2>
                                    </div>
                                    <div className="flex-1 rounded-xl overflow-hidden relative">
                                        <CrisisMap viewType="agency" key={refreshKey} zone={globalZone} district={globalDistrict} />
                                    </div>
                                </div>

                                {/* Analytics Section with Charts */}
                                <CoordinatorAnalyticsSection
                                    zone={globalZone}
                                    district={globalDistrict}
                                    refreshKey={refreshKey}
                                />
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-lg font-bold">Incident Log</h2>
                                </div>
                                <div className="flex-1">
                                    <ReportsTable initialFilter={reportFilter} onFilterChange={setReportFilter} key={refreshKey} externalZone={globalZone === 'all' ? undefined : globalZone} externalDistrict={globalDistrict === 'all' ? undefined : globalDistrict} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'map' && (
                            <div className="h-[80vh] rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white relative">
                                <CrisisMap viewType="agency" key={refreshKey} />
                            </div>
                        )}

                        {activeTab === 'resources' && (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                                <ResourceManagementView />
                            </div>
                        )}
                    </div>
                </div>

                {showNotifications && (
                    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-end" onClick={() => setShowNotifications(false)}>
                        <div className="w-full max-w-sm h-full bg-white shadow-2xl p-4">
                            <h3 className="font-bold text-lg mb-4">Notifications</h3>
                            <div className="space-y-2">
                                {notifications.map(n => (
                                    <div key={n.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <p className="text-sm font-medium">{n.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </main>
            <ExportDialog isOpen={showExport} onClose={() => setShowExport(false)} onExport={handleExport} title="Export Summary" />
        </div>
    );
}
