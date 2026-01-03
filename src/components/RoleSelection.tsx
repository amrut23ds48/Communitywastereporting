import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, ArrowRight, MapPin, 
  Leaf, Recycle, Award, Zap,
  Trophy, Globe, ShoppingBag, Camera, 
  Play, Gift, TrendingUp, Search
} from 'lucide-react';

interface RoleSelectionProps {
  onSelectRole: (role: 'citizen' | 'admin') => void;
}

export function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  const [hoveredRole, setHoveredRole] = useState<'citizen' | 'admin' | null>(null);
  const [impactCount, setImpactCount] = useState(15420);

  // 🇮🇳 Live Ticker Data
  const [activeEvent, setActiveEvent] = useState(0);
  const events = [
    { text: "📍 Aarav just reported overflow in Koramangala, Bangalore", time: "2s ago" },
    { text: "🚛 BMC Truck #42 dispatched to Marine Drive, Mumbai", time: "15s ago" },
    { text: "♻️ 500kg Plastic processed in Karol Bagh, Delhi", time: "1m ago" },
    { text: "🏆 Priya redeemed 200 Karma for Metro Card Recharge", time: "2m ago" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveEvent((prev) => (prev + 1) % events.length);
      setImpactCount(prev => prev + Math.floor(Math.random() * 3));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // 🇮🇳 Indian Leaderboard
  const leaderboard = [
    { rank: 1, name: "Vikram Malhotra", city: "Mumbai", points: 4200, avatar: "bg-orange-500" },
    { rank: 2, name: "Ananya Gupta", city: "Delhi", points: 3950, avatar: "bg-green-500" },
    { rank: 3, name: "Rahul Nair", city: "Kochi", points: 3800, avatar: "bg-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans text-slate-900 selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Navbar / Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-800">
              Swachh<span className="text-emerald-600">Flow</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
            <span className="hover:text-emerald-600 cursor-pointer transition-colors">Mission</span>
            <span className="hover:text-emerald-600 cursor-pointer transition-colors">Impact</span>
            <span className="hover:text-emerald-600 cursor-pointer transition-colors">Partners</span>
          </div>

          <button className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
            Download App
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        
        {/* Section 1: Hero & Ticker */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-6 shadow-sm animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Activity:</span>
            <span className="text-xs font-medium text-slate-800">{events[activeEvent].text}</span>
            <span className="text-[10px] text-slate-400 border-l border-slate-200 pl-2">{events[activeEvent].time}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
            Clean India starts <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600">
              with a single click.
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            The next-generation waste management platform powered by AI. 
            Join <span className="font-bold text-slate-900">25,000+ citizens</span> making India cleaner, one photo at a time.
          </p>
        </div>

        {/* Section 2: The Command Center Grid (Bento Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
          
          {/* Card 1: Citizen Portal (Large) */}
          <div 
            className="md:col-span-7 row-span-2 relative group overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 cursor-pointer"
            onMouseEnter={() => setHoveredRole('citizen')}
            onMouseLeave={() => setHoveredRole(null)}
            onClick={() => onSelectRole('citizen')}
          >
            {/* Background Gradient Blob */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-100 transition-colors duration-500"></div>

            <div className="relative h-full p-8 flex flex-col justify-between z-10">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                    For Citizens
                  </span>
                  <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                  Report & Earn
                </h2>
                <p className="text-slate-500 max-w-sm">
                  Spot waste? Snap a photo. Our AI verifies it, authorities clean it, and you earn <span className="font-bold text-emerald-600">Karma Points</span>.
                </p>
              </div>

              {/* Interactive Feature Preview */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:border-emerald-200 transition-colors">
                  <Camera className="w-6 h-6 text-emerald-600 mb-3" />
                  <div className="text-sm font-bold text-slate-800">Snap</div>
                  <div className="text-[10px] text-slate-500">Geo-tagged proof</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:border-emerald-200 transition-colors">
                  <Zap className="w-6 h-6 text-amber-500 mb-3" />
                  <div className="text-sm font-bold text-slate-800">Verify</div>
                  <div className="text-[10px] text-slate-500">AI analysis (98%)</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:border-emerald-200 transition-colors">
                  <Gift className="w-6 h-6 text-purple-500 mb-3" />
                  <div className="text-sm font-bold text-slate-800">Redeem</div>
                  <div className="text-[10px] text-slate-500">Coupons & Cash</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Admin Portal (Medium) */}
          <div 
            className="md:col-span-5 row-span-2 relative group overflow-hidden rounded-[2.5rem] bg-slate-900 text-white border border-slate-800 shadow-xl shadow-slate-900/20 hover:scale-[1.01] transition-all duration-500 cursor-pointer"
            onClick={() => onSelectRole('admin')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 z-0"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl z-0"></div>

            <div className="relative z-10 p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                  Official Access
                </span>
                <Shield className="w-6 h-6 text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
              
              <h2 className="text-3xl font-bold mb-2">City Admin</h2>
              <p className="text-slate-400 text-sm mb-8">
                Monitor cleanliness levels, manage sanitation crews, and analyze city-wide data heatmaps.
              </p>

              {/* Mock Graph */}
              <div className="mt-auto bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                <div className="flex justify-between items-end h-16 gap-2">
                  {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                    <div key={i} className="w-full bg-blue-500/50 rounded-t-sm hover:bg-blue-400 transition-colors" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono">
                  <span>MON</span>
                  <span>WED</span>
                  <span>FRI</span>
                  <span>SUN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Leaderboard Widget */}
          <div className="md:col-span-4 bg-white rounded-[2rem] p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Top Heroes
              </h3>
              <span className="text-xs text-emerald-600 font-semibold cursor-pointer">View All</span>
            </div>
            <div className="space-y-4">
              {leaderboard.map((user) => (
                <div key={user.rank} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${user.avatar} text-white flex items-center justify-center text-xs font-bold shadow-md`}>
                    {user.rank}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800">{user.name}</div>
                    <div className="text-[10px] text-slate-400">{user.city}</div>
                  </div>
                  <div className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                    {user.points} pts
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Rewards Marketplace Preview */}
          <div className="md:col-span-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-[2rem] p-6 border border-orange-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-orange-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
                Rewards Shop
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-orange-100/50 shadow-sm">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-red-600">
                  Zomato
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">50% Off Food</div>
                  <div className="text-[10px] text-orange-600 font-bold">500 Karma</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-orange-100/50 shadow-sm">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-white">
                  Uber
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Free Ride</div>
                  <div className="text-[10px] text-orange-600 font-bold">1200 Karma</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: AI Tech Showcase */}
          <div className="md:col-span-4 bg-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl"></div>
            <div className="relative z-10">
               <h3 className="font-bold mb-1 flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-400" />
                AI Detection
              </h3>
              <p className="text-xs text-slate-400 mb-4">Instant waste classification.</p>
              
              <div className="relative h-24 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                {/* Simulated Scanning Line */}
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-scan"></div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                   <span className="text-xs font-mono text-purple-300">Scanning Image...</span>
                </div>
                
                {/* Detection Box */}
                <div className="absolute top-4 left-4 border border-green-500 bg-green-500/10 px-2 py-0.5 rounded text-[10px] text-green-400">
                   Plastic (98%)
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Section 3: Live Impact Stats */}
        <div className="mt-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-wrap justify-between items-center gap-8">
          <div>
             <div className="text-sm text-slate-500 font-medium mb-1">Total Reports Resolved</div>
             <div className="text-4xl font-black text-slate-900 tracking-tight">
               {impactCount.toLocaleString()}
             </div>
          </div>
          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
          <div>
             <div className="text-sm text-slate-500 font-medium mb-1">Volunteers Active</div>
             <div className="text-4xl font-black text-slate-900 tracking-tight">
               12,405
             </div>
          </div>
          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
          <div>
             <div className="text-sm text-slate-500 font-medium mb-1">Waste Recycled</div>
             <div className="text-4xl font-black text-emerald-600 tracking-tight">
               840 <span className="text-xl text-emerald-700 font-bold">tons</span>
             </div>
          </div>
          
          <div className="ml-auto">
             <button className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
               See Live Map <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            © 2025 SwachhFlow India. Part of the <span className="font-semibold text-slate-600">Digital India Initiative</span>.
          </p>
          <div className="flex justify-center gap-4 mt-4 opacity-50">
            <img src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Swachh_Bharat_Mission_Logo.svg/1200px-Swachh_Bharat_Mission_Logo.svg.png" alt="Swachh Bharat" className="h-8 grayscale hover:grayscale-0 transition-all" />
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes scan {
          0% { left: 0%; }
          50% { left: 100%; }
          100% { left: 0%; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}