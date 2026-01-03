import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, LineChart, Line
} from 'recharts';
import { 
  Loader2, ArrowUpRight, ArrowDownRight, Calendar, 
  Download, Filter, Zap, CheckCircle, Clock, AlertCircle, TrendingUp,
  Users, Recycle, Target, Award, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { getMonthlyInsights, getCurrentMonthWeeklyStats } from '../db/analytics';

interface ChartData {
  month: string;
  reports: number;
  resolved: number;
  open: number;
  inProgress: number;
  efficiency: number;
}

const KPICard = ({ title, value, change, isPositive, icon: Icon, color, trendData }: any) => (
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-br from-white to-emerald-50 rounded-2xl transform group-hover:scale-[1.02] transition-transform duration-300"></div>
    <div className="relative p-6 rounded-2xl border border-emerald-100 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className={`p-3 rounded-xl ${color} bg-opacity-10 w-12 h-12 flex items-center justify-center mb-3`}>
            <Icon className="w-6 h-6" style={{ color: color.replace('bg-', '') }} />
          </div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        </div>
        {trendData && (
          <div className="text-right">
            <div className="h-12 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={isPositive ? '#10B981' : '#EF4444'} 
                    fill={isPositive ? 'url(#positiveGradient)' : 'url(#negativeGradient)'}
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-900 bg-clip-text text-transparent">
            {value}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${
              isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {change}
            </span>
            <span className="text-xs text-gray-400">vs last period</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-emerald-100 p-4 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-sm font-bold text-gray-800 mb-3 border-b border-emerald-50 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 text-sm mb-2 last:mb-0">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600 capitalize">{entry.name}:</span>
            </div>
            <span className="font-bold text-gray-800">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function MonthlyInsights() {
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m');
  const [chartType, setChartType] = useState('area');

  const wasteComposition = [
    { name: 'Organic Waste', value: 45, color: '#10B981', icon: '🍂' },
    { name: 'Plastic', value: 30, color: '#3B82F6', icon: '🥤' },
    { name: 'Paper/Cardboard', value: 15, color: '#F59E0B', icon: '📦' },
    { name: 'E-Waste', value: 5, color: '#8B5CF6', icon: '💻' },
    { name: 'Metal', value: 3, color: '#6B7280', icon: '⚙️' },
    { name: 'Glass', value: 2, color: '#0EA5E9', icon: '🥃' },
  ];

  const efficiencyData = [
    { day: 'Mon', efficiency: 85 },
    { day: 'Tue', efficiency: 88 },
    { day: 'Wed', efficiency: 92 },
    { day: 'Thu', efficiency: 87 },
    { day: 'Fri', efficiency: 90 },
    { day: 'Sat', efficiency: 82 },
    { day: 'Sun', efficiency: 78 },
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
          inProgress: item.inProgress,
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

  const stats = useMemo(() => {
    if (!monthlyData.length) return { total: 0, resolvedRate: 0, active: 0, efficiency: 0 };
    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : current;
    
    const total = current.reports;
    const resolvedRate = total > 0 ? Math.round((current.resolved / total) * 100) : 0;
    const efficiencyChange = previous ? current.efficiency - previous.efficiency : 0;
    
    return {
      total,
      resolvedRate,
      active: current.open + current.inProgress,
      efficiency: current.efficiency,
      efficiencyChange,
      totalChange: previous ? ((current.reports - previous.reports) / previous.reports * 100).toFixed(1) : '0.0'
    };
  }, [monthlyData]);

  const trendData = [
    { day: '1', value: 45 },
    { day: '2', value: 52 },
    { day: '3', value: 48 },
    { day: '4', value: 55 },
    { day: '5', value: 60 },
    { day: '6', value: 58 },
  ];

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 min-h-[500px] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-100 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
        <div className="text-center">
          <p className="text-emerald-600 font-medium">Crunching the numbers...</p>
          <p className="text-sm text-gray-500 mt-1">Analyzing waste management data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-900 bg-clip-text text-transparent">
            Advanced Analytics
          </h2>
          <p className="text-gray-600 mt-2">Comprehensive insights into waste management efficiency</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-emerald-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-700 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              <option value="6m">Last 6 Months</option>
              <option value="12m">Last 12 Months</option>
              <option value="ytd">Year to Date</option>
            </select>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 group-hover:text-emerald-600" />
          </div>
          
          <div className="flex bg-emerald-50 p-1 rounded-xl">
            {['area', 'bar', 'line'].map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartType === type 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-emerald-600 hover:text-emerald-700'
                }`}
              >
                {type === 'area' ? 'Area' : type === 'bar' ? 'Bar' : 'Line'}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Reports" 
          value={stats.total.toLocaleString()} 
          change={`${stats.totalChange}%`} 
          icon={BarChart3}
          color="bg-blue-500"
          trendData={trendData}
        />
        <KPICard 
          title="Resolution Rate" 
          value={`${stats.resolvedRate}%`} 
          change={`${stats.efficiencyChange}%`} 
          icon={CheckCircle}
          color="bg-emerald-500"
          trendData={trendData.map(d => ({ ...d, value: d.value * 1.5 }))}
        />
        <KPICard 
          title="Active Issues" 
          value={stats.active} 
          change="-8.2%" 
          isPositive={false} 
          icon={AlertCircle}
          color="bg-amber-500"
          trendData={trendData.map(d => ({ ...d, value: d.value * 0.8 }))}
        />
        <KPICard 
          title="Avg Response" 
          value="4.2h" 
          change="-18m" 
          isPositive={true} 
          icon={Clock}
          color="bg-purple-500"
          trendData={trendData.map(d => ({ ...d, value: d.value * 0.6 }))}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Volume Trends */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Report Volume Trends</h3>
              <p className="text-sm text-emerald-600">Monthly report vs resolution comparison</p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="reports" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    fill="url(#colorReports)" 
                    name="Total Reports"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    fill="url(#colorResolved)" 
                    name="Resolved"
                  />
                </AreaChart>
              ) : chartType === 'bar' ? (
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="reports" fill="#3B82F6" name="Reports" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="#10B981" name="Resolved" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="reports" stroke="#3B82F6" strokeWidth={3} dot={false} name="Reports" />
                  <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} dot={false} name="Resolved" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste Composition */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Waste Composition</h3>
              <p className="text-sm text-emerald-600">Distribution by waste category</p>
            </div>
            <Recycle className="w-5 h-5 text-emerald-500" />
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                innerRadius="20%" 
                outerRadius="90%" 
                data={wasteComposition} 
                startAngle={180} 
                endAngle={0}
              >
                <RadialBar 
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }} 
                  background 
                  dataKey="value" 
                >
                  {wasteComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RadialBar>
                <Legend 
                  iconSize={10} 
                  layout="vertical" 
                  verticalAlign="middle" 
                  wrapperStyle={{ right: -20 }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            {wasteComposition.map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                <div className="text-2xl">{item.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ width: `${item.value}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Efficiency & Weekly Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Efficiency */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Weekly Efficiency</h3>
              <p className="text-sm text-emerald-600">Daily resolution efficiency rate</p>
            </div>
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiencyData}>
                <defs>
                  <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  domain={[70, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Efficiency']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  fill="url(#efficiencyGradient)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Performance */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Weekly Performance</h3>
              <p className="text-sm text-emerald-600">Current week's report status breakdown</p>
            </div>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="resolved" stackId="a" fill="#10B981" name="Resolved" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inProgress" stackId="a" fill="#F59E0B" name="In Progress" />
                <Bar dataKey="open" stackId="a" fill="#EF4444" name="Open" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center gap-6 mt-6">
            {[
              { label: 'Resolved', value: weeklyData.reduce((a, b) => a + (b.resolved || 0), 0), color: '#10B981' },
              { label: 'In Progress', value: weeklyData.reduce((a, b) => a + (b.inProgress || 0), 0), color: '#F59E0B' },
              { label: 'Open', value: weeklyData.reduce((a, b) => a + (b.open || 0), 0), color: '#EF4444' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl font-bold" style={{ color: item.color }}>
                  {item.value}
                </div>
                <div className="text-sm text-gray-600">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}