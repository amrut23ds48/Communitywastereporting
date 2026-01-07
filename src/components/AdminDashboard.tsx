import React, { useState, useEffect } from 'react';
import {
  Bell, BarChart3, FileText, LogOut, User, X, ShieldCheck,
  LayoutDashboard, Map as MapIcon, ChevronRight, Megaphone,
  Search, Truck, Users, AlertTriangle, Download, Settings,
  Filter, Calendar, MoreVertical, Fuel, Gauge
} from 'lucide-react';
import { AnalyticsCards } from './AnalyticsCards';
import { WasteMap } from './WasteMap';
import { ReportsTable } from './ReportsTable';
import { MonthlyInsights } from './MonthlyInsights';
import { StreetIndicators } from './StreetIndicators';
import { WasteCompositionWidget } from './WasteCompositionWidget';
import { signOutAdmin } from '../db/admin';
import { getRecentNotifications, subscribeToNewReports } from '../db/notifications';
import { getCompositionAndStatus, WasteCompositionSlice } from '../db/analytics';
import { MAHARASHTRA_ZONES, getDistrictsForZone } from '../utils/cityZones';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { ExportDialog } from './ExportDialog';
import { getAnalyticsOverview } from '../db/analytics';
import type { Database } from '../utils/supabase/client';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface AdminDashboardProps {
  onLogout: () => void;
  userId: string;
}

type Tab = 'dashboard' | 'reports' | 'map' | 'fleet' | 'settings';

// --- SUB-COMPONENTS (Internal for easy copying) ---

const FleetWidget = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        <Truck className="w-5 h-5 text-blue-600" />
        Live Fleet Status
      </h3>
      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        8 Active
      </span>
    </div>

    <div className="space-y-4">
      {[
        { id: 'T-104', location: 'Sector 4, Main Rd', status: 'Moving', fuel: 78, driver: 'R. Singh' },
        { id: 'T-109', location: 'Green Park Zone', status: 'Loading', fuel: 45, driver: 'M. Khan' },
        { id: 'T-202', location: 'City Center', status: 'Idle', fuel: 92, driver: 'S. Patil' },
      ].map((truck, i) => (
        <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${truck.status === 'Moving' ? 'bg-blue-100 text-blue-600' :
              truck.status === 'Loading' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
              }`}>
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{truck.id} <span className="font-normal text-gray-500">• {truck.driver}</span></p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapIcon className="w-3 h-3" /> {truck.location}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs font-medium text-gray-600 mb-1">
              <Fuel className="w-3 h-3 text-gray-400" /> {truck.fuel}%
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ${truck.status === 'Moving' ? 'bg-blue-50 text-blue-700' :
              truck.status === 'Loading' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
              }`}>
              {truck.status}
            </span>
          </div>
        </div>
      ))}
    </div>
    <button className="w-full mt-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-dashed border-blue-200">
      View All 12 Vehicles
    </button>
  </div>
);

// --- MAIN DASHBOARD COMPONENT ---

export function AdminDashboard({ onLogout, userId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Global Filter State
  const [globalZone, setGlobalZone] = useState('all');
  const [globalDistrict, setGlobalDistrict] = useState('all');
  const [districts, setDistricts] = useState<string[]>([]);
  const [showExport, setShowExport] = useState(false);

  // Zones list
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
      console.log('New report detected:', payload);
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

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    return `${Math.floor(diffInMinutes / 60)} h ago`;
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    // For dashboard export, we'll export the high-level metrics
    const { data } = await getAnalyticsOverview({
      zone: globalZone === 'all' ? undefined : globalZone,
      district: globalDistrict === 'all' ? undefined : globalDistrict
    });

    if (!data) return;

    const exportData = [{
      'Total Reports': data.totalReports,
      'Open Reports': data.openReports,
      'In Progress': data.inProgressReports,
      'Resolved': data.resolvedReports,
      'False Reports': data.falseReports,
      'This Month Total': data.thisMonthTotal,
      'Zone': globalZone,
      'District': globalDistrict,
      'Export Date': new Date().toLocaleDateString()
    }];

    if (format === 'csv') {
      exportToCSV(exportData, 'dashboard_summary');
    } else {
      exportToPDF(
        exportData,
        ['Total Reports', 'Open Reports', 'In Progress', 'Resolved', 'This Month Total', 'Zone', 'District'],
        'Dashboard Analytics Summary'
      );
    }
    setShowExport(false);
  };

  // --- NAVIGATION HELPERS ---

  const DesktopNavItem = ({ view, icon: Icon, label }: { view: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(view)}
      className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium relative overflow-hidden ${activeTab === view
        ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      {activeTab === view && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-xl" />}
      <Icon className={`w-5 h-5 transition-colors ${activeTab === view ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
      <span>{label}</span>
      {activeTab === view && <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />}
    </button>
  );

  const MobileNavItem = ({ view, icon: Icon, label }: { view: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(view)}
      className={`flex flex-col items-center justify-center w-full h-full transition-colors relative z-10 ${activeTab === view ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
        }`}
    >
      <div className={`p-1 rounded-xl mb-0.5 transition-all duration-300 ${activeTab === view ? 'bg-blue-50 -translate-y-1' : ''}`}>
        <Icon className={`w-5 h-5 ${activeTab === view ? 'fill-blue-600' : ''}`} />
      </div>
      <span className={`text-[10px] font-medium transition-opacity ${activeTab === view ? 'opacity-100 font-bold' : 'opacity-80'}`}>{label}</span>
    </button>
  );

  return (
    <div className="h-[100dvh] w-full bg-gray-50 flex font-sans text-gray-800 selection:bg-blue-100 overflow-hidden">

      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-gray-200 fixed h-full z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6">
          <div className="flex items-center gap-3 text-blue-700 font-bold text-xl tracking-tight">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="block leading-none">Admin Panel</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Waste Mgmt v2.0</span>
            </div>
          </div>
        </div>

        <div className="px-4 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Operations</div>
          <DesktopNavItem view="dashboard" icon={LayoutDashboard} label="Command Center" />
          <DesktopNavItem view="reports" icon={FileText} label="Incident Reports" />
          <DesktopNavItem view="map" icon={MapIcon} label="Live Surveillance" />

          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">System</div>
          <DesktopNavItem view="settings" icon={Settings} label="Global Settings" />
        </div>

        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 border border-gray-100 mb-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Administrator</p>
                <p className="text-xs text-gray-500">Super Admin Access</p>
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-sm font-bold">
            <LogOut className="w-4 h-4" /> <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 lg:pl-72 flex flex-col h-full relative w-full max-w-full bg-slate-50/50">

        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        {/* Top Header & Search */}
        <header className="sticky top-0 z-20 px-4 md:px-8 py-3 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex justify-between items-center transition-all shrink-0 h-16">
          {/* Mobile Menu Trigger (Visual only) */}
          <div className="lg:hidden p-2 -ml-2 text-gray-600"><div className="w-6 h-6"><ShieldCheck /></div></div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md bg-gray-100/50 hover:bg-white transition-colors border border-gray-200 rounded-xl px-4 py-2 mr-8 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input type="text" placeholder="Search reports, truck IDs, or locations..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 text-gray-800" />
            <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">⌘K</span>
          </div>

          {/* GLOBAL FILTER BAR */}
          <div className="hidden md:flex items-center gap-3 mr-4">
            {/* Zone Filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Fuel className="h-4 w-4 text-indigo-500" />
              </div>
              <select
                value={globalZone}
                onChange={(e) => setGlobalZone(e.target.value)}
                className="pl-9 pr-8 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer hover:bg-indigo-100 transition-colors shadow-sm"
              >
                <option value="all">All Zones</option>
                {zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <ChevronRight className="absolute right-2 top-2.5 w-4 h-4 text-indigo-400 pointer-events-none rotate-90" />
            </div>

            {/* District Filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapIcon className="h-4 w-4 text-slate-500" />
              </div>
              <select
                disabled={globalZone === 'all'}
                value={globalDistrict}
                onChange={(e) => setGlobalDistrict(e.target.value)}
                className={`pl-9 pr-8 py-2 text-sm font-bold rounded-xl outline-none appearance-none border shadow-sm transition-all
                    ${globalZone === 'all'
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-700 cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
              >
                <option value="all">All Districts</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronRight className={`absolute right-2 top-2.5 w-4 h-4 pointer-events-none rotate-90 ${globalZone === 'all' ? 'text-slate-300' : 'text-slate-500'}`} />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            {/* Quick Action Button */}
            <button
              onClick={() => setShowExport(true)}
              className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" /> Export Data
            </button>

            <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-full border transition-all ${showNotifications ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative z-0 pb-24 lg:pb-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Top Level Metrics */}
                <AnalyticsCards
                  onCardClick={handleCardClick}
                  refreshKey={refreshKey}
                  filters={{
                    zone: globalZone === 'all' ? undefined : globalZone,
                    district: globalDistrict === 'all' ? undefined : globalDistrict,
                  }}
                />

                {/* Main Grid: Map + Fleet + Indicators */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* Map Section (Wider) */}
                  <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 h-[450px] flex flex-col">
                      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/30 rounded-t-2xl">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Live Surveillance Map</h2>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 font-medium hover:bg-gray-50">Filter Layers</button>
                          <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm hover:bg-blue-700">Full Screen</button>
                        </div>
                      </div>
                      <div className="flex-1 rounded-xl overflow-hidden relative">
                        <WasteMap
                          viewType="admin"
                          key={refreshKey}
                          zone={globalZone}
                          district={globalDistrict}
                        />

                        {/* Floating Map Legend */}
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-gray-200 shadow-lg text-xs space-y-1">
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical (High Priority)</div>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Warning (Overflow)</div>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Active Truck</div>
                        </div>
                      </div>
                    </div>

                    {/* Wide Bottom Widget */}
                    <MonthlyInsights key={refreshKey} zone={globalZone} district={globalDistrict} />
                  </div>

                  {/* Right Column: Fleet & Composition */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="h-[340px]">
                      <FleetWidget />
                    </div>
                    <div className="h-[300px]">
                      <WasteCompositionWidget zone={globalZone} district={globalDistrict} />
                    </div>
                    <div>
                      <StreetIndicators key={refreshKey} zone={globalZone} district={globalDistrict} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Incident Management
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Real-time feed of citizen reports.</p>
                  </div>
                </div>
                <div className="flex-1">
                  <ReportsTable
                    initialFilter={reportFilter}
                    onFilterChange={setReportFilter}
                    key={refreshKey}
                    externalZone={globalZone === 'all' ? undefined : globalZone}
                    externalDistrict={globalDistrict === 'all' ? undefined : globalDistrict}
                  />
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div className="h-[80vh] rounded-3xl overflow-hidden border border-gray-200 shadow-xl bg-white relative">
                <WasteMap
                  viewType="admin"
                  key={refreshKey}
                  zone={globalZone}
                  district={globalDistrict}
                />
                <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg border border-gray-200 flex flex-col gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-md" title="Zoom In">+</button>
                  <button className="p-2 hover:bg-gray-100 rounded-md" title="Zoom Out">-</button>
                  <button className="p-2 hover:bg-gray-100 rounded-md text-blue-600" title="Locate Me"><MapIcon className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            {activeTab === 'fleet' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FleetWidget />
                <FleetWidget /> {/* Duplicated for visual volume in demo */}
                <div className="bg-blue-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Fleet Analytics</h3>
                    <p className="text-blue-200 text-sm">Optimal routes calculated. Savings of 15% fuel this month.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-blue-800/50 p-3 rounded-xl">
                      <span className="text-sm font-medium">Active Trucks</span>
                      <span className="text-2xl font-bold">24</span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-800/50 p-3 rounded-xl">
                      <span className="text-sm font-medium">Avg Response</span>
                      <span className="text-2xl font-bold">12m</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 flex justify-between items-end h-[4.5rem] pb-[env(safe-area-inset-bottom)]">
          <MobileNavItem view="dashboard" icon={LayoutDashboard} label="Home" />
          <MobileNavItem view="reports" icon={FileText} label="Reports" />
          <MobileNavItem view="map" icon={MapIcon} label="Map" />
          <MobileNavItem view="settings" icon={Users} label="Profile" />
        </div>

        {/* Notifications Modal */}
        {showNotifications && (
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-end" onClick={() => setShowNotifications(false)}>
            <div
              className="w-full max-w-sm h-[100dvh] bg-white shadow-2xl animate-in slide-in-from-right duration-300"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg text-gray-900">Notifications</h3>
                </div>
                <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-gray-200 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="overflow-y-auto h-[calc(100vh-64px)] p-2">
                {notifications.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    <Bell className="w-12 h-12 mb-2 opacity-20" />
                    <p>No new alerts</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-4 rounded-xl border transition-colors ${!n.is_read ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                        <div className="flex gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <p className="text-sm text-gray-900 font-medium leading-snug mb-1">{n.message}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              {formatNotificationTime(n.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExport={handleExport}
        title="Export Dashboard Summary"
      />
    </div>
  );
}
