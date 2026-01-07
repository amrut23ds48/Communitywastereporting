import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Download,
  BarChart3, Target, TrendingUp, Filter, Calendar,
  MoreHorizontal, Layers, Zap
} from 'lucide-react';
import { getMonthlyInsights, getCurrentMonthWeeklyStats, getCompositionAndStatus } from '../db/analytics';

// --- Interfaces ---
interface ChartData {
  month: string;
  reports: number;
  resolved: number;
  open: number;
}

// --- Sub-Component: Custom Chart Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-xl border border-slate-100 p-4 rounded-2xl shadow-xl shadow-slate-200/50 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
        <p className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-slate-500 font-medium capitalize">{entry.name}</span>
              </div>
              <span className="font-bold text-slate-800 font-mono text-sm">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                <span className="text-[10px] text-slate-400 ml-0.5">{entry.unit || ''}</span>
                {/* Show percentage if available (for Pie Charts) */}
                {entry.payload.percent !== undefined && (
                  <span className="text-slate-400 font-normal ml-1">
                    ({(entry.payload.percent * 100).toFixed(1)}%)
                  </span>
                )}
                {/* Recharts sometimes passes percent directly on entry for Pie */}
                {entry.percent !== undefined && (
                  <span className="text-slate-400 font-normal ml-1">
                    ({(entry.percent * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// --- Sub-Component: KPI Card ---
const KPICard = ({ title, value, change, isPositive, icon: Icon, theme, delay }: any) => (
  <div
    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Decorative Background Icon */}
    <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity ${theme.text} transform rotate-12 group-hover:rotate-0 transition-transform duration-500`}>
      <Icon size={100} />
    </div>

    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3.5 rounded-2xl ${theme.bg} ${theme.text} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
        <Icon className="w-6 h-6" />
      </div>
      {change && (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${isPositive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : 'bg-rose-50 text-rose-700 border-rose-100'
          }`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {change}
        </span>
      )}
    </div>
    <div className="relative z-10">
      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
      <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1">
        {title}
        <span className="group-hover:translate-x-1 transition-transform duration-300 opacity-0 group-hover:opacity-100 text-slate-300">→</span>
      </p>
    </div>
  </div>
);

// --- Main Component ---
interface MonthlyInsightsProps {
  zone?: string;
  district?: string;
}

export function MonthlyInsights({ zone, district }: MonthlyInsightsProps) {
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [composition, setComposition] = useState<{ name: string; value: number; color: string }[]>([]);
  const [statusDist, setStatusDist] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, [timeRange, zone, district]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters = { zone: zone === 'all' ? undefined : zone, district: district === 'all' ? undefined : district };

      const [monthlyRes, weeklyRes, compRes] = await Promise.all([
        getMonthlyInsights(timeRange === '12m' ? 12 : 6, filters),
        getCurrentMonthWeeklyStats(filters),
        getCompositionAndStatus(undefined, filters)
      ]);

      if (monthlyRes.data) {
        const transformed = monthlyRes.data.map(item => ({
          month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
          reports: item.total,
          resolved: item.resolved,
          open: item.open,
        }));
        setMonthlyData(transformed);
      }

      if (weeklyRes.data) setWeeklyData(weeklyRes.data);

      if (compRes.composition) {
        const palette: Record<string, string> = {
          organic: '#10B981',
          plastic: '#3B82F6',
          hazard: '#EF4444',
          hazardous: '#EF4444',
          debris: '#F97316',
          construction: '#F97316',
          'e-waste': '#8B5CF6',
          ewaste: '#8B5CF6',
          general: '#64748B',
        };
        const comp = compRes.composition.map(slice => ({
          name: slice.name,
          value: slice.value,
          color: palette[slice.name] || '#14B8A6',
        }));
        setComposition(comp);
      }

      if (compRes.status) {
        const palette: Record<string, string> = {
          open: '#F97316',
          in_progress: '#3B82F6',
          resolved: '#10B981',
          false_report: '#94A3B8',
        };
        const status = compRes.status.map(s => ({
          name: s.name,
          value: s.value,
          color: palette[s.name] || '#64748B',
        }));
        setStatusDist(status);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    if (!monthlyData.length) return { total: 0, resolvedRate: 0, active: 0, trend: '0%' };

    // Aggregates for the selected range
    const totalReports = monthlyData.reduce((acc, curr) => acc + curr.reports, 0);
    const totalResolved = monthlyData.reduce((acc, curr) => acc + curr.resolved, 0);
    const totalActive = monthlyData.reduce((acc, curr) => acc + curr.open, 0);

    // Trend calculation (comparing last month to previous month for immediate trend)
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : currentMonth;

    const trendValue = previousMonth.reports > 0
      ? ((currentMonth.reports - previousMonth.reports) / previousMonth.reports * 100).toFixed(1)
      : '0';

    return {
      total: totalReports,
      resolvedRate: totalReports > 0 ? Math.round((totalResolved / totalReports) * 100) : 0,
      active: totalActive,
      trend: (Number(trendValue) > 0 ? '+' : '') + trendValue + '%'
    };
  }, [monthlyData]);

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center rounded-3xl bg-white border border-slate-100">

        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-4 shadow-lg shadow-emerald-100" />
        <p className="text-slate-400 font-medium animate-pulse">Analyzing Data...</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">

      {/* --- BACKGROUND GRID --- */}
      <div className="absolute inset-0 z-0 pointer-events-none -m-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* --- HEADER --- */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
              Live Data
            </div>
            <span className="text-xs text-slate-400 font-medium">Last updated: Just now</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics Overview</h2>
          <p className="text-slate-500">Monitor city-wide waste management performance.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Chart Type Toggle */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <button
              onClick={() => setChartType('area')}
              className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <TrendingUp size={18} />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <BarChart3 size={18} />
            </button>
          </div>

          {/* Time Filter */}
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 cursor-pointer hover:border-slate-300 transition-colors group">
            <Calendar size={16} className="text-slate-400 group-hover:text-slate-600" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="6m">Last 6 Months</option>
              <option value="12m">Last Year</option>
            </select>
          </div>

          {/* Export Button */}
          <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 transition-all flex items-center gap-2 active:scale-95">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* --- KPI GRID --- */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Reports"
          value={stats.total.toLocaleString()}
          change={stats.trend}
          isPositive={!stats.trend.startsWith('-')}
          icon={Layers}
          theme={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
          delay={0}
        />
        <KPICard
          title="Resolution Rate"
          value={`${stats.resolvedRate}%`}
          change="+2.4%"
          isPositive={true}
          icon={Target}
          theme={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
          delay={100}
        />
        <KPICard
          title="Avg Response"
          value="4.2h"
          change="-15m"
          isPositive={true}
          icon={Zap}
          theme={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
          delay={200}
        />
        <KPICard
          title="Pending Actions"
          value={stats.active}
          change="-5"
          isPositive={true}
          icon={Filter}
          theme={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
          delay={300}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-8">

        {/* --- MAIN CHART (Volume) --- */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col h-[500px] w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Volume Analysis</h3>
              <p className="text-xs text-slate-400 font-medium">Monthly submission vs resolution comparison</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Total
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Resolved
              </span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="reports" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, strokeWidth: 0, fill: '#3B82F6' }} />
                  <Area type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }} />
                </AreaChart>
              ) : (
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={0}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="reports" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="resolved" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- SECONDARY CHARTS GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Waste Composition Graph */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col h-[320px]">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-slate-800">Waste Composition Graph</h3>
                <p className="text-xs text-slate-400 font-medium">Distribution by category</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={16} /></button>
            </div>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={composition}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {composition.map((entry, index) => (
                      <Cell key={`cell-comp-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Stat */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-20 pb-2">
                <span className="text-2xl font-extrabold text-slate-800 leading-none">
                  {composition.reduce((sum, c) => sum + c.value, 0)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Reports</span>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col h-[320px]">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-slate-800">Status Distribution</h3>
                <p className="text-xs text-slate-400 font-medium">Reports by status</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={16} /></button>
            </div>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusDist.map((entry, index) => (
                      <Cell key={`cell-status-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Stat for Status */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-20 pb-2">
                <span className="text-2xl font-extrabold text-slate-800 leading-none">
                  {statusDist.reduce((sum, c) => sum + c.value, 0)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}