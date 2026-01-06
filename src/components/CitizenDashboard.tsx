import React, { useState } from 'react';
import {
  LayoutDashboard, Map as MapIcon, Camera, Trophy, History,
  LogOut, Bell, ChevronRight, Star, Leaf, User, MegaphoneIcon,
  Newspaper, Megaphone, Zap,
} from 'lucide-react';

import { OverviewView } from './dashboard-views/OverviewView';
import { ReportWasteView } from './dashboard-views/ReportWasteView';
import { LeaderboardView } from './dashboard-views/LeaderboardView';
import { HistoryView } from './dashboard-views/HistoryView';
import { NewsView } from './dashboard-views/NewsView';
import { WasteMap } from './WasteMap';

interface CitizenDashboardProps {
  onLogout: () => void;
  userId: string;
}

type ViewState = 'overview' | 'report' | 'map' | 'leaderboard' | 'history' | 'news';

export function CitizenDashboard({ onLogout, userId }: CitizenDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewState>('overview');
  const [userProfile] = useState({
    name: "Rahul Sharma",
    rank: "Eco Warrior",
    points: 1250,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul"
  });

  const headlines = [
    "🚀 Cleanliness Drive at Juhu Beach this Sunday!",
    "📢 New Policy: Fine for mixing wet/dry waste increased to ₹500.",
    "🏆 'Sector 7 Heroes' win Monthly Award!",
    "🌧️ Heavy rain alert: Keep drains clear."
  ];

  // --- Components ---

  const DesktopNavItem = ({ view, icon: Icon, label, badge }: { view: ViewState, icon: any, label: string, badge?: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium relative overflow-hidden ${currentView === view
        ? 'bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      {currentView === view && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl" />
      )}
      <Icon className={`w-5 h-5 transition-colors ${currentView === view ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
      <span>{label}</span>
      {badge && (
        <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-sm shadow-rose-200">
          {badge}
        </span>
      )}
      {currentView === view && <ChevronRight className="w-4 h-4 ml-auto text-emerald-400" />}
    </button>
  );

  const MobileNavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center w-full h-full transition-colors relative z-10 ${currentView === view ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
        }`}
    >
      <div className={`p-1 rounded-xl mb-0.5 transition-all duration-300 ${currentView === view ? 'bg-emerald-50 -translate-y-1' : ''}`}>
        <Icon className={`w-5 h-5 ${currentView === view ? 'fill-emerald-600' : ''}`} />
      </div>
      <span className={`text-[10px] font-medium transition-opacity ${currentView === view ? 'opacity-100 font-bold' : 'opacity-80'}`}>{label}</span>
    </button>
  );

  return (
    // FIX 1: max-w-[100vw] prevents horizontal scroll on mobile
    <div className="h-[100dvh] w-full bg-gray-50 flex font-sans text-gray-800 selection:bg-emerald-100 overflow-hidden">

      {/* --- SIDEBAR (Desktop Only) --- */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-gray-200 fixed h-full z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6">
          <div className="flex items-center gap-3 text-emerald-700 font-bold text-xl tracking-tight">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Leaf className="w-6 h-6 fill-white" />
            </div>
            <span>SwachhFlow</span>
          </div>
        </div>

        <div className="px-4 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Main Menu</div>
          <DesktopNavItem view="overview" icon={LayoutDashboard} label="Overview" />
          <DesktopNavItem view="report" icon={Camera} label="Report Waste" />
          <DesktopNavItem view="map" icon={MapIcon} label="Live Map" />

          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Community</div>
          <DesktopNavItem view="leaderboard" icon={Trophy} label="Leaderboard" />
          <DesktopNavItem view="news" icon={Newspaper} label="News & Events" badge="New" />
          <DesktopNavItem view="history" icon={History} label="My Activity" />
        </div>

        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <div className="flex items-center gap-2 mb-2 text-emerald-300 font-bold text-xs uppercase tracking-wide">
              <Zap className="w-3 h-3" /> Daily Tip
            </div>
            <p className="text-sm font-medium text-gray-200 leading-snug">
              Rinse plastic containers before recycling to prevent contamination.
            </p>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN LAYOUT --- */}
      <main className="flex-1 lg:pl-72 flex flex-col h-full relative w-full max-w-full">

        {/* GLOBAL BACKGROUND GRID */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-gray-50">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        {/* --- TICKER BAR --- */}
        {/* FIX 2: min-w-0 on the text container prevents flex items from forcing width beyond viewport */}
        <div className="bg-emerald-900 text-emerald-50 text-[10px] md:text-sm py-2 px-3 md:px-4 flex items-center shadow-md relative z-20 border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-1.5 md:gap-2 bg-emerald-800/80 backdrop-blur-sm px-2 md:px-3 py-0.5 rounded-md mr-2 md:mr-4 z-20 font-bold uppercase tracking-wider shrink-0 border border-emerald-700/50 shadow-inner">
            <Megaphone className="w-3 h-3 animate-pulse text-emerald-300" />
            <span>Updates</span>
          </div>
          <div className="overflow-hidden relative flex-1 min-w-0 mask-gradient-x">
            <style>{`
                @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
                .animate-marquee { animation: marquee 30s linear infinite; white-space: nowrap; display: inline-block; }
             `}</style>
            <div className="animate-marquee cursor-default">
              {headlines.map((h, i) => <span key={i} className="mx-4 md:mx-8 opacity-90 hover:opacity-100 transition-opacity">• {h}</span>)}
            </div>
          </div>
        </div>

        {/* --- STICKY HEADER --- */}
        <header className="sticky top-0 z-10 px-4 md:px-8 py-3 md:py-4 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex justify-between items-center transition-all shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Leaf className="w-5 h-5 fill-white" />
            </div>

            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2 truncate">
                {currentView === 'overview' && 'Dashboard'}
                {currentView === 'report' && 'Report Waste'}
                {currentView === 'map' && 'Live Map'}
                {currentView === 'leaderboard' && 'Leaderboard'}
                {currentView === 'history' && 'History'}
                {currentView === 'news' && 'News & Events'}
              </h1>
              <p className="hidden md:block text-gray-500 text-xs font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-5 shrink-0">
            <div className="flex items-center gap-1.5 md:gap-2 bg-amber-50 px-2 md:px-3 py-1 rounded-full border border-amber-100 text-amber-700 text-xs md:text-sm font-bold shadow-sm">
              <Star className="w-3 h-3 md:w-4 md:h-4 fill-amber-500 text-amber-500" />
              <span>{userProfile.points}</span>
            </div>

            <button className="relative p-2 md:p-2.5 bg-white hover:bg-gray-50 rounded-full border border-gray-200 transition-colors group">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover:text-gray-700" />
              <span className="absolute top-2 right-2 md:right-2.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-2 md:pl-3 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900 leading-none">{userProfile.name}</p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">{userProfile.rank}</p>
              </div>
              <img
                src={userProfile.avatar}
                alt="User"
                className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-md bg-gray-100 cursor-pointer"
              />
            </div>
          </div>
        </header>

        {/* --- SCROLLABLE CONTENT --- */}
        {/* FIX 3: overflow-x-hidden ensures no horizontal scroll on the content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative z-0 pb-32 lg:pb-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            {currentView === 'overview' && <OverviewView onViewChange={setCurrentView} user={userProfile} />}
            {currentView === 'report' && <ReportWasteView onSuccess={() => setCurrentView('history')} />}
            {currentView === 'leaderboard' && <LeaderboardView />}
            {currentView === 'history' && <HistoryView />}
            {currentView === 'news' && <NewsView />}
          </div>
        </div>

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        {/* FIX 4: Grid layout for even spacing + Absolute positioning for FAB */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 h-[4.5rem] pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5 h-full items-center relative">
            <MobileNavItem view="overview" icon={LayoutDashboard} label="Home" />
            <MobileNavItem view="news" icon={MegaphoneIcon} label="News" />

            {/* Spacer for FAB */}
            <div className="pointer-events-none"></div>

            <MobileNavItem view="leaderboard" icon={Trophy} label="Rank" />
            <MobileNavItem view="history" icon={User} label="Profile" />

            {/* Absolute Center FAB */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50">
              <button
                onClick={() => setCurrentView('report')}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-transform active:scale-95 border-[4px] border-gray-50 ${currentView === 'report' ? 'bg-gray-900 text-white' : 'bg-emerald-600 text-white'
                  }`}
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}