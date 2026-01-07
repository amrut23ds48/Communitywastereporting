import React, { useState, useEffect } from 'react';
import {
  Trophy, Medal, Crown, TrendingUp, TrendingDown,
  Minus, Shield, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { getCitizenLeaderboard } from '../../db/citizens';

export function LeaderboardView() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const { data } = await getCitizenLeaderboard({ limit: 50 }); // Fetch top 50
        if (data) {
          const formatted = data.map((l, index) => ({
            rank: index + 1,
            name: l.full_name,
            points: l.total_points,
            change: 'same', // Placeholder as DB doesn't track history yet
            level: Math.floor(l.total_points / 100) + 1, // Simple level calc
            badges: [],
            avatar: l.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${l.full_name}`,
            isMe: false // Ideally we check this against current user ID if available
          }));
          setLeaders(formatted);
        }
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const getTrendIcon = (change: string) => {
    switch (change) {
      case 'up': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-rose-500" />;
      default: return <Minus className="w-4 h-4 text-gray-300" />;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-b from-yellow-300 to-yellow-500 ring-4 ring-yellow-200 shadow-yellow-200/50";
      case 2: return "bg-gradient-to-b from-slate-300 to-slate-400 ring-4 ring-slate-200 shadow-slate-200/50";
      case 3: return "bg-gradient-to-b from-orange-300 to-orange-500 ring-4 ring-orange-200 shadow-orange-200/50";
      default: return "bg-white";
    }
  };

  // Logic to determine which users to show
  const topThree = leaders.slice(0, 3);
  // If expanded, show everyone else (up to 10 or so). If not, show ranks 4, 5, 6 only.
  const listUsers = isExpanded ? leaders.slice(3, 13) : leaders.slice(3, 6);

  if (loading) {
    return <div className="p-10 text-center text-gray-400">Loading leaderboard...</div>;
  }

  if (leaders.length === 0) {
    return <div className="p-10 text-center text-gray-400">No data available yet.</div>;
  }

  return (
    <div className="space-y-8 pb-10">

      {/* --- HEADER --- */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Community Champions
        </h2>
        <p className="text-gray-500 text-sm">Top contributors making our city cleaner this week</p>
      </div>

      {/* --- PODIUM SECTION (TOP 3) --- */}
      <div className="flex justify-center items-end gap-4 md:gap-8 mb-12 px-4">

        {/* Rank 2 (Silver) */}
        {topThree[1] && (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="relative mb-3">
              <div className={`w-20 h-20 rounded-full p-1 shadow-xl ${getRankStyle(2)}`}>
                <img src={topThree[1].avatar} className="w-full h-full rounded-full bg-white object-cover" alt="Rank 2" />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                #2
              </div>
            </div>
            <p className="font-bold text-gray-800 text-sm mt-2">{topThree[1].name}</p>
            <p className="text-emerald-600 font-bold text-sm">{topThree[1].points} pts</p>
          </div>
        )}

        {/* Rank 1 (Gold) - Bigger */}
        {topThree[0] && (
          <div className="flex flex-col items-center relative -top-6 animate-in slide-in-from-bottom-8 duration-700">
            <Crown className="w-8 h-8 text-yellow-500 mb-2 fill-yellow-500 animate-bounce" />
            <div className="relative mb-3">
              <div className={`w-28 h-28 rounded-full p-1 shadow-2xl ${getRankStyle(1)}`}>
                <img src={topThree[0].avatar} className="w-full h-full rounded-full bg-white object-cover" alt="Rank 1" />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                #1
              </div>
            </div>
            <p className="font-bold text-gray-900 text-base mt-2">{topThree[0].name}</p>
            <div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded-full mt-1">
              <Zap className="w-3 h-3 text-yellow-700 fill-current" />
              <p className="text-yellow-800 font-bold text-sm">{topThree[0].points} pts</p>
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {topThree[2] && (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="relative mb-3">
              <div className={`w-20 h-20 rounded-full p-1 shadow-xl ${getRankStyle(3)}`}>
                <img src={topThree[2].avatar} className="w-full h-full rounded-full bg-white object-cover" alt="Rank 3" />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-700 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                #3
              </div>
            </div>
            <p className="font-bold text-gray-800 text-sm mt-2">{topThree[2].name}</p>
            <p className="text-emerald-600 font-bold text-sm">{topThree[2].points} pts</p>
          </div>
        )}
      </div>

      {/* --- LIST SECTION (REST OF USERS) --- */}
      {listUsers.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 max-w-2xl mx-auto">
          {listUsers.map((leader) => (
            <div
              key={leader.rank}
              className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 border-b border-gray-50 last:border-0 animate-in fade-in slide-in-from-bottom-1"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-center font-bold text-gray-400 text-sm">#{leader.rank}</span>
                <div className="relative">
                  <img src={leader.avatar} className="w-10 h-10 rounded-full bg-gray-100" alt={leader.name} />
                  {leader.badges.includes('hero') && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border border-white" title="Community Hero">
                      <Shield className="w-2.5 h-2.5 fill-current" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{leader.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Lvl {leader.level}</span>
                    {/* Visual Level Bar */}
                    <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(leader.level % 1) * 100 + 40}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Trend Indicator */}
                <div className="hidden sm:flex items-center gap-1 text-xs font-medium">
                  {getTrendIcon(leader.change)}
                  <span className={leader.change === 'up' ? 'text-emerald-600' : leader.change === 'down' ? 'text-rose-500' : 'text-gray-400'}>
                    {leader.change === 'up' ? '+12' : leader.change === 'down' ? '-5' : '-'}
                  </span>
                </div>

                <div className="text-right w-20">
                  <p className="font-bold text-gray-900 text-sm">{leader.points}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Points</p>
                </div>
              </div>
            </div>
          ))}

          {/* --- TOGGLE BUTTON --- */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-3 text-center text-sm font-medium text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors mt-2 flex items-center justify-center gap-1"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                View Full Leaderboard <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}