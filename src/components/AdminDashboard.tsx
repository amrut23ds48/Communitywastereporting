import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BarChart3, 
  FileText, 
  LogOut, 
  User, 
  X, 
  ShieldCheck, 
  LayoutDashboard 
} from 'lucide-react';
import { AnalyticsCards } from './AnalyticsCards';
import { WasteMap } from './WasteMap';
import { ReportsTable } from './ReportsTable';
import { MonthlyInsights } from './MonthlyInsights';
import { StreetIndicators } from './StreetIndicators';
import { signOutAdmin } from '../db/admin';
import { getRecentNotifications, subscribeToNewReports } from '../db/notifications';
import type { Database } from '../utils/supabase/client';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface AdminDashboardProps {
  onLogout: () => void;
}

type Tab = 'dashboard' | 'reports';

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchNotifications();
    
    const unsubscribe = subscribeToNewReports((payload) => {
      console.log('New report detected:', payload);
      fetchNotifications();
      setRefreshKey(prev => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await getRecentNotifications(10);
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
    if (success) {
      onLogout();
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h ago`;
    return `${Math.floor(diffInMinutes / 1440)} d ago`;
  };

  return (
    // Main Container with Grid Background
    <div className="min-h-screen bg-gray-50 relative selection:bg-blue-100 selection:text-blue-900">
      {/* CSS Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-30 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-none">Admin Panel</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Waste Management System</p>
              </div>
            </div>
            
            {/* Navigation Tabs (Centered or beside logo depending on pref, here separated for cleaner layout) */}
            <div className="hidden md:flex items-center p-1 bg-gray-100/50 rounded-xl border border-gray-200/50">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'reports'
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Reports
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-5">
              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2.5 rounded-full transition-all duration-200 ${
                  showNotifications ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>
              
              <div className="h-8 w-px bg-gray-200"></div>

              {/* Profile Dropdown Trigger */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">Administrator</p>
                  <button 
                    onClick={handleLogout}
                    className="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors flex items-center justify-end gap-1 ml-auto"
                  >
                    Logout
                  </button>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border border-gray-200 shadow-inner">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Floating Panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)}>
          <div className="max-w-7xl mx-auto px-6 relative h-full pointer-events-none">
            <div 
              className="absolute right-6 top-20 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 pointer-events-auto transform transition-all duration-200 origin-top-right overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-gray-200/50 rounded-full transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <Bell className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">All caught up!</p>
                    <p className="text-xs text-gray-500">No new notifications to show.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50/80 transition-colors cursor-pointer group ${
                          !notification.is_read ? 'bg-blue-50/40 border-l-2 border-blue-500' : 'border-l-2 border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <p className={`text-sm leading-snug ${!notification.is_read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded">
                            {formatNotificationTime(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-0">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <AnalyticsCards onCardClick={handleCardClick} refreshKey={refreshKey} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="text-lg font-semibold text-gray-900">Live Waste Density</h2>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium animate-pulse">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Real-time updates
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-gray-100">
                      <WasteMap viewType="admin" key={refreshKey} />
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-1">
                  <StreetIndicators key={refreshKey} />
                </div>
              </div>

              <MonthlyInsights key={refreshKey} />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                 <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                   <FileText className="w-5 h-5 text-blue-600" />
                   All Reports
                 </h2>
                 <p className="text-sm text-gray-500 mt-1">Manage and track waste reports submitted by users.</p>
               </div>
              <ReportsTable initialFilter={reportFilter} onFilterChange={setReportFilter} key={refreshKey} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}