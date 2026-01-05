import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Download, 
  BarChart3, Target, TrendingUp, Filter, Calendar,
  MoreHorizontal, Zap, Layers
} from 'lucide-react';
import { getMonthlyInsights, getCurrentMonthWeeklyStats } from '../db/analytics';

// --- Interfaces ---
interface ChartData {
  month: string;
  reports: number;
  resolved: number;
  open: number;
  efficiency: number;
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
                <span className="w-2 h-2 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-500 font-medium capitalize">{entry.name}</span>
              </div>
              <span className="font-bold text-slate-800 font-mono text-sm">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                <span className="text-[10px] text-slate-400 ml-0.5">{entry.unit || ''}</span>
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
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
          isPositive 
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
export function MonthlyInsights() {
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Enhanced Mock Data for Visuals
  const wasteComposition = [
    { name: 'Organic', value: 45, color: '#10B981' }, // Emerald-500
    { name: 'Plastic', value: 30, color: '#3B82F6' }, // Blue-500
    { name: 'Paper', value: 15, color: '#F59E0B' },   // Amber-500
    { name: 'Glass', value: 5, color: '#6366F1' },    // Indigo-500
    { name: 'Metal', value: 5, color: '#64748B' },    // Slate-500
  ];

  const efficiencyData = [
    { day: 'Mon', rate: 92 }, { day: 'Tue', rate: 88 },
    { day: 'Wed', rate: 95 }, { day: 'Thu', rate: 85 },
    { day: 'Fri', rate: 89 }, { day: 'Sat', rate: 75 },
    { day: 'Sun', rate: 82 },
  ];

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [monthlyRes, weeklyRes] = await Promise.all([
        getMonthlyInsights(timeRange === '12m' ? 12 : 6),
        getCurrentMonthWeeklyStats()
      ]);

      if (monthlyRes.data) {
        const transformed = monthlyRes.data.map(item => ({
          month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
          reports: item.total,
          resolved: item.resolved,
          open: item.open,
          efficiency: item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0,
        }));
        setMonthlyData(transformed);
      }

      if (weeklyRes.data) setWeeklyData(weeklyRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    if (!monthlyData.length) return { total: 0, resolvedRate: 0, active: 0, trend: '0%' };
    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : current;
    
    return {
      total: current.reports,
      resolvedRate: current.reports > 0 ? Math.round((current.resolved / current.reports) * 100) : 0,
      active: current.open,
      trend: previous.reports > 0 
        ? ((current.reports - previous.reports) / previous.reports * 100).toFixed(1) + '%' 
        : '0%'
    };
  }, [monthlyData]);

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center rounded-3xl bg-white border border-slate-100">
        
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-4 shadow-lg shadow-emerald-100"/>
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

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- MAIN CHART --- */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col h-[500px]">
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
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
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

        {/* --- SECONDARY CHARTS COLUMN --- */}
        <div className="space-y-6">
          
          {/* Waste Composition */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col h-[240px]">
            <div className="flex justify-between items-start mb-2">
               <h3 className="font-bold text-slate-800">Composition</h3>
               <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={16} /></button>
            </div>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={wasteComposition}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {wasteComposition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                      verticalAlign="middle" 
                      align="right"
                      layout="vertical"
                      iconType="circle"
                      iconSize={6}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Stat */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-16 pb-1">
                 <span className="text-2xl font-extrabold text-slate-800 leading-none">1.2k</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Tons</span>
              </div>
            </div>
          </div>

          {/* Efficiency Trend */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col h-[236px]">
            <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="font-bold text-slate-800">Efficiency</h3>
                 <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded w-fit mt-1">Excellent (92%)</p>
               </div>
               <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                 <Zap size={16} />
               </div>
            </div>
             <div className="flex-1 min-h-0 -ml-2">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={efficiencyData}>
                    <defs>
                      <linearGradient id="gradientLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} dy={5} />
                    <YAxis hide domain={[60, 100]} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="url(#gradientLine)" 
                      strokeWidth={4} 
                      dot={{ r: 4, fill: '#fff', stroke: '#8B5CF6', strokeWidth: 2 }} 
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#8B5CF6' }}
                    />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}