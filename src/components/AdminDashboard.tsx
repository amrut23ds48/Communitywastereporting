import React, { useState, useEffect } from 'react';
import { Bell, BarChart3, FileText, LogOut, User, X } from 'lucide-react';
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
    
    // Subscribe to new reports
    const unsubscribe = subscribeToNewReports((payload) => {
      console.log('New report detected:', payload);
      // Refresh notifications
      fetchNotifications();
      // Trigger refresh of dashboard data
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
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl text-gray-900">Admin Dashboard</h1>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] text-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-6 mt-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-400 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'reports'
                  ? 'border-blue-400 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reports
              </div>
            </button>
          </nav>
        </div>
      </header>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="max-w-7xl mx-auto px-6 mt-2">
          <div className="absolute right-6 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-30">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-gray-900">Notifications</h3>
              <button onClick={() => setShowNotifications(false)}>
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatNotificationTime(notification.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <AnalyticsCards onCardClick={handleCardClick} refreshKey={refreshKey} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl text-gray-900">Waste Density Heatmap</h2>
                    <div className="text-sm text-gray-500">Real-time view</div>
                  </div>
                  <WasteMap viewType="admin" key={refreshKey} />
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
          <div>
            <ReportsTable initialFilter={reportFilter} onFilterChange={setReportFilter} key={refreshKey} />
          </div>
        )}
      </main>
    </div>
  );
}