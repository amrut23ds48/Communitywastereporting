import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight, MapPin, Award, Activity,
  TrendingUp, Target, Zap, ChevronRight, Leaf
} from 'lucide-react';
import { getCitizenStats, getCitizenRecentReports } from '../../db/citizens';

export function OverviewView({ onViewChange, user }: { onViewChange: (view: any) => void, user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        // Load stats
        const { data: statsData } = await getCitizenStats(user?.id);
        if (mounted && statsData) setStats(statsData);

        // Load recent reports
        const { data: reportsData } = await getCitizenRecentReports(user?.id, 3);
        if (mounted && reportsData) setRecentReports(reportsData);

      } catch (err) {
        console.error("Failed to load overview data", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (user?.id) loadData();
    return () => { mounted = false; };
  }, [user?.id]);

  // Use stats or fallback to user prop
  const currentPoints = stats?.total_points ?? user.points;
  const rankTitle = stats?.rank_title ?? user.rank;

  // Calculate Progress
  const currentLevel = stats?.current_level ?? 1;
  const currentLevelPoints = stats?.current_level_points ?? 0;
  const pointsToNext = stats?.points_to_next_level ?? 100;

  // Logic: 
  // Points Earned In Current Level = Total Points - Base Points for Current Level
  // Level Span = Points Needed for Next Level + Points Earned In Current Level
  // e.g. Level 1 (0-100). Total 40. Base 0. Next 60. Earned 40. Span 100. % = 40.
  // e.g. Level 2 (100-250). Total 150. Base 100. Next 100. Earned 50. Span 150. % = 33.3.
  const pointsEarnedInLevel = Math.max(0, currentPoints - currentLevelPoints);
  const levelSpan = pointsToNext + pointsEarnedInLevel;
  const progressPercentage = levelSpan > 0 ? (pointsEarnedInLevel / levelSpan) * 100 : 0;

  return (
    <div className="relative space-y-6 md:space-y-8 pb-20 md:pb-8">

      {/* --- BACKGROUND DECORATION --- */}
      <div className="absolute inset-0 z-0 pointer-events-none -m-4">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-emerald-100/40 rounded-full blur-[80px] md:blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 md:w-72 md:h-72 bg-blue-100/40 rounded-full blur-[80px] md:blur-[100px] -z-10"></div>
      </div>

      {/* --- WELCOME & PROGRESS SECTION --- */}
      <div className="relative z-10 bg-white rounded-3xl p-5 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
        <div className="flex-1 space-y-2 w-full">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-700 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Level {currentLevel}
            </span>
            <span className="text-gray-400 text-xs font-semibold">{rankTitle}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
            Keep it up, {user.name.split(' ')[0]}! 🌿
          </h2>
          <p className="text-gray-500 text-xs md:text-sm">
            {stats?.global_rank ? (
              <>You are rank <span className="text-emerald-600 font-bold">#{stats.global_rank}</span> globally.</>
            ) : (
              "Start reporting to earn your rank!"
            )}
          </p>
        </div>

        <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="flex justify-between text-xs md:text-sm font-bold text-gray-700 mb-2">
            <span>Progress</span>
            <span>{currentPoints} / {currentPoints + pointsToNext} pts</span>
          </div>
          <div className="h-2.5 md:h-3 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-[10px] md:text-xs text-gray-400 mt-2 text-center">
            Earn <span className="text-emerald-600 font-bold">{pointsToNext} more</span> for next level
          </p>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">

        {/* Card 1: Points */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 md:p-6 text-white shadow-lg shadow-emerald-200/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Award className="w-20 h-20 md:w-24 md:h-24 rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-100 mb-4">
              <div className="p-1.5 md:p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-white fill-white" />
              </div>
              <span className="text-xs md:text-sm font-medium">Impact Score</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-1">{currentPoints}</h3>
            <div className="flex items-center gap-1 text-[10px] md:text-xs text-emerald-100 font-medium bg-white/10 w-fit px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3" />
              Lifetime Points
            </div>
          </div>
        </div>

        {/* Card 2: Reports */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Total</span>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 text-xs md:text-sm font-medium">Reports Filed</p>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.total_reports ?? 0}</h3>
            <p className="text-[10px] md:text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {stats?.resolved_reports ?? 0} Resolved
            </p>
          </div>
        </div>

        {/* Card 3: Rank */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
              <MapPin className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">{stats?.neighborhood || "City"}</span>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 text-xs md:text-sm font-medium">{stats?.neighborhood ? 'Neighborhood Rank' : 'City Rank'}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                {stats?.neighborhood ? `#${stats.neighborhood_rank || '-'}` : `#${stats?.city_rank || '-'}`}
              </h3>
            </div>
            <p className="text-[10px] md:text-xs text-purple-600 font-medium">
              {stats?.neighborhood ? 'In your area' : 'In your city'}
            </p>
          </div>
        </div>
      </div>

      {/* --- BOTTOM SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 relative z-10">

        {/* Left Column: Actions */}
        <div className="space-y-4 md:space-y-6">

          {/* Main CTA */}
          <div className="bg-[#1e1b4b] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden flex flex-col justify-center items-start shadow-xl shadow-indigo-200">
            <div className="relative z-10 w-full max-w-sm">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] md:text-xs font-medium text-indigo-200 mb-4 border border-white/10">
                <Target className="w-3 h-3" />
                Action Required
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">Spot some waste?</h3>
              <p className="text-indigo-200 mb-6 md:mb-8 text-xs md:text-sm leading-relaxed">
                Help keep your community clean by reporting it now. Our AI will verify it instantly.
              </p>
              <button
                onClick={() => onViewChange('report')}
                className="w-full md:w-auto bg-white text-indigo-950 px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-50 transition-all active:scale-95 inline-flex items-center justify-center gap-2 shadow-lg group text-sm"
              >
                Start Reporting
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            {/* Decorative Gradients */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-indigo-600 rounded-full blur-[80px] opacity-40"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-[80px] opacity-30"></div>
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          </div>

          {/* Daily Challenge Widget */}
          <div className="bg-amber-50 rounded-2xl p-4 md:p-5 border border-amber-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 rounded-full flex items-center justify-center text-xl shrink-0">🎯</div>
              <div className="min-w-0">
                <h4 className="font-bold text-amber-900 text-xs md:text-sm truncate">Daily Challenge</h4>
                <p className="text-[10px] md:text-xs text-amber-700 truncate">Submit 1 verified report today</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="block font-bold text-amber-600 text-base md:text-lg">+50 pts</span>
              <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Reward</span>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 flex flex-col h-full min-h-[300px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
              <Leaf className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
              Recent Activity
            </h3>
            <button
              onClick={() => onViewChange('history')}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {recentReports.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-400 text-xs">No recent activity</div>
            )}

            {loading && recentReports.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse"></div>)}
              </div>
            )}

            {recentReports.map((report, i) => (
              <div key={report.id} className="group flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-gray-100">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                  <img src={report.image_url || `https://picsum.photos/seed/${i + 22}/200`} alt="Waste" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  {i === 0 && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 md:w-6 md:h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="font-bold text-gray-900 text-xs md:text-sm truncate pr-2">{report.waste_type} at {report.street_name || 'Location'}</h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-500 truncate">{report.description}</p>
                </div>
                <div className={`hidden sm:block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md ${report.status === 'open' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                    report.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                  {report.status}
                </div>
                {/* Mobile Status Dot */}
                <div className={`sm:hidden w-2 h-2 rounded-full ${report.status === 'open' ? 'bg-yellow-500' :
                    report.status === 'resolved' ? 'bg-emerald-500' :
                      'bg-blue-500'
                  }`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}