import React, { useEffect, useState } from 'react';
import { getResources } from '../../db/resources';
import { Resource } from '../../types';
import { MapPin, Phone, Box, Truck, HeartPulse, Search, Shield } from 'lucide-react';

export function SafePlacesView() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        async function load() {
            const { data } = await getResources();
            if (data) setResources(data);
            setLoading(false);
        }
        load();
    }, []);

    const filtered = resources.filter(r => filter === 'all' || r.type === filter);

    const getIcon = (type: string) => {
        if (type === 'ambulance') return <Truck className="text-blue-500" />;
        if (type === 'medical') return <HeartPulse className="text-rose-500" />;
        if (type === 'supplies') return <Box className="text-emerald-500" />;
        return <Shield className="text-slate-500" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Safe Places & Resources</h2>
                <div className="flex gap-2">
                    {['all', 'shelter', 'food', 'medical'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${filter === f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading resources...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(r => (
                        <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    {getIcon(r.type)}
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${r.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {r.status}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-1">{r.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 capitalize">{r.type} • {r.quantity} Units</p>

                            <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span>Location Map Pin</span>
                                </div>
                                {r.contact_info && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span>{r.contact_info}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
