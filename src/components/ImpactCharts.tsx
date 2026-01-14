import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';

interface ImpactChartsProps {
    incidents: {
        created_at: string;
        status: string;
        category: string;
    }[];
}

const COLORS = ['#F43F5E', '#F97316', '#EAB308', '#3B82F6', '#8B5CF6']; // Rose, Orange, Yellow, Blue, Violet

export function ImpactCharts({ incidents }: ImpactChartsProps) {

    // 1. Process Trend Data (Last 7 Days)
    const trendData = useMemo(() => {
        const days: Record<string, { date: string; open: number; resolved: number }> = {};

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            days[key] = { date: key, open: 0, resolved: 0 };
        }

        incidents.forEach(inc => {
            const d = new Date(inc.created_at);
            const key = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            if (days[key]) {
                if (inc.status === 'resolved') days[key].resolved++;
                else days[key].open++;
            }
        });

        return Object.values(days);
    }, [incidents]);

    // 2. Process Category Data
    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        incidents.forEach(inc => {
            const cat = inc.category || 'General';
            counts[cat] = (counts[cat] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
    }, [incidents]);

    if (incidents.length === 0) return (
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            Gathering impact data...
        </div>
    );

    return (
        <div className="space-y-6">

            {/* Chart 1: Resolution Impact Trend */}
            <div className="bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Weekly Impact Activity</h4>
                <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="open"
                                stroke="#F43F5E"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorOpen)"
                                name="New Reports"
                            />
                            <Area
                                type="monotone"
                                dataKey="resolved"
                                stroke="#10B981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorResolved)"
                                name="Resolved"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 2: Crisis Distribution */}
            <div className="bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Crisis Types</h4>
                    <p className="text-xs text-slate-400 mb-2">Distribution by category</p>
                    <div className="space-y-1">
                        {categoryData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="capitalize">{entry.name}</span>
                                <span className="text-slate-400">({entry.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-24 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                innerRadius={25}
                                outerRadius={40}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                wrapperStyle={{ fontSize: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
