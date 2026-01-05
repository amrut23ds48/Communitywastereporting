import React, { useState } from 'react';
import { 
  Calendar, MapPin, CheckCircle, Clock, Filter, 
  ArrowUpRight, FileText, Trash2, MoreVertical, 
  CircleDashed, Check, AlertCircle 
} from 'lucide-react';

export function HistoryView() {
  const [filter, setFilter] = useState<'all' | 'resolved' | 'pending'>('all');

  const history = [
    { 
      id: "RPT-2025-001", 
      date: "Oct 24, 2025", 
      time: "10:30 AM",
      location: "Main Street, Sector 4", 
      status: "Resolved", 
      points: 50,
      wasteType: "Plastic",
      steps: [true, true, true], // Reported, Verified, Cleaned
      image: "https://picsum.photos/seed/1/200" 
    },
    { 
      id: "RPT-2025-004", 
      date: "Oct 22, 2025", 
      time: "02:15 PM",
      location: "Gandhi Park Entrance", 
      status: "Pending", 
      points: 0,
      wasteType: "Organic",
      steps: [true, true, false], // Reported, Verified, Cleaned (Pending)
      image: "https://picsum.photos/seed/2/200" 
    },
    { 
      id: "RPT-2025-009", 
      date: "Oct 18, 2025", 
      time: "09:00 AM",
      location: "Bus Station 12", 
      status: "Resolved", 
      points: 50,
      wasteType: "Debris",
      steps: [true, true, true],
      image: "https://picsum.photos/seed/3/200" 
    },
    { 
      id: "RPT-2025-012", 
      date: "Oct 15, 2025", 
      time: "05:45 PM",
      location: "Market Road Backside", 
      status: "In Review", 
      points: 0,
      wasteType: "General",
      steps: [true, false, false], // Reported only
      image: "https://picsum.photos/seed/4/200" 
    },
  ];

  const filteredHistory = filter === 'all' 
    ? history 
    : filter === 'resolved' 
      ? history.filter(h => h.status === 'Resolved') 
      : history.filter(h => h.status !== 'Resolved');

  const stats = {
    total: history.length,
    resolved: history.filter(h => h.status === 'Resolved').length,
    pending: history.filter(h => h.status !== 'Resolved').length
  };

  return (
    <div className="relative min-h-screen pb-10">
      
      {/* --- BACKGROUND GRID --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* --- STATS HEADER --- */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm text-center bg-emerald-50/30">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Resolved</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.resolved}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm text-center bg-orange-50/30">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-2xl font-bold text-orange-700">{stats.pending}</p>
          </div>
        </div>

        {/* --- FILTERS --- */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Report History
          </h2>
          <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm inline-flex">
            {['all', 'resolved', 'pending'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
                  filter === f 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* --- LIST CARDS --- */}
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <div className="flex flex-col md:flex-row">
                
                {/* Image Section */}
                <div className="relative w-full md:w-48 h-48 md:h-auto shrink-0">
                  <img src={item.image} className="w-full h-full object-cover" alt="Report Evidence" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <Trash2 className="w-3 h-3 text-gray-500" />
                    {item.wasteType}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  
                  {/* Top Row: ID & Date */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <span>{item.id}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                           <Calendar className="w-3 h-3" /> {item.date}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{item.location}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> Mumbai, Maharashtra
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        item.status === 'Resolved' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                        {item.status === 'Resolved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {item.status}
                    </div>
                  </div>

                  {/* Middle Row: Progress Tracker */}
                  <div className="mb-4">
                     <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2 px-2">
                        <span className={item.steps[0] ? 'text-emerald-600 font-bold' : ''}>Reported</span>
                        <span className={item.steps[1] ? 'text-emerald-600 font-bold' : ''}>Verified</span>
                        <span className={item.steps[2] ? 'text-emerald-600 font-bold' : ''}>Cleaned</span>
                     </div>
                     <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        {/* Connecting Lines */}
                        <div className={`absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500`} 
                             style={{ width: item.status === 'Resolved' ? '100%' : item.status === 'Pending' ? '66%' : '33%' }}>
                        </div>
                     </div>
                  </div>

                  {/* Bottom Row: Actions & Points */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <button className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1">
                      View Details <ArrowUpRight className="w-3 h-3" />
                    </button>
                    
                    {item.status === 'Resolved' && (
                       <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm bg-amber-50 px-2 py-1 rounded-lg">
                          <span>+ {item.points} pts</span>
                       </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          ))}

          {filteredHistory.length === 0 && (
             <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 border-dashed">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <AlertCircle className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No reports found.</p>
                <p className="text-xs text-gray-400">Try changing the filter.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}