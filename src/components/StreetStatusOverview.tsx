import React, { useEffect, useState } from 'react';
import { MapPin, AlertCircle, Clock, CheckCircle, Activity, ArrowRight } from 'lucide-react';

interface StreetStatusOverviewProps {
  streetName: string;
  totalReports: number;
  openReports: number;
  inProgressReports: number;
  resolvedReports: number;
}

// --- Helper: Count Up Animation ---
const useCountUp = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return count;
};

// --- Helper: Background Map Pattern ---
const MapBackground = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
    <path d="M40,0 L40,200 M80,0 L80,200 M120,0 L120,200 M160,0 L160,200 M200,0 L200,200 M240,0 L240,200 M280,0 L280,200 M320,0 L320,200 M360,0 L360,200" stroke="currentColor" strokeWidth="2" />
    <path d="M0,40 L400,40 M0,80 L400,80 M0,120 L400,120 M0,160 L400,160" stroke="currentColor" strokeWidth="2" />
    <circle cx="200" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
  </svg>
);

export function StreetStatusOverview({
  streetName,
  totalReports,
  openReports,
  inProgressReports,
  resolvedReports,
}: StreetStatusOverviewProps) {
  // Prevent division by zero
  const safeTotal = totalReports || 1; 
  const openPercentage = (openReports / safeTotal) * 100;
  const inProgressPercentage = (inProgressReports / safeTotal) * 100;
  const resolvedPercentage = (resolvedReports / safeTotal) * 100;

  const animatedTotal = useCountUp(totalReports);
  const animatedOpen = useCountUp(openReports);
  const animatedProgress = useCountUp(inProgressReports);
  const animatedResolved = useCountUp(resolvedReports);

  return (
    <div className="eco-card relative overflow-hidden rounded-3xl bg-white border border-green-50 shadow-xl transition-all duration-300 hover:shadow-2xl">
      
      {/* 1. Dynamic Backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/30 to-white pointer-events-none" />
      <div className="text-eco-green">
        <MapBackground />
      </div>

      <div className="relative z-10 p-6 md:p-8">
        
        {/* 2. Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 animate-float">
              <MapPin size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{streetName}</h2>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <p className="text-sm font-medium text-gray-500">Live Status Overview</p>
              </div>
            </div>
          </div>

          {/* Total Reports Pill */}
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm border border-gray-100 px-5 py-3 rounded-2xl shadow-sm">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Reports</p>
              <p className="text-3xl font-extrabold text-eco-green tabular-nums leading-none">
                {animatedTotal}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-eco-green/10 flex items-center justify-center text-eco-green">
              <Activity size={20} />
            </div>
          </div>
        </div>

        {/* 3. Detailed Stats Grid (Glassmorphism Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* Open / Critical */}
          <div className="group bg-red-50/50 hover:bg-red-50 border border-red-100/50 hover:border-red-200 rounded-2xl p-4 transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-white rounded-lg text-red-500 shadow-sm">
                <AlertCircle size={20} />
              </div>
              <span className="text-xs font-bold bg-white/80 text-red-600 px-2 py-1 rounded-full">
                {openPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-3xl font-bold text-red-700 tabular-nums">{animatedOpen}</p>
            <p className="text-sm font-medium text-red-600/70">Open Issues</p>
          </div>

          {/* In Progress */}
          <div className="group bg-amber-50/50 hover:bg-amber-50 border border-amber-100/50 hover:border-amber-200 rounded-2xl p-4 transition-all duration-300">
             <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-white rounded-lg text-amber-500 shadow-sm">
                <Clock size={20} />
              </div>
              <span className="text-xs font-bold bg-white/80 text-amber-600 px-2 py-1 rounded-full">
                {inProgressPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-3xl font-bold text-amber-700 tabular-nums">{animatedProgress}</p>
            <p className="text-sm font-medium text-amber-600/70">In Progress</p>
          </div>

          {/* Resolved */}
          <div className="group bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/50 hover:border-emerald-200 rounded-2xl p-4 transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-white rounded-lg text-emerald-500 shadow-sm">
                <CheckCircle size={20} />
              </div>
              <span className="text-xs font-bold bg-white/80 text-emerald-600 px-2 py-1 rounded-full">
                {resolvedPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-3xl font-bold text-emerald-700 tabular-nums">{animatedResolved}</p>
            <p className="text-sm font-medium text-emerald-600/70">Resolved</p>
          </div>
        </div>

        {/* 4. Enhanced Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
             <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                Resolution Efficiency
             </h4>
          </div>

          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner border border-gray-100/50">
            {/* Open Segment */}
            <div 
              className="bg-red-500 h-full hover:bg-red-400 transition-all duration-1000 ease-out relative group"
              style={{ width: `${openPercentage}%` }}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* In Progress Segment */}
            <div 
              className="bg-amber-400 h-full hover:bg-amber-300 transition-all duration-1000 ease-out relative group"
              style={{ width: `${inProgressPercentage}%` }}
            >
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Resolved Segment */}
            <div 
              className="bg-eco-green h-full hover:bg-green-600 transition-all duration-1000 ease-out relative group"
              style={{ width: `${resolvedPercentage}%` }}
            >
                {/* Shine effect on Resolved bar */}
               <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-400 px-1">
             <span>Data updated just now</span>
             <span className="flex items-center gap-1">View Details <ArrowRight size={10} /></span>
          </div>
        </div>

      </div>
    </div>
  );
}