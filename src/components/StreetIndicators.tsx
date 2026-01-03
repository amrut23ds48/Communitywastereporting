import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, MapPin, Crown, Flame, ArrowRight, BarChart3 } from 'lucide-react';
import { getStreetStatistics } from '../db/analytics';

// --- Types & Helpers ---
interface StreetData {
  name: string;
  total: number;
  open: number;
  resolved: number;
  inProgress: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

// Logic to determine severity based on open report %
const getSeverity = (open: number, total: number): StreetData['severity'] => {
  const ratio = open / (total || 1);
  if (total > 50 && ratio > 0.6) return 'Critical';
  if (total > 20 && ratio > 0.4) return 'High';
  if (ratio > 0.2) return 'Medium';
  return 'Low';
};

const SeverityBadge = ({ level }: { level: string }) => {
  const styles = {
    Critical: 'bg-red-500 text-white shadow-red-200 shadow-md',
    High: 'bg-orange-500 text-white shadow-orange-200 shadow-md',
    Medium: 'bg-amber-400 text-amber-900',
    Low: 'bg-emerald-500 text-white',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${styles[level as keyof typeof styles]}`}>
      {level}
    </span>
  );
};

// --- Sub-Component: Top Ranked Street (The "Hero" Card) ---
const TopStreetCard = ({ street }: { street: StreetData }) => (
  <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 border border-amber-200 shadow-lg group">
    {/* Decorative Glow */}
    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 opacity-20 blur-2xl group-hover:opacity-30 transition-opacity" />
    
    <div className="relative z-10 flex items-start justify-between">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md shadow-orange-200">
          <Crown size={20} fill="currentColor" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">#1 Hotspot</span>
            <SeverityBadge level={street.severity} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{street.name}</h3>
        </div>
      </div>
      <div className="text-right">
        <span className="block text-2xl font-black text-gray-800">{street.total}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase">Reports</span>
      </div>
    </div>

    {/* Visual Bar for Top Card */}
    <div className="mt-4 space-y-2">
      <div className="flex justify-between text-xs font-medium text-gray-500">
        <span className="flex items-center gap-1"><AlertTriangle size={10} className="text-red-500" /> {street.open} Open</span>
        <span className="flex items-center gap-1 text-emerald-600"> {street.resolved} Resolved <CheckCircle2 size={10} /></span>
      </div>
      <div className="h-3 w-full rounded-full bg-amber-100 overflow-hidden flex border border-amber-200/50">
        <div className="bg-red-500 h-full" style={{ width: `${(street.open/street.total)*100}%` }} />
        <div className="bg-amber-400 h-full" style={{ width: `${(street.inProgress/street.total)*100}%` }} />
        <div className="bg-emerald-500 h-full" style={{ width: `${(street.resolved/street.total)*100}%` }} />
      </div>
    </div>
  </div>
);

// --- Sub-Component: Standard Street Row ---
const StreetRow = ({ street, index }: { street: StreetData, index: number }) => (
  <div className="group relative flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-all hover:border-blue-100 hover:shadow-md hover:-translate-x-1">
    
    {/* Rank Number */}
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 font-bold text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
      {index + 1}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-bold text-gray-700 truncate text-sm">{street.name}</h4>
        <span className="text-xs font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">{street.total}</span>
      </div>
      
      {/* Mini Progress Bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden flex">
         <div className="bg-red-500" style={{ width: `${(street.open/street.total)*100}%` }} />
         <div className="bg-amber-400" style={{ width: `${(street.inProgress/street.total)*100}%` }} />
         <div className="bg-emerald-500" style={{ width: `${(street.resolved/street.total)*100}%` }} />
      </div>
    </div>

    {/* Status Icon Indicator (Severity) */}
    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0">
        {street.severity === 'Critical' ? <Flame size={16} className="text-red-500 animate-pulse" /> : 
         street.severity === 'High' ? <AlertTriangle size={16} className="text-orange-500" /> :
         <BarChart3 size={16} className="text-blue-400" />
        }
    </div>
  </div>
);

// --- Main Component ---
export function StreetIndicators() {
  const [streetData, setStreetData] = useState<StreetData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreetData = async () => {
      setLoading(true);
      const { data } = await getStreetStatistics();
      if (data) {
        const processed = data
          .sort((a, b) => b.totalReports - a.totalReports)
          .slice(0, 6)
          .map(s => ({
            name: s.streetName,
            total: s.totalReports,
            open: s.openReports,
            resolved: s.resolvedReports,
            inProgress: s.inProgressReports,
            severity: getSeverity(s.openReports, s.totalReports)
          }));
        setStreetData(processed);
      }
      setLoading(false);
    };
    fetchStreetData();
  }, []);

  return (
    <div className="h-full rounded-3xl bg-white border border-gray-100 shadow-xl flex flex-col overflow-hidden">
      
      {/* 1. Specialized Dark/Gradient Header */}
      <div className="relative bg-[#1a2e1a] p-6 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#4ade80 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <MapPin size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Geospatial Analytics</span>
                </div>
                <h2 className="text-xl font-bold">Zone Intensity</h2>
            </div>
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                <TrendingUp size={20} className="text-emerald-300" />
            </div>
        </div>
      </div>

      {/* 2. Content Body */}
      <div className="flex-1 p-5 overflow-y-auto bg-gray-50/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
             <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
             <p className="text-xs font-medium text-gray-400">Analyzing street data...</p>
          </div>
        ) : streetData.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No data available</div>
        ) : (
          <>
            {/* Top 1 gets special card */}
            <TopStreetCard street={streetData[0]} />

            {/* Others get list */}
            <div className="space-y-3">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Runner Ups</h5>
                {streetData.slice(1).map((street, idx) => (
                    <StreetRow key={street.name} street={street} index={idx + 1} />
                ))}
            </div>
          </>
        )}
      </div>

      {/* 3. Footer Legend */}
      <div className="bg-white p-3 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-500 font-medium">
         <div className="flex gap-3">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Open</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> Active</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Fixed</span>
         </div>
         <button className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
            Full Map <ArrowRight size={10} />
         </button>
      </div>
    </div>
  );
}