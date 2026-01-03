import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Calendar, Download, 
  Filter, CheckCircle2, AlertCircle, Clock, 
  BarChart3, PieChart as PieChartIcon, Target, TrendingUp 
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
      <div className="bg-white/95 backdrop-blur-xl border border-slate-100 p-4 rounded-2xl shadow-xl ring-1 ring-black/5">
        <p className="text-sm font-bold text-slate-800 mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-500 capitalize font-medium">{entry.name}</span>
              </div>
              <span className="font-bold text-slate-700 font-mono">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                {entry.unit || ''}
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
const KPICard = ({ title, value, change, isPositive, icon: Icon, theme }: any) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${theme.bg} ${theme.text} group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      {change && (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${
          isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {change}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
      <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">{title}</p>
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

  // Mock Data for Visuals (In real app, this might come from DB)
  const wasteComposition = [
    { name: 'Organic', value: 45, color: '#10B981' }, // Emerald
    { name: 'Plastic', value: 30, color: '#3B82F6' }, // Blue
    { name: 'Paper', value: 15, color: '#F59E0B' },   // Amber
    { name: 'Glass', value: 5, color: '#6366F1' },    // Indigo
    { name: 'Metal', value: 5, color: '#64748B' },    // Slate
  ];

  const efficiencyData = [
    { day: 'Mon', rate: 92 },
    { day: 'Tue', rate: 88 },
    { day: 'Wed', rate: 95 },
    { day: 'Thu', rate: 85 },
    { day: 'Fri', rate: 89 },
    { day: 'Sat', rate: 75 },
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
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"/>
        <p className="text-slate-400 font-medium">Loading Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Performance Analytics</h2>
          <p className="text-sm text-slate-500">Overview of waste management metrics</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex bg-slate-100 rounded-lg p-1">
             <button 
               onClick={() => setChartType('area')}
               className={`p-2 rounded-md transition-all ${chartType === 'area' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <TrendingUp size={16} />
             </button>
             <button 
               onClick={() => setChartType('bar')}
               className={`p-2 rounded-md transition-all ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <BarChart3 size={16} />
             </button>
           </div>
           <div className="w-px h-6 bg-slate-200 mx-1" />
           <select 
             value={timeRange} 
             onChange={(e) => setTimeRange(e.target.value)}
             className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer pr-2"
           >
             <option value="6m">Last 6 Months</option>
             <option value="12m">Last Year</option>
           </select>
           <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
             <Download size={18} />
           </button>
        </div>
      </div>

      {/* 2. KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Reports" 
          value={stats.total} 
          change={stats.trend} 
          isPositive={!stats.trend.startsWith('-')} 
          icon={BarChart3}
          theme={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
        />
        <KPICard 
          title="Resolution Rate" 
          value={`${stats.resolvedRate}%`} 
          change="+2.4%" 
          isPositive={true} 
          icon={Target}
          theme={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
        />
        <KPICard 
          title="Avg Response Time" 
          value="4.2 Hrs" 
          change="-15m" 
          isPositive={true} 
          icon={Clock}
          theme={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
        />
        <KPICard 
          title="Pending Actions" 
          value={stats.active} 
          change="-5" 
          isPositive={true} 
          icon={AlertCircle}
          theme={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3. Main Trend Chart (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-slate-800">Report Volume Trends</h3>
             <div className="flex items-center gap-2 text-xs font-medium">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Total</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Resolved</span>
             </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="reports" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="Total" />
                  <Area type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
                </AreaChart>
              ) : (
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="reports" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="resolved" fill="#10B981" radius={[4, 4, 0, 0]} name="Resolved" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Secondary Charts Column */}
        <div className="space-y-6">
          
          {/* Waste Composition */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-[45%] min-h-[250px]">
            <h3 className="font-bold text-slate-800 mb-2">Waste Composition</h3>
            <div className="flex-1 min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={wasteComposition}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {wasteComposition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                     verticalAlign="middle" 
                     align="right"
                     layout="vertical"
                     iconType="circle"
                     iconSize={8}
                     wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-14">
                 <div className="text-center">
                    <span className="block text-2xl font-bold text-slate-800">1.2k</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Tons</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Efficiency Line */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-[45%] min-h-[250px]">
            <h3 className="font-bold text-slate-800 mb-2">Efficiency Trend (7d)</h3>
             <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis hide domain={[60, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#8B5CF6" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }} 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      name="Efficiency (%)"
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