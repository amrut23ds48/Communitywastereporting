import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, ArrowRight, Check, MapPin, TrendingUp, 
  ShieldCheck, Leaf, Recycle, Award,
  Target, BarChart3, Heart, Sparkles, Star, Zap,
  Activity, Trophy, ChevronRight, Globe, IndianRupee
} from 'lucide-react';

interface RoleSelectionProps {
  onSelectRole: (role: 'citizen' | 'admin') => void;
}

export function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'admin' | null>(null);
  const [recentActivity, setRecentActivity] = useState<string>('Loading live updates...');
  
  // Simulated stats with animation
  const [stats, setStats] = useState({
    reportsResolved: 14205,
    activeVolunteers: 1240,
    satisfactionRate: 98,
    wasteCollected: 4500 // in kg
  });

  // 🇮🇳 Indian Context: Live Ticker Effect
  useEffect(() => {
    const activities = [
      "🌿 Priya S. reported garbage in Indiranagar, Bangalore",
      "✅ Swachh Bharat Team cleared Sector 17, Chandigarh",
      "🏆 Rohan K. earned 'Green Warrior' badge in Mumbai",
      "🚛 Collection truck dispatched to Connaught Place, Delhi",
      "♻️ 50kg of plastic recycled in Andheri West today",
      "🙏 Ananya M. donated 500 Karma Points to tree plantation"
    ];
    
    let index = 0;
    setRecentActivity(activities[0]);
    
    const ticker = setInterval(() => {
      index = (index + 1) % activities.length;
      setRecentActivity(activities[index]);
    }, 4500);

    const statTimer = setInterval(() => {
      setStats(prev => ({
        ...prev,
        reportsResolved: prev.reportsResolved + (Math.random() > 0.6 ? 1 : 0),
        wasteCollected: prev.wasteCollected + Math.floor(Math.random() * 5)
      }));
    }, 2500);

    return () => {
      clearInterval(ticker);
      clearInterval(statTimer);
    };
  }, []);

  const handleRoleSelect = (role: 'citizen' | 'admin') => {
    setSelectedRole(role);
    setTimeout(() => onSelectRole(role), 500);
  };

  const roles = [
    {
      id: 'citizen',
      title: 'Nagrik (Citizen)',
      subtitle: 'Report, Earn Karma, Impact',
      description: 'Be a responsible citizen. Report issues in your locality, track cleanups, and earn Green Karma points.',
      icon: Users,
      features: [
        { text: 'Snap & Report (Geo-tagged)', icon: MapPin },
        { text: 'Earn Green Karma Points', icon: Award },
        { text: 'Leaderboard Recognition', icon: Trophy }
      ],
      stats: '25k+ Active Indians',
      color: 'emerald',
      bgGradient: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-500/20'
    },
    {
      id: 'admin',
      title: 'Admin Authority',
      subtitle: 'Municipal & NGO Management',
      description: 'For municipal officers and NGO leaders to manage resources, analyze heatmaps, and dispatch cleanup crews.',
      icon: Shield,
      features: [
        { text: 'Dispatch Cleanup Crews', icon: ShieldCheck },
        { text: 'City-wide Heatmaps', icon: BarChart3 },
        { text: 'Impact Analytics', icon: Target }
      ],
      stats: 'Authorized Personnel Only',
      color: 'blue',
      bgGradient: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/20'
    }
  ];

  const wasteTypes = [
    { type: 'Wet Waste', color: 'bg-green-500', percentage: 55, sub: 'Kitchen/Organic' },
    { type: 'Dry Waste', color: 'bg-blue-500', percentage: 30, sub: 'Plastic/Paper' },
    { type: 'E-Waste', color: 'bg-red-500', percentage: 15, sub: 'Electronics' }
  ];

  // 🇮🇳 Indian Names for Leaderboard
  const leaderboard = [
    { name: "Aditya Sharma", location: "Pune", points: 2850, badge: "Eco King" },
    { name: "Diya Patel", location: "Ahmedabad", points: 2640, badge: "Recycler" },
    { name: "Arjun Singh", location: "Jaipur", points: 2300, badge: "Scout" },
    { name: "Meera Reddy", location: "Hyderabad", points: 2150, badge: "Guardian" },
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F8] relative overflow-hidden font-sans selection:bg-orange-200 selection:text-orange-900">
      
      {/* Dynamic Background Mesh (Tricolor hint - Saffron, White, Green hints) */}
      <div className="absolute inset-0 z-0 opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-200/30 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] rounded-full bg-emerald-200/30 blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 lg:py-10">
        
        {/* 🇮🇳 Top Bar: Live Activity Ticker */}
        <div className="flex justify-center mb-12">
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

        {/* Hero Header */}
        <div className="text-center max-w-4xl mx-auto mb-16 relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full blur-3xl opacity-50"></div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-none">
            Clean India. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-slate-500 to-green-600">
              Green Future.
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Join the <span className="font-bold text-slate-900">Swachh Bharat</span> digital revolution. 
            Report waste, coordinate cleanups, and track real-time impact in your city.
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
                  <span className="text-sm text-slate-600">Reports</span>
                  <span className="font-bold text-slate-900">{stats.reportsResolved.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                  <span className="text-sm text-slate-600">Volunteers</span>
                  <span className="font-bold text-slate-900">{stats.activeVolunteers.toLocaleString()}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-200/50">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-emerald-600 block mb-1">{stats.wasteCollected}kg</span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wider">
                      Waste Removed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Waste Composition */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl shadow-slate-200/50">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Waste Analysis</h3>
              <div className="space-y-5">
                {wasteTypes.map((waste) => (
                  <div key={waste.type}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <span className="block font-bold text-slate-700 text-sm">{waste.type}</span>
                        <span className="block text-[10px] text-slate-400">{waste.sub}</span>
                      </div>
                      <span className="font-bold text-slate-900">{waste.percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full ${waste.color} transition-all duration-1000 ease-out`}
                        style={{ width: `${waste.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
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
                    
                    {/* Background Gradient Blob on Hover */}
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
                          {isSelected && <div className="animate-scale-in bg-green-500 text-white p-1 rounded-full"><Check className="w-5 h-5"/></div>}
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
                {leaderboard.map((user, index) => (
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
                ))}
              </div>

              <button className="w-full mt-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider transition-colors border border-white/5">
                View Full Leaderboard
              </button>
            </div>

            {/* How It Works (Simplified) */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl">
              <h4 className="font-bold text-slate-800 text-sm mb-4">How to Earn Karma?</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">1</div>
                  Snap a photo of waste
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">2</div>
                  Get AI verification
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">3</div>
                  Receive 50 Karma Points
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center pb-8">
          <p className="text-slate-500 text-sm font-medium">
            Proudly Made in 🇮🇳 • Contributing to <span className="text-orange-600 font-bold">Swachh Bharat Abhiyan</span>
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