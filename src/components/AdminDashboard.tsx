import React, { useState, useEffect } from 'react';
import { 
  Bell, BarChart3, FileText, LogOut, User, X, 
  RefreshCw, Settings, Home, Shield, Leaf, Menu, 
  ChevronDown, Cloud, Activity
} from 'lucide-react';
import { AnalyticsCards } from './AnalyticsCards';
import { WasteMap } from './WasteMap';
import { ReportsTable } from './ReportsTable';
import { MonthlyInsights } from './MonthlyInsights';
import { StreetIndicators } from './StreetIndicators';
import { signOutAdmin } from '../db/admin';
import { getRecentNotifications, subscribeToNewReports } from '../db/notifications';
import { generateMonthlyData, generateWeeklyData, dummyReportLocations } from '../utils/dummyData';
import type { Database } from '../utils/supabase/client';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface AdminDashboardProps {
  onLogout: () => void;
}

type Tab = 'dashboard' | 'reports' | 'analytics' | 'settings';

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Background grid effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .grid-bg {
        background-size: 60px 60px;
        background-image: 
          linear-gradient(to right, rgba(34, 197, 94, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(34, 197, 94, 0.03) 1px, transparent 1px);
        background-attachment: fixed;
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      
      .floating {
        animation: float 6s ease-in-out infinite;
      }
      
      .glass-panel {
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 
          0 8px 32px rgba(16, 185, 129, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.6);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-emerald-500' },
    { id: 'reports', label: 'Reports', icon: FileText, color: 'text-blue-500' },
    { id: 'analytics', label: 'Analytics', icon: Activity, color: 'text-purple-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-amber-500' },
  ];

  return (
    <div className="min-h-screen grid-bg bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      {/* Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 floating" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full glass-panel z-50 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="p-6 border-b border-emerald-100">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
                    EcoTrack
                  </h1>
                  <p className="text-xs text-emerald-600 font-medium">Waste Management</p>
                </div>
              </div>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-emerald-600" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 shadow-sm'
                  : 'hover:bg-emerald-50 hover:translate-x-1'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              {!sidebarCollapsed && (
                <span className="font-medium text-gray-700">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="absolute bottom-0 w-full p-6 border-t border-emerald-100">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-bold">Admin Zone</span>
              </div>
              <p className="text-xs opacity-90">Full system control enabled</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* Header */}
        <header className="glass-panel sticky top-0 z-40 border-b border-emerald-100">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'dashboard' ? 'EcoTrack Dashboard' : 
                   activeTab === 'reports' ? 'Report Management' : 
                   activeTab === 'analytics' ? 'Advanced Analytics' : 'System Settings'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Live System</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-emerald-300"></div>
                  <span className="text-xs text-gray-500">Last updated just now</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all hover:scale-105"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2.5 hover:bg-emerald-50 rounded-xl transition-colors"
                  >
                    <Bell className="w-5 h-5 text-gray-700" />
                    {unreadCount > 0 && (
                      <>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                      </>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 glass-panel rounded-xl shadow-2xl border border-emerald-100 z-50">
                      <div className="p-4 border-b border-emerald-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-gray-900 font-bold">Notifications</h3>
                          <p className="text-xs text-emerald-600">{unreadCount} unread</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={fetchNotifications}
                            className="p-1 hover:bg-emerald-50 rounded-lg"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button onClick={() => setShowNotifications(false)}>
                            <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
                            <p className="text-gray-500">All caught up!</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-emerald-50 last:border-0 hover:bg-emerald-50/50 transition-colors ${
                                !notification.is_read ? 'bg-blue-50/30' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg ${
                                  'bg-emerald-100 text-emerald-600'
                                }`}>
                                  <Activity className="w-3 h-3" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">{notification.message}</p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-emerald-600 font-medium">
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {formatNotificationTime(notification.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-3 pl-3 border-l border-emerald-100 hover:bg-emerald-50 rounded-xl p-2 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    {!sidebarCollapsed && (
                      <>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">Admin User</p>
                          <p className="text-xs text-emerald-600">System Administrator</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
                          userMenuOpen ? 'rotate-180' : ''
                        }`} />
                      </>
                    )}
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl border border-emerald-100 z-50">
                      <div className="p-4 border-b border-emerald-100">
                        <p className="text-sm font-medium text-gray-900">admin@ecotrack.com</p>
                        <p className="text-xs text-emerald-600">Super Admin</p>
                      </div>
                      <div className="p-2">
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50 rounded-lg text-gray-700 transition-colors">
                          <Settings className="w-4 h-4" />
                          <span>Account Settings</span>
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg text-red-600 transition-colors mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <AnalyticsCards onCardClick={handleCardClick} refreshKey={refreshKey} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="glass-panel rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Geospatial Waste Distribution</h2>
                        <p className="text-sm text-emerald-600">Live heatmap of waste accumulation</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-emerald-700">Live</span>
                      </div>
                    </div>
                    <WasteMap viewType="admin" key={refreshKey} />
                  </div>
                </div>
                
                <div>
                  <StreetIndicators key={refreshKey} />
                </div>
              </div>

              <MonthlyInsights key={refreshKey} />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Report Management</h2>
                    <p className="text-emerald-600">Monitor and manage waste reports</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-emerald-50 rounded-xl">
                      <span className="text-sm font-medium text-emerald-700">Filter: {reportFilter}</span>
                    </div>
                  </div>
                </div>
                <ReportsTable initialFilter={reportFilter} onFilterChange={setReportFilter} key={refreshKey} />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="glass-panel rounded-2xl p-6">
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Activity className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Analytics</h2>
                <p className="text-gray-600">Coming soon - Advanced predictive analytics and AI insights</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="glass-panel rounded-2xl p-6">
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Settings className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">System Settings</h2>
                <p className="text-gray-600">Configure system preferences and administration settings</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}