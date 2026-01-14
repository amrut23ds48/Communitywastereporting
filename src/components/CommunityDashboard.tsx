import React, { useEffect, useState } from 'react';
import {
    LayoutDashboard, Map as MapIcon, Camera, Trophy, History,
    LogOut, Bell, ChevronRight, Star, Leaf, User, MegaphoneIcon,
    Newspaper, Megaphone, Zap, Shield, Siren
} from 'lucide-react';

import { OverviewView } from './dashboard-views/OverviewView';
import { ReportIncidentView } from './dashboard-views/ReportIncidentView';
import { LeaderboardView } from './dashboard-views/LeaderboardView';
import { HistoryView } from './dashboard-views/HistoryView';
import { NewsView } from './dashboard-views/NewsView';
import { SafePlacesView } from './dashboard-views/SafePlacesView';
import { CrisisMap } from './CrisisMap';

interface CommunityDashboardProps {
    onLogout: () => void;
    userId: string;
}

type ViewState = 'overview' | 'report' | 'map' | 'resources' | 'leaderboard' | 'history' | 'news';

export function CommunityDashboard({ onLogout, userId }: CommunityDashboardProps) {
    const [currentView, setCurrentView] = useState<ViewState>('overview');
    const [userProfile, setUserProfile] = useState<{
        id: string;
        name: string;
        rank: string;
        points: number;
        avatar: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorFragment, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        async function loadProfile() {
            try {
                setLoading(true);
                const { getCitizenProfile } = await import('../db/citizens');
                const { data, error } = await getCitizenProfile(userId);

                if (error) throw error;

                if (mounted && data) {
                    setUserProfile({
                        id: data.id,
                        name: data.full_name,
                        rank: data.rank_title,
                        points: data.total_points,
                        avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.full_name}`
                    });
                }
            } catch (err: any) {
                console.error("Failed to load profile:", err);
                if (mounted) setError("Failed to load profile");
            } finally {
                if (mounted) setLoading(false);
            }
        }
        loadProfile();
        return () => { mounted = false; };
    }, [userId]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading crisis dashboard...</p>
                </div>
            </div>
        );
    }

    if (errorFragment || !userProfile) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Something went wrong</h3>
                    <p className="text-slate-500">{errorFragment || "Profile not found"}</p>
                    <button onClick={onLogout} className="text-rose-600 font-bold hover:underline">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    const headlines = [
        "🚨 Emergency Alert: Flash flood warning for Lower Parel.",
        "🚑 Medical Camp available at Andheri Sports Complex.",
        "📢 Food distribution starting at 2 PM in Sector 4.",
        "🌧️ Heavy rain expected: Stay indoors."
    ];

    // --- Components ---

    const DesktopNavItem = ({ view, icon: Icon, label, badge }: { view: ViewState, icon: any, label: string, badge?: string }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium relative overflow-hidden ${currentView === view
                ? 'bg-rose-50 text-rose-800 shadow-sm ring-1 ring-rose-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            {currentView === view && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-l-xl" />
            )}
            <Icon className={`w-5 h-5 transition-colors ${currentView === view ? 'text-rose-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <span>{label}</span>
            {badge && (
                <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-sm shadow-rose-200">
                    {badge}
                </span>
            )}
            {currentView === view && <ChevronRight className="w-4 h-4 ml-auto text-rose-400" />}
        </button>
    );

    const MobileNavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors relative z-10 ${currentView === view ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'
                }`}
        >
            <div className={`p-1 rounded-xl mb-0.5 transition-all duration-300 ${currentView === view ? 'bg-rose-50 -translate-y-1' : ''}`}>
                <Icon className={`w-5 h-5 ${currentView === view ? 'fill-rose-600' : ''}`} />
            </div>
            <span className={`text-[10px] font-medium transition-opacity ${currentView === view ? 'opacity-100 font-bold' : 'opacity-80'}`}>{label}</span>
        </button>
    );

    return (
        <div className="h-[100dvh] w-full bg-slate-50 flex font-sans text-slate-800 selection:bg-rose-100 overflow-hidden">

            {/* --- SIDEBAR (Desktop Only) --- */}
            <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 fixed h-full z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-6">
                    <div className="flex items-center gap-3 text-rose-700 font-bold text-xl tracking-tight">
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                            <Siren className="w-6 h-6 fill-white" />
                        </div>
                        <span>CrisisReady</span>
                    </div>
                </div>

                <div className="px-4 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</div>
                    <DesktopNavItem view="overview" icon={LayoutDashboard} label="Overview" />
                    <DesktopNavItem view="report" icon={Camera} label="Report Incident" />
                    <DesktopNavItem view="map" icon={MapIcon} label="Crisis Map" />
                    <DesktopNavItem view="resources" icon={Shield} label="Safe Places" />

                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Community</div>
                    <DesktopNavItem view="leaderboard" icon={Trophy} label="Heroes" />
                    <DesktopNavItem view="news" icon={Newspaper} label="Alerts & News" badge="Live" />
                    <DesktopNavItem view="history" icon={History} label="My Reports" />
                </div>

                <div className="p-4 mt-auto">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                        <div className="flex items-center gap-2 mb-2 text-rose-300 font-bold text-xs uppercase tracking-wide">
                            <Zap className="w-3 h-3" /> Emergency Tip
                        </div>
                        <p className="text-sm font-medium text-slate-200 leading-snug">
                            Keep a flashlight and first-aid kit accessible at all times.
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
                <div className="absolute inset-0 z-0 pointer-events-none bg-slate-50">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                </div>

                {/* --- TICKER BAR --- */}
                <div className="bg-rose-900 text-rose-50 text-[10px] md:text-sm py-2 px-3 md:px-4 flex items-center shadow-md relative z-20 border-b border-rose-800 shrink-0">
                    <div className="flex items-center gap-1.5 md:gap-2 bg-rose-800/80 backdrop-blur-sm px-2 md:px-3 py-0.5 rounded-md mr-2 md:mr-4 z-20 font-bold uppercase tracking-wider shrink-0 border border-rose-700/50 shadow-inner">
                        <Megaphone className="w-3 h-3 animate-pulse text-rose-300" />
                        <span>Alerts</span>
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
                <header className="sticky top-0 z-10 px-4 md:px-8 py-3 md:py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex justify-between items-center transition-all shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="lg:hidden w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-rose-200">
                            <Siren className="w-5 h-5 fill-white" />
                        </div>

                        <div className="min-w-0">
                            <h1 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
                                {currentView === 'overview' && 'Dashboard'}
                                {currentView === 'report' && 'Report Incident'}
                                {currentView === 'map' && 'Crisis Map'}
                                {currentView === 'resources' && 'Safe Places'}
                                {currentView === 'leaderboard' && 'Community Heroes'}
                                {currentView === 'history' && 'My Reports'}
                                {currentView === 'news' && 'Alerts & News'}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-5 shrink-0">
                        <div className="flex items-center gap-1.5 md:gap-2 bg-amber-50 px-2 md:px-3 py-1 rounded-full border border-amber-100 text-amber-700 text-xs md:text-sm font-bold shadow-sm">
                            <Star className="w-3 h-3 md:w-4 md:h-4 fill-amber-500 text-amber-500" />
                            <span>{userProfile.points}</span>
                        </div>

                        <button className="relative p-2 md:p-2.5 bg-white hover:bg-slate-50 rounded-full border border-slate-200 transition-colors group">
                            <Bell className="w-4 h-4 md:w-5 md:h-5 text-slate-500 group-hover:text-slate-700" />
                            <span className="absolute top-2 right-2 md:right-2.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-2 md:pl-3 border-l border-slate-200">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-900 leading-none">{userProfile.name}</p>
                                <p className="text-xs text-rose-600 font-medium mt-0.5">{userProfile.rank}</p>
                            </div>
                            <img
                                src={userProfile.avatar}
                                alt="User"
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-md bg-slate-100 cursor-pointer"
                            />
                        </div>
                    </div>
                </header>

                {/* --- SCROLLABLE CONTENT --- */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative z-0 pb-32 lg:pb-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {currentView === 'overview' && <OverviewView onViewChange={setCurrentView} user={userProfile} />}
                        {currentView === 'report' && <ReportIncidentView onSuccess={() => setCurrentView('history')} />}
                        {currentView === 'map' && <CrisisMap viewType="community" />}
                        {currentView === 'resources' && <SafePlacesView />}
                        {currentView === 'leaderboard' && <LeaderboardView />}
                        {currentView === 'history' && <HistoryView userId={userId} />}
                        {currentView === 'news' && <NewsView />}
                    </div>
                </div>

                {/* --- MOBILE BOTTOM NAVIGATION --- */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 h-[4.5rem] pb-[env(safe-area-inset-bottom)]">
                    <div className="grid grid-cols-5 h-full items-center relative">
                        <MobileNavItem view="overview" icon={LayoutDashboard} label="Home" />
                        <MobileNavItem view="resources" icon={Shield} label="Safe" />

                        {/* Spacer for FAB */}
                        <div className="pointer-events-none"></div>

                        <MobileNavItem view="map" icon={MapIcon} label="Map" />
                        <MobileNavItem view="history" icon={User} label="Profile" />

                        {/* Absolute Center FAB */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50">
                            <button
                                onClick={() => setCurrentView('report')}
                                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/40 transition-transform active:scale-95 border-[4px] border-slate-50 ${currentView === 'report' ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white'
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
