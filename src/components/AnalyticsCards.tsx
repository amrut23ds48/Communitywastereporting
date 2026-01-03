import React, { useState, useEffect, useMemo } from 'react';
import { FileText, AlertCircle, CheckCircle, XCircle, ArrowUpRight, Activity, BarChart2, TrendingDown } from 'lucide-react';
import { getAnalyticsOverview } from '../db/analytics';

// --- Types ---
interface AnalyticsCardsProps {
  onCardClick?: (filter: string) => void;
  refreshKey?: number;
  activeFilter?: string;
}

// --- Helper: Animated Sparkline Wave ---
// Now features a draw animation using CSS stroke-dasharray
const SparklineWave = ({ color, isHero }: { color: string, isHero?: boolean }) => {
  const [draw, setDraw] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setDraw(true), 100);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 w-full h-20 opacity-40 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            {/* Filled Area */}
            <path
                d="M0,25 L0,15 C10,20 20,5 30,12 C40,18 50,10 60,15 C70,20 80,5 90,10 C100,15 100,25 100,25 Z"
                fill={`url(#grad-${color})`}
                className="transition-all duration-1000 ease-out"
                style={{ transform: draw ? 'translateY(0)' : 'translateY(100%)' }}
            />
            {/* Stroke Line (Animated) */}
            <path
                d="M0,15 C10,20 20,5 30,12 C40,18 50,10 60,15 C70,20 80,5 90,10 C100,15"
                fill="none"
                stroke={color}
                strokeWidth="0.5"
                className="transition-all duration-[2000ms] ease-out"
                strokeDasharray="100"
                strokeDashoffset={draw ? '0' : '100'}
            />
        </svg>
    </div>
  );
};

// --- Custom Hook: Number Counter ---
const useCountUp = (end: number, duration: number = 2000) => {
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

// --- Sub-Component: Stat Card ---
const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  filter, 
  cssClasses, 
  isActive, 
  onClick,
  index,
  trend 
}: any) => {
  const animatedValue = useCountUp(value);
  const isHero = filter === 'all';

  return (
    <button
      onClick={() => onClick(filter)}
      className={`
        relative overflow-hidden w-full text-left rounded-3xl transition-all duration-500 ease-out group
        ${isHero 
            ? 'bg-eco-gradient text-white shadow-xl shadow-green-900/10' 
            : `bg-white border border-gray-100 shadow-lg hover:shadow-2xl ${cssClasses.cardGradient}`
        }
        ${isActive && !isHero ? 'ring-2 ring-green-500 ring-offset-2' : ''}
        ${!isHero ? 'hover:-translate-y-2' : 'hover:scale-[1.02]'}
      `}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* 1. Background Pattern */}
      <div className="absolute inset-0 opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      {/* 2. Giant Decorative Icon (Faded Background) */}
      <div className={`absolute -right-6 -top-6 opacity-[0.07] transition-transform duration-700 ease-in-out group-hover:rotate-12 group-hover:scale-125 ${isHero ? 'text-white' : cssClasses.iconColor}`}>
         <Icon size={180} />
      </div>

      <div className="relative z-10 p-7 h-full flex flex-col justify-between">
        
        {/* Top Section */}
        <div className="flex justify-between items-start">
            {/* Icon Box */}
          <div className={`
            relative p-3.5 rounded-2xl backdrop-blur-md border border-white/20 transition-all duration-300 shadow-sm
            ${isHero ? 'bg-white/20 text-white' : `${cssClasses.iconBg} ${cssClasses.iconColor}`}
          `}>
             {/* Pulse Ring for Hero */}
             {isHero && <div className="absolute inset-0 rounded-2xl border border-white/50 animate-ping opacity-50" />}
            <Icon size={28} strokeWidth={2.5} />
          </div>
          
          {/* Trend Badge */}
          <div className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-sm border border-white/10
            ${isHero ? 'bg-white/20 text-white' : `${cssClasses.trendBg} ${cssClasses.trendColor}`}
          `}>
            {trend.isPositive ? <ArrowUpRight size={14} strokeWidth={3} /> : <TrendingDown size={14} strokeWidth={3} />}
            {trend.value}
          </div>
        </div>

        {/* Middle Section: Stats */}
        <div className="mt-8 mb-6">
          <h3 className={`text-5xl font-black tracking-tight tabular-nums drop-shadow-sm ${isHero ? 'text-white' : 'text-gray-900'}`}>
            {animatedValue.toLocaleString()}
          </h3>
          <p className={`font-bold mt-1 text-lg tracking-wide ${isHero ? 'text-green-50' : 'text-gray-500'}`}>
            {title}
          </p>
        </div>

        {/* Bottom Section: Context */}
        <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
          <span className={`flex h-2 w-2 rounded-full ${isHero ? 'bg-white animate-pulse' : cssClasses.dotColor}`} />
          <span className={isHero ? 'text-green-50' : 'text-gray-400'}>{subtitle}</span>
        </div>
      </div>

      {/* Animated Sparkline */}
      <SparklineWave color={isHero ? '#ffffff' : cssClasses.waveColor} isHero={isHero} />

    </button>
  );
};

// --- Main Component ---
export function AnalyticsCards({ onCardClick, refreshKey = 0, activeFilter = 'all' }: AnalyticsCardsProps) {
  const [stats, setStats] = useState({
    totalReports: 0, openReports: 0, resolvedReports: 0, falseReports: 0, thisMonthChange: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await getAnalyticsOverview();
        if (data && isMounted) setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, [refreshKey]);

  const cards = useMemo(() => [
    {
      title: 'Total Reports',
      value: stats.totalReports,
      subtitle: 'Recorded in system',
      icon: Activity,
      filter: 'all',
      trend: { value: `${stats.thisMonthChange}% Growth`, isPositive: stats.thisMonthChange >= 0 },
      cssClasses: {
        waveColor: '#ffffff'
      }
    },
    {
      title: 'Open Reports',
      value: stats.openReports,
      subtitle: 'Action required',
      icon: AlertCircle,
      filter: 'open',
      trend: { value: 'Critical', isPositive: false },
      cssClasses: {
        cardGradient: 'bg-gradient-to-br from-white to-orange-50/50 hover:to-orange-100/50',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        trendBg: 'bg-orange-50',
        trendColor: 'text-orange-700',
        dotColor: 'bg-orange-500',
        waveColor: '#ea580c' // Orange-600
      }
    },
    {
      title: 'Resolved',
      value: stats.resolvedReports,
      subtitle: 'Successfully closed',
      icon: CheckCircle,
      filter: 'resolved',
      trend: { value: 'Excellent', isPositive: true },
      cssClasses: {
        cardGradient: 'bg-gradient-to-br from-white to-emerald-50/50 hover:to-emerald-100/50',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        trendBg: 'bg-emerald-50',
        trendColor: 'text-emerald-700',
        dotColor: 'bg-emerald-500',
        waveColor: '#059669' // Emerald-600
      }
    },
    {
      title: 'False Flags',
      value: stats.falseReports,
      subtitle: 'Marked invalid',
      icon: XCircle,
      filter: 'false_report',
      trend: { value: 'Low Priority', isPositive: true },
      cssClasses: {
        cardGradient: 'bg-gradient-to-br from-white to-red-50/50 hover:to-red-100/50',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        trendBg: 'bg-red-50',
        trendColor: 'text-red-700',
        dotColor: 'bg-red-500',
        waveColor: '#dc2626' // Red-600
      }
    },
  ], [stats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 rounded-3xl bg-gray-100 animate-pulse border border-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-2">
      {cards.map((card, index) => (
        <StatCard
          key={card.title}
          {...card}
          isActive={activeFilter === card.filter}
          onClick={onCardClick}
          index={index}
        />
      ))}
    </div>
  );
}