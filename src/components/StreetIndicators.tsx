import React, { useState, useEffect } from 'react';
import {
  TrendingUp, AlertTriangle, CheckCircle2, MapPin,
  Crown, Flame, ArrowRight, BarChart3, GripHorizontal
} from 'lucide-react';
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

const getSeverity = (open: number, total: number): StreetData['severity'] => {
  const ratio = open / (total || 1);
  if (total > 50 && ratio > 0.6) return 'Critical';
  if (total > 20 && ratio > 0.4) return 'High';
  if (ratio > 0.2) return 'Medium';
  return 'Low';
};

// --- Sub-Component: Severity Tag ---
const SeverityTag = ({ level }: { level: string }) => {
  const styles = {
    Critical: 'bg-red-50 text-red-700 border-red-200 ring-red-500/20',
    High: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
  };
  return (
    <span className={`
      px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ring-1
      ${styles[level as keyof typeof styles]}
    `}>
      {level}
    </span>
  );
};

// --- Sub-Component: Segmented Progress Bar ---
const SegmentedBar = ({ open, active, fixed, total }: { open: number, active: number, fixed: number, total: number }) => (
  <div className="h-2 w-full flex gap-0.5 rounded-full overflow-hidden bg-slate-100">
    <div className="bg-red-500/90 hover:bg-red-500 transition-colors" style={{ width: `${(open / total) * 100}%` }} title={`${open} Open`} />
    <div className="bg-amber-400/90 hover:bg-amber-400 transition-colors" style={{ width: `${(active / total) * 100}%` }} title={`${active} In Progress`} />
    <div className="bg-emerald-500/90 hover:bg-emerald-500 transition-colors" style={{ width: `${(fixed / total) * 100}%` }} title={`${fixed} Fixed`} />
  </div>
);

// --- Sub-Component: #1 Hotspot Hero Card ---
const TopStreetCard = ({ street }: { street: StreetData }) => (
  <div className="relative mb-6 group">
    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-2xl transform transition-transform group-hover:scale-[1.02]" />
    <div className="relative rounded-2xl border border-red-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Crown size={20} fill="currentColor" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-red-600 border border-red-100 shadow-sm">
              1
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Highest Density</span>
              {street.severity === 'Critical' && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
            </div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight mt-0.5">{street.name}</h3>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-black text-slate-800 tracking-tight">{street.total}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Reports</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-red-50/50 rounded-lg p-2 text-center border border-red-100">
          <div className="text-red-600 font-bold text-sm">{street.open}</div>
          <div className="text-[10px] text-red-400 font-medium">Open</div>
        </div>
        <div className="bg-amber-50/50 rounded-lg p-2 text-center border border-amber-100">
          <div className="text-amber-600 font-bold text-sm">{street.inProgress}</div>
          <div className="text-[10px] text-amber-400 font-medium">Active</div>
        </div>
        <div className="bg-emerald-50/50 rounded-lg p-2 text-center border border-emerald-100">
          <div className="text-emerald-600 font-bold text-sm">{street.resolved}</div>
          <div className="text-[10px] text-emerald-400 font-medium">Fixed</div>
        </div>
      </div>

      <SegmentedBar
        open={street.open}
        active={street.inProgress}
        fixed={street.resolved}
        total={street.total}
      />
    </div>
  </div>
);

// --- Sub-Component: Standard List Row ---
const StreetRow = ({ street, index }: { street: StreetData, index: number }) => (
  <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-200">

    {/* Rank */}
    <div className="w-6 text-center font-bold text-slate-300 group-hover:text-blue-600 transition-colors text-sm">
      {index + 1}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1.5">
        <h4 className="font-semibold text-slate-700 text-sm truncate pr-2">{street.name}</h4>
        <div className="flex items-center gap-2">
          {street.severity === 'Critical' && <Flame size={12} className="text-red-500" />}
          <span className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
            {street.total}
          </span>
        </div>
      </div>

      <SegmentedBar
        open={street.open}
        active={street.inProgress}
        fixed={street.resolved}
        total={street.total}
      />
    </div>
  </div>
);

// --- Main Component ---
interface StreetIndicatorsProps {
  zone?: string;
  district?: string;
}

export function StreetIndicators({ zone, district }: StreetIndicatorsProps) {
  const [streetData, setStreetData] = useState<StreetData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreetData = async () => {
      setLoading(true);
      const filters = { zone: zone === 'all' ? undefined : zone, district: district === 'all' ? undefined : district };
      const { data } = await getStreetStatistics(undefined, filters);
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
  }, [zone, district]);

  return (
    <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Top Hotspots
          </h2>
          <p className="text-xs text-slate-500 mt-1">Areas with highest report density</p>
        </div>
        <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-blue-600">
          <GripHorizontal size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-400">Analyzing geolocation...</p>
          </div>
        ) : streetData.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">No hotspot data available yet.</p>
          </div>
        ) : (
          <>
            {/* #1 Card */}
            <TopStreetCard street={streetData[0]} />

            {/* List */}
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-4 mb-2">Runner Ups</h5>
              {streetData.slice(1).map((street, idx) => (
                <StreetRow key={street.name} street={street} index={idx + 1} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer Legend */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] font-medium text-slate-500 flex justify-between items-center">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Open</span>
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /> Active</span>
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Fixed</span>
        </div>
        <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline">
          Full Analysis <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}