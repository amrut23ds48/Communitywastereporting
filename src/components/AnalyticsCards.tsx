import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, AlertCircle, CheckCircle2, XCircle,
  ArrowUpRight, ArrowDownRight, Activity,
  MoreHorizontal
} from 'lucide-react';
import { getAnalyticsOverview } from '../db/analytics';

// --- Types ---
interface AnalyticsCardsProps {
  onCardClick: (filter: string) => void;
  refreshKey: number;
  filters?: {
    zone?: string;
    district?: string;
  };
}

// --- Helper: Count Up Animation ---
const useCountUp = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // Ease out quartic
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return count;
};

// --- Sub-Component: Area Chart Background ---
const AreaChartBackground = ({ color, isActive }: { color: string, isActive: boolean }) => {
  return (
    <div className="absolute inset-x-0 bottom-0 h-16 opacity-20 pointer-events-none overflow-hidden rounded-b-2xl">
      <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path
          d="M0,40 L0,20 C15,25 25,10 40,15 C55,20 65,5 80,10 C90,12 100,25 100,25 L100,40 Z"
          fill={`url(#grad-${color})`}
          className="transition-all duration-1000 ease-out"
          style={{ transform: isActive ? 'scaleY(1.1)' : 'scaleY(1)' }}
        />
        <path
          d="M0,20 C15,25 25,10 40,15 C55,20 65,5 80,10 C90,12 100,25"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          className="opacity-60"
        />
      </svg>
    </div>
  );
};

// --- Sub-Component: Stat Card ---
const StatCard = ({
  title,
  value,
  label,
  icon: Icon,
  filter,
  theme,
  isActive,
  onClick,
  trend
}: any) => {
  const animatedValue = useCountUp(value);

  return (
    <button
      onClick={() => onClick(filter)}
      className={`
        relative w-full text-left rounded-2xl p-6 transition-all duration-300 ease-out group overflow-hidden
        bg-white border
        ${isActive
          ? `ring-2 ring-offset-2 border-transparent ${theme.ring}`
          : 'border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1'
        }
      `}
    >
      {/* Background Decor */}
      <AreaChartBackground color={theme.hex} isActive={isActive} />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text}`}>
            <Icon size={22} strokeWidth={2.5} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {trend.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend.value}
            </div>
          )}
        </div>

        {/* Metric */}
        <div>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight tabular-nums">
            {animatedValue.toLocaleString()}
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
        </div>

        {/* Footer Label */}
        <div className="mt-4 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
          <span className="text-xs text-slate-400 font-medium">{label}</span>
        </div>
      </div>
    </button>
  );
};

// --- Main Component ---
export function AnalyticsCards({ onCardClick, refreshKey = 0, activeFilter = 'all', filters }: AnalyticsCardsProps) {
  const [stats, setStats] = useState({
    totalReports: 0, openReports: 0, resolvedReports: 0, falseReports: 0, thisMonthChange: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await getAnalyticsOverview(filters);
        if (data && isMounted) setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, [refreshKey, filters?.zone, filters?.district]);

  // Configuration for cards
  const cardConfig = useMemo(() => [
    {
      id: 'total',
      title: 'Total Reports',
      value: stats.totalReports,
      label: 'System wide',
      icon: Activity,
      filter: 'all',
      trend: { value: `${stats.thisMonthChange}%`, isPositive: stats.thisMonthChange >= 0 },
      theme: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        ring: 'ring-blue-500',
        dot: 'bg-blue-500',
        hex: '#3b82f6' // blue-500
      }
    },
    {
      id: 'open',
      title: 'Open Issues',
      value: stats.openReports,
      label: 'Needs attention',
      icon: AlertCircle,
      filter: 'open',
      trend: null,
      theme: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        ring: 'ring-orange-500',
        dot: 'bg-orange-500',
        hex: '#f97316' // orange-500
      }
    },
    {
      id: 'resolved',
      title: 'Resolved',
      value: stats.resolvedReports,
      label: 'Fixed this month',
      icon: CheckCircle2,
      filter: 'resolved',
      trend: { value: 'High', isPositive: true },
      theme: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        ring: 'ring-emerald-500',
        dot: 'bg-emerald-500',
        hex: '#10b981' // emerald-500
      }
    },
    {
      id: 'false',
      title: 'False Flags',
      value: stats.falseReports,
      label: 'Invalid reports',
      icon: XCircle,
      filter: 'false_report',
      trend: null,
      theme: {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        ring: 'ring-rose-500',
        dot: 'bg-rose-500',
        hex: '#f43f5e' // rose-500
      }
    },
  ], [stats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 rounded-2xl bg-white border border-slate-100 p-6 flex flex-col justify-between animate-pulse">
            <div className="flex justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
              <div className="w-12 h-6 rounded-full bg-slate-100" />
            </div>
            <div className="space-y-2">
              <div className="w-20 h-8 rounded bg-slate-100" />
              <div className="w-32 h-4 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-2">
      {cardConfig.map((card, index) => (
        <StatCard
          key={card.id}
          {...card}
          isActive={activeFilter === card.filter}
          onClick={onCardClick}
          index={index}
        />
      ))}
    </div>
  );
}