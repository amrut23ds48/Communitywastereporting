import React, { useState, useEffect } from 'react';
import {
  Users, Shield, ArrowRight, Check, MapPin,
  Leaf, Award, Target, BarChart3, Trophy, Globe, Zap,
  ShieldCheck, Truck
} from 'lucide-react';
// import { WasteCompositionWidget } from './WasteCompositionWidget';
import { getSystemStats } from '../db/stats';
import { getCitizenLeaderboard } from '../db/citizens';

interface RoleSelectionProps {
  onSelectRole: (role: 'citizen' | 'admin') => void;
}

export function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'admin' | null>(null);
  const [recentActivity, setRecentActivity] = useState<string>('Loading live updates...');

  // Real stats from DB
  const [stats, setStats] = useState({
    reportsResolved: 0,
    activeVolunteers: 0,
    incidentsActive: 0 // Was wasteCollected
  });

  // Real leaderboard from DB
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // 🇮🇳 Indian Context: Live Ticker Effect
  useEffect(() => {
    const activities = [
      "🚨 Fire reported in Andheri East - Units dispatched",
      "🚑 Ambulance requested near Dadar Station",
      "⚠️ Flood warning issued for low-lying areas in Mumbai",
      "✅ Medical supplies delivered to Relief Camp A",
      "🚒 Fire truck arrived at Sector 17, Chandigarh",
      "🙏 Volunteers distributing food packets in Pune"
    ];

    let index = 0;
    setRecentActivity(activities[0]);

    const ticker = setInterval(() => {
      index = (index + 1) % activities.length;
      setRecentActivity(activities[index]);
    }, 4500);

    return () => clearInterval(ticker);
  }, []);

  // Fetch Real Data
  useEffect(() => {
    async function fetchData() {
      // 1. Fetch System Stats
      const { data: systemStats } = await getSystemStats();
      if (systemStats) {
        setStats(systemStats);
      }

      // 2. Fetch Leaderboard (Top 3)
      const { data: leaders } = await getCitizenLeaderboard({ limit: 3 });
      if (leaders) {
        setLeaderboard(leaders.map((l, i) => ({
          name: l.full_name,
          location: l.city || 'India',
          points: l.total_points,
          rank: i + 1
        })));
      }
    }
    fetchData();
  }, []);

  const handleRoleSelect = (role: 'citizen' | 'admin') => {
    setSelectedRole(role);
    setTimeout(() => onSelectRole(role), 500);
  };

  const roles = [
    {
      id: 'citizen',
      title: 'Community Member',
      subtitle: 'Report Incidents, Request Help',
      description: 'Report emergencies, find safe zones, and help your community during crises.',
      icon: Users,
      features: [
        { text: 'Report Incidents (Geo-tagged)', icon: MapPin },
        { text: 'Find Safe Places', icon: Shield },
        { text: 'Real-time Alerts', icon: Zap }
      ],
      color: 'emerald',
      bgGradient: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-500/20'
    },
    {
      id: 'admin',
      title: 'Agency Coordinator',
      subtitle: 'Dispatch & Resource Mgmt',
      description: 'For authorized agencies to manage incidents, dispatch resources, and coordinate response.',
      icon: ShieldCheck,
      features: [
        { text: 'Dispatch Resources', icon: Truck },
        { text: 'Crisis Heatmaps', icon: BarChart3 },
        { text: 'Response Analytics', icon: Target }
      ],
      color: 'blue',
      bgGradient: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F8] relative overflow-hidden font-sans selection:bg-orange-200 selection:text-orange-900">

      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 z-0 opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-200/30 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] rounded-full bg-emerald-200/30 blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 lg:py-10">

        {/* 🇮🇳 Top Bar: Live Activity Ticker */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/90 backdrop-blur-md shadow-lg shadow-slate-200/50 border border-white/60 rounded-full pl-2 pr-6 py-2 flex items-center gap-4 animate-fade-in-down max-w-2xl w-full">
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
              </span>
              Live Feed
            </div>
            <p className="text-sm font-medium text-slate-700 truncate flex-1">
              {recentActivity}
            </p>
          </div>
        </div>

        {/* Hero Header With Requested Title */}
        <div className="text-center max-w-4xl mx-auto mb-16 relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full blur-[60px] opacity-40"></div>

          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter relative z-10 drop-shadow-sm">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-orange-500 to-rose-700 filter drop-shadow-sm">
              Crisis Response
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Integrated Community <span className="text-rose-600 font-bold">Resilience Platform.</span>
          </p>
          <p className="mt-2 text-slate-500">
            Join the digital revolution for a safer community.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Stats & Impact (3 cols) */}
          <div className="lg:col-span-3 space-y-6 hidden lg:block">
            {/* National Impact Card */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">National Impact</h3>
                  <p className="text-xs text-slate-500">Live stats across India</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                  <span className="text-sm text-slate-600">Resolved</span>
                  <span className="font-bold text-slate-900">{stats.reportsResolved.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                  <span className="text-sm text-slate-600">Volunteers</span>
                  <span className="font-bold text-slate-900">{stats.activeVolunteers.toLocaleString()}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200/50">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-rose-600 block mb-1">{stats.incidentsActive}</span>
                    <span className="text-xs font-semibold text-rose-800 bg-rose-100 px-2 py-1 rounded-full uppercase tracking-wider">
                      Active Incidents
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Waste Composition */}
            <div className="h-[340px]">
              {/* Removed Waste Composition */}
            </div>
          </div>

          {/* Middle Column: Role Selection (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;

              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id as 'citizen' | 'admin')}
                  className={`group relative w-full text-left transition-all duration-500 perspective-1000`}
                >
                  <div className={`
                    relative z-10 overflow-hidden
                    h-full bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border-2 
                    transition-all duration-300 ease-out
                    ${isSelected
                      ? `border-${role.color}-500 scale-[1.02] shadow-2xl`
                      : 'border-white/50 hover:border-slate-300 hover:bg-white/90 shadow-xl'
                    }
                  `}>

                    {/* Gradient Blob on Hover */}
                    <div className={`absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br ${role.bgGradient} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`}></div>

                    <div className="flex flex-col sm:flex-row items-start gap-6 relative">
                      {/* Icon Box */}
                      <div className={`
                        shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center 
                        bg-gradient-to-br ${role.bgGradient} text-white shadow-lg
                        transform group-hover:rotate-3 transition-transform duration-300
                      `}>
                        <Icon className="w-10 h-10" />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 transition-all">
                              {role.title}
                            </h3>
                            <p className={`text-sm font-semibold uppercase tracking-wider mb-3 mt-1 text-${role.color}-600`}>
                              {role.subtitle}
                            </p>
                          </div>
                          {isSelected && <div className="animate-scale-in bg-green-500 text-white p-1 rounded-full"><Check className="w-5 h-5" /></div>}
                        </div>

                        <p className="text-slate-600 text-base leading-relaxed mb-6">
                          {role.description}
                        </p>

                        <div className="flex flex-wrap gap-3 mb-8">
                          {role.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white/80 border border-slate-100 px-3 py-2 rounded-lg shadow-sm">
                              <feature.icon className={`w-3.5 h-3.5 text-${role.color}-600`} />
                              {feature.text}
                            </div>
                          ))}
                        </div>

                        {/* CTA Button */}
                        <div className={`
                          w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white 
                          flex items-center justify-center sm:justify-start gap-3 
                          bg-gradient-to-r ${role.bgGradient} 
                          shadow-lg ${role.shadow}
                          group-hover:shadow-xl group-hover:translate-x-1 transition-all
                        `}>
                          <span>{isSelected ? 'Processing...' : 'Continue'}</span>
                          <ArrowRight className={`w-5 h-5 ${isSelected ? 'animate-ping' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Leaderboard (3 cols) */}
          <div className="lg:col-span-3 space-y-6">

            {/* Top Eco-Warriors Widget */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/20 rounded-full blur-[50px] animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px]"></div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Top Warriors
                  </h3>
                  <p className="text-xs text-slate-400">This week's heroes</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {leaderboard.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-4">Loading top warriors...</div>
                ) : (
                  leaderboard.map((user, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg
                        ${index === 0 ? 'bg-gradient-to-tr from-yellow-300 to-yellow-600 text-yellow-900' :
                          index === 1 ? 'bg-gradient-to-tr from-slate-300 to-slate-500 text-slate-900' :
                            index === 2 ? 'bg-gradient-to-tr from-orange-300 to-orange-500 text-orange-900' :
                              'bg-slate-700 text-slate-300'}
                      `}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">{user.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {user.location}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">{user.points}</div>
                        <div className="text-[10px] text-slate-500">Karma</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Removed "View Full Leaderboard" button as requested */}
            </div>

            {/* ShieldCheck Icon for Admin features, just importing it so no unused vars */}
            <div className="hidden">
              <ShieldCheck className="w-4 h-4" />
            </div>

            {/* Credit Points System - Attention Grabbing! */}
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-2 border-orange-200 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              {/* Animated glow effect */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-400/30 rounded-full blur-[40px] animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-emerald-400/20 rounded-full blur-[30px]"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl shadow-lg">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Earn Karma Points!</h4>
                    <p className="text-[10px] text-slate-500">Every action counts</p>
                  </div>
                </div>

                {/* Points breakdown with visual hierarchy */}
                <div className="space-y-2.5">
                  {/* Report Submitted */}
                  <div className="flex items-center justify-between p-2.5 bg-white/70 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Leaf className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-xs font-medium text-slate-700">Submit Report</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+10</span>
                  </div>

                  {/* Dispatched */}
                  <div className="flex items-center justify-between p-2.5 bg-white/70 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <Truck className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-xs font-medium text-slate-700">Team Dispatched</span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+15</span>
                  </div>

                  {/* On Scene */}
                  <div className="flex items-center justify-between p-2.5 bg-white/70 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="text-xs font-medium text-slate-700">Team On Scene</span>
                    </div>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">+20</span>
                  </div>

                  {/* Resolved - Highlighted! */}
                  <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-bold text-emerald-800">Issue Resolved!</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full animate-pulse">+50</span>
                  </div>

                  {/* False Report - Warning */}
                  <div className="flex items-center justify-between p-2.5 bg-rose-50/70 rounded-xl border border-rose-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-rose-500" />
                      </div>
                      <span className="text-xs font-medium text-rose-700">False Alarm</span>
                    </div>
                    <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-full">-10</span>
                  </div>
                </div>

                {/* Total potential */}
                <div className="mt-4 pt-3 border-t border-orange-200/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Max per valid report</span>
                    <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600">+95 Karma</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center pb-8">
          <p className="text-slate-500 text-sm font-medium">
            Proudly Made in 🇮🇳 • Contributing to <span className="text-orange-600 font-bold">National Disaster Management</span>
          </p>
        </footer>

      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .animate-fade-in-down { animation: fadeInDown 0.8s ease-out; }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
}