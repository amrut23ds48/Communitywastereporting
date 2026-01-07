import React, { useState, useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { getCompositionAndStatus } from '../db/analytics';

interface WasteCompositionWidgetProps {
    zone?: string;
    district?: string;
    className?: string;
}

export const WasteCompositionWidget = ({ zone = 'all', district = 'all', className = '' }: WasteCompositionWidgetProps) => {
    const [data, setData] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const now = new Date();
            const startDate = new Date();

            if (timeRange === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else {
                startDate.setMonth(now.getMonth() - 1);
            }

            const filters = {
                zone: zone === 'all' ? undefined : zone,
                district: district === 'all' ? undefined : district
            };

            try {
                const { composition } = await getCompositionAndStatus(startDate, filters);

                if (composition) {
                    // Calculate percentages
                    const total = composition.reduce((sum, item) => sum + item.value, 0);
                    const processed = composition
                        .map(item => ({
                            ...item,
                            pct: total > 0 ? Math.round((item.value / total) * 100) : 0,
                            // Map colors based on type
                            color: getWasteColor(item.name),
                            sub: getWasteDestination(item.name)
                        }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 4); // Top 4

                    setData(processed);
                }
            } catch (error) {
                console.error('Error fetching waste composition:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeRange, zone, district]);

    const getWasteColor = (type: string) => {
        const map: any = {
            organic: 'bg-green-500',
            plastic: 'bg-blue-500',
            hazardous: 'bg-red-500',
            'e-waste': 'bg-purple-500',
            debris: 'bg-orange-500',
            general: 'bg-gray-500'
        };
        return map[type.toLowerCase()] || 'bg-gray-500';
    };

    const getWasteDestination = (type: string) => {
        const map: any = {
            organic: 'Composting Units',
            plastic: 'Recycling Center',
            hazardous: 'Special Treatment',
            'e-waste': 'Recovery Facility',
            debris: 'Landfill Site',
            general: 'Main Dump Site'
        };
        return map[type.toLowerCase()] || 'Sorting Center';
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-purple-600" />
                    Waste Composition
                </h3>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as 'week' | 'month')}
                    className="bg-gray-50 border border-gray-200 text-xs font-medium rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-gray-100"
                >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                </select>
            </div>

            <div className="space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs py-10">No recent data</div>
                ) : (
                    data.map((item: any) => (
                        <div key={item.name}>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="font-bold text-gray-700 capitalize truncate max-w-[120px]" title={item.name}>{item.name}</span>
                                <span className="text-gray-500 font-mono">{item.pct}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.pct}%` }}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 text-right truncate pl-4" title={`Dest: ${item.sub}`}>Dest: {item.sub}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
