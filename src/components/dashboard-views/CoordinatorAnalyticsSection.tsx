import React, { useEffect, useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import {
    AlertTriangle, MapPin, TrendingUp, TrendingDown, Clock, CheckCircle,
    Truck, Activity, Target, Zap, Shield, Flame, Users
} from 'lucide-react';
import { getStreetStatistics, getCompositionAndStatus, getMonthlyInsights, getCurrentMonthWeeklyStats, getAnalyticsOverview } from '../../db/analytics';
import { getResources } from '../../db/resources';

interface AnalyticsSectionProps {
    zone?: string;
    district?: string;
    refreshKey?: number;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-xl border border-slate-100 p-4 rounded-2xl shadow-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                        <span className="text-slate-600 capitalize">{entry.name}:</span>
                        <span className="font-bold text-slate-800">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Dummy resource data for demo
const DUMMY_RESOURCE_STATS = [
    { name: 'Ambulance', available: 12, dispatched: 5, total: 17 },
    { name: 'Personnel', available: 45, dispatched: 23, total: 68 },
    { name: 'Equipment', available: 8, dispatched: 3, total: 11 },
    { name: 'Supplies', available: 150, dispatched: 50, total: 200 },
    { name: 'Shelter', available: 3, dispatched: 1, total: 4 },
];

export function CoordinatorAnalyticsSection({ zone, district, refreshKey }: AnalyticsSectionProps) {
    const [loading, setLoading] = useState(true);
    const [criticalAreas, setCriticalAreas] = useState<any[]>([]);
    const [statusDist, setStatusDist] = useState<any[]>([]);
    const [categoryDist, setCategoryDist] = useState<any[]>([]);
    const [weeklyData, setWeeklyData] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [overview, setOverview] = useState<any>(null);
    const [resourceStats, setResourceStats] = useState(DUMMY_RESOURCE_STATS);

    useEffect(() => {
        fetchAllData();
    }, [zone, district, refreshKey]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const filters = { zone: zone === 'all' ? undefined : zone, district: district === 'all' ? undefined : district };

            const [streetRes, compRes, monthlyRes, weeklyRes, overviewRes, resourcesRes] = await Promise.all([
                getStreetStatistics(undefined, filters),
                getCompositionAndStatus(undefined, filters),
                getMonthlyInsights(6, filters),
                getCurrentMonthWeeklyStats(filters),
                getAnalyticsOverview(filters),
                getResources()
            ]);

            // Critical Areas - streets with most open/active incidents
            if (streetRes.data) {
                const sorted = streetRes.data
                    .sort((a, b) => (b.openReports + b.inProgressReports) - (a.openReports + a.inProgressReports))
                    .slice(0, 5);
                setCriticalAreas(sorted);
            }

            // Status Distribution for Pie Chart
            if (compRes.status) {
                const palette: Record<string, string> = {
                    open: '#F97316',
                    dispatched: '#F59E0B',
                    on_scene: '#3B82F6',
                    resolved: '#10B981',
                    false_report: '#94A3B8',
                };
                setStatusDist(compRes.status.map(s => ({
                    name: formatStatusName(s.name),
                    value: s.value,
                    color: palette[s.name] || '#64748B',
                })));
            }

            // Category Distribution
            if (compRes.composition) {
                const palette: Record<string, string> = {
                    fire: '#DC2626',
                    medical: '#2563EB',
                    crime: '#1F2937',
                    natural_disaster: '#D97706',
                    accident: '#9333EA',
                    infrastructure: '#4B5563',
                    general: '#64748B',
                    other: '#64748B',
                };
                setCategoryDist(compRes.composition.map(c => ({
                    name: c.name.charAt(0).toUpperCase() + c.name.slice(1),
                    value: c.value,
                    color: palette[c.name] || '#14B8A6',
                })));
            }

            // Monthly data for trend chart
            if (monthlyRes.data) {
                setMonthlyData(monthlyRes.data.map(m => ({
                    month: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                    total: m.total,
                    resolved: m.resolved,
                    active: m.inProgress + m.open,
                })));
            }

            // Weekly data for bar chart
            if (weeklyRes.data) {
                setWeeklyData(weeklyRes.data);
            }

            // Overview
            if (overviewRes.data) {
                setOverview(overviewRes.data);
            }

            // Resources - use real if available, otherwise dummy
            if (resourcesRes.data && resourcesRes.data.length > 0) {
                const typeMap = new Map();
                resourcesRes.data.forEach(r => {
                    const existing = typeMap.get(r.type) || { available: 0, dispatched: 0, total: 0 };
                    existing.total++;
                    if (r.status === 'available') existing.available++;
                    if (r.status === 'dispatched') existing.dispatched++;
                    typeMap.set(r.type, existing);
                });
                const stats = Array.from(typeMap.entries()).map(([name, data]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    ...data
                }));
                if (stats.length > 0) setResourceStats(stats);
            }

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatStatusName = (status: string) => {
        return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    // Calculate response rate
    const responseRate = useMemo(() => {
        if (!overview) return 0;
        const totalHandled = overview.resolvedIncidents + overview.activeIncidents;
        return overview.totalIncidents > 0 ? Math.round((totalHandled / overview.totalIncidents) * 100) : 0;
    }, [overview]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
                            <div className="h-4 w-1/3 bg-slate-100 rounded mb-4"></div>
                            <div className="h-40 bg-slate-50 rounded-xl"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Analytics & Insights</h2>
                        <p className="text-sm text-slate-500">Real-time crisis monitoring data</p>
                    </div>
                </div>
                <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    LIVE DATA
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* 1. Critical Areas Card */}
                <div className="bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-rose-200 rounded-2xl p-6 shadow-sm xl:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-rose-500 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Critical Areas</h3>
                            <p className="text-xs text-slate-500">Highest incident concentration</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {criticalAreas.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">No critical areas</div>
                        ) : (
                            criticalAreas.map((area, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-rose-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-rose-500 text-white' : i === 1 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 truncate max-w-[120px]">{area.streetName}</p>
                                            <p className="text-xs text-slate-500">{area.city}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-rose-600">{area.openReports + area.inProgressReports}</p>
                                        <p className="text-[10px] text-slate-400 uppercase">Active</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Status Distribution Pie Chart */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-slate-900">Status Distribution</h3>
                            <p className="text-xs text-slate-500">Incidents by current status</p>
                        </div>
                        <Target className="w-5 h-5 text-slate-400" />
                    </div>

                    <div className="h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusDist}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center stat */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-slate-800">{overview?.totalIncidents || 0}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mt-2 justify-center">
                        {statusDist.map((s, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                                <span className="text-slate-600">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Category Breakdown */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-slate-900">Incident Categories</h3>
                            <p className="text-xs text-slate-500">Distribution by type</p>
                        </div>
                        <Flame className="w-5 h-5 text-slate-400" />
                    </div>

                    <div className="space-y-3">
                        {categoryDist.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">No data</div>
                        ) : (
                            categoryDist.slice(0, 5).map((cat, i) => {
                                const total = categoryDist.reduce((s, c) => s + c.value, 0);
                                const percent = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700">{cat.name}</span>
                                            <span className="font-bold text-slate-900">{cat.value} ({percent}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: cat.color }}></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 4. Weekly Activity Bar Chart */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2 xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-slate-900">This Month's Activity</h3>
                            <p className="text-xs text-slate-500">Weekly breakdown of incidents</p>
                        </div>
                        <Clock className="w-5 h-5 text-slate-400" />
                    </div>

                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="open" name="New" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={35} />
                                <Bar dataKey="active" name="Active" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={35} />
                                <Bar dataKey="resolved" name="Resolved" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-2">
                        <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded bg-orange-500"></span> New</div>
                        <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded bg-blue-500"></span> Active</div>
                        <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded bg-emerald-500"></span> Resolved</div>
                    </div>
                </div>

                {/* 5. Resource Availability */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-sm xl:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-indigo-500 rounded-xl">
                            <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Resource Status</h3>
                            <p className="text-xs text-slate-500">Availability overview</p>
                        </div>
                        <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">DEMO</span>
                    </div>

                    <div className="space-y-3">
                        {resourceStats.map((res, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 bg-white/80 rounded-xl border border-indigo-100">
                                <span className="text-sm font-medium text-slate-700">{res.name}</span>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-emerald-600">{res.available}</span>
                                        <span className="text-xs text-slate-400 ml-1">avail</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-amber-600">{res.dispatched}</span>
                                        <span className="text-xs text-slate-400 ml-1">out</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. Monthly Trend Area Chart */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2 xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-slate-900">6-Month Trend</h3>
                            <p className="text-xs text-slate-500">Incident volume over time</p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>

                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="total" name="Total" stroke="#3B82F6" strokeWidth={2} fill="url(#colorTotal)" />
                                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10B981" strokeWidth={2} fill="url(#colorResolved)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-2">
                        <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded bg-blue-500"></span> Total Incidents</div>
                        <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded bg-emerald-500"></span> Resolved</div>
                    </div>
                </div>

                {/* 7. Response Rate Gauge */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-slate-900">Response Rate</h3>
                            <p className="text-xs text-slate-500">% of incidents handled</p>
                        </div>
                        <Zap className="w-5 h-5 text-amber-500" />
                    </div>

                    {/* Circular Progress */}
                    <div className="flex flex-col items-center justify-center h-40">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="56" fill="none" strokeWidth="12" stroke="#f1f5f9" />
                                <circle
                                    cx="64" cy="64" r="56" fill="none" strokeWidth="12"
                                    stroke={responseRate >= 80 ? '#10B981' : responseRate >= 50 ? '#F59E0B' : '#EF4444'}
                                    strokeLinecap="round"
                                    strokeDasharray={`${(responseRate / 100) * 352} 352`}
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-900">{responseRate}%</span>
                                <span className="text-xs text-slate-400 uppercase">Handled</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-2">
                        <p className="text-xs text-slate-500">
                            {overview?.resolvedIncidents || 0} resolved + {overview?.activeIncidents || 0} active
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
