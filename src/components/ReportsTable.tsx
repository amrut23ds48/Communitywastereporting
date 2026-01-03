import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, X, Calendar, MapPin, Search, Download, 
  ChevronLeft, ChevronRight, AlertTriangle, Clock, 
  CheckCircle2, ArrowUpDown, MoreHorizontal, Trash2, 
  Eye, Filter, RefreshCw, ZoomIn, Loader2, Layers,
  SlidersHorizontal, Image as ImageIcon
} from 'lucide-react';
import { getReports, subscribeToReports } from '../db/reports';
import { updateReportStatus, getCurrentAdmin, subscribeToAuthChanges } from '../db/admin';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportStatus = Report['status'];
type SortConfig = { key: keyof Report | 'priority'; direction: 'asc' | 'desc' };

// --- Sub-Component: Enhanced Status Badge ---
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    open: { 
      label: 'Open', 
      className: 'bg-red-50 text-red-700 ring-1 ring-red-600/10', 
      icon: <AlertTriangle className="w-3 h-3" /> 
    },
    in_progress: { 
      label: 'In Progress', 
      className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20', 
      icon: <RefreshCw className="w-3 h-3" /> 
    },
    resolved: { 
      label: 'Resolved', 
      className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20', 
      icon: <CheckCircle2 className="w-3 h-3" /> 
    },
    false_report: { 
      label: 'False Flag', 
      className: 'bg-slate-50 text-slate-600 ring-1 ring-slate-600/20', 
      icon: <X className="w-3 h-3" /> 
    }
  };

  const current = config[status as keyof typeof config] || config.open;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${current.className}`}>
      {current.icon}
      {current.label}
    </span>
  );
};

// --- Sub-Component: Priority Dot ---
const PriorityIndicator = ({ dateStr }: { dateStr: string }) => {
  const getPriority = (date: string) => {
    const hours = (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60);
    if (hours > 48) return { label: 'Critical', color: 'bg-red-500 shadow-red-500/50' };
    if (hours > 24) return { label: 'High', color: 'bg-orange-500 shadow-orange-500/50' };
    if (hours > 12) return { label: 'Medium', color: 'bg-amber-500 shadow-amber-500/50' };
    return { label: 'Low', color: 'bg-emerald-500 shadow-emerald-500/50' };
  };

  const p = getPriority(dateStr);

  return (
    <div className="flex items-center gap-2" title={`${p.label} Priority`}>
      <span className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${p.color}`} />
      <span className="text-xs text-slate-600 font-medium">{p.label}</span>
    </div>
  );
};

interface ReportsTableProps {
  initialFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export function ReportsTable({ initialFilter = 'all', onFilterChange }: ReportsTableProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  
  // UI States
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // --- Initialization ---
  useEffect(() => {
    const fetchAdmin = async () => {
      const { userId } = await getCurrentAdmin();
      setAdminId(userId);
    };
    fetchAdmin();
    const unsubscribe = subscribeToAuthChanges(setAdminId);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchReports();
    const unsubscribe = subscribeToReports(
      () => fetchReports(), 
      filterStatus !== 'all' ? { status: filterStatus as ReportStatus } : undefined
    );
    return () => unsubscribe();
  }, [filterStatus]);

  const fetchReports = async () => {
    if (reports.length === 0) setLoading(true);
    try {
      const { data } = await getReports({
        status: filterStatus === 'all' ? undefined : filterStatus as ReportStatus,
      });
      if (data) setReports(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- Logic Helpers ---
  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    if (!adminId) return;
    setUpdatingId(reportId);
    try {
      await updateReportStatus(reportId, newStatus, adminId);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSort = (key: keyof Report | 'priority') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === processedReports.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(processedReports.map(r => r.id)));
    }
  };

  const toggleRow = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  // --- Data Processing ---
  const processedReports = useMemo(() => {
    let data = [...reports];

    // Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(r => 
        r.street_name?.toLowerCase().includes(q) || 
        r.city?.toLowerCase().includes(q) || 
        r.description?.toLowerCase().includes(q)
      );
    }

    // Sort
    data.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Report];
      const bValue = b[sortConfig.key as keyof Report];
      
      if (sortConfig.key === 'priority') {
        const getAge = (date: string) => new Date().getTime() - new Date(date).getTime();
        return sortConfig.direction === 'asc' 
          ? getAge(a.created_at) - getAge(b.created_at)
          : getAge(b.created_at) - getAge(a.created_at);
      }
      return 0; // Simplified for brevity
    });

    return data;
  }, [reports, searchQuery, sortConfig]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] relative bg-white">
      
      {/* 1. Toolbar Section */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/50 backdrop-blur-sm z-20">
        
        {/* Left: Search & Count */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative group w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Filter by street, city, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm"
            />
          </div>
          
          <div className="hidden md:flex h-6 w-px bg-slate-200" />
          
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{reports.length}</span>
            <span>Total Tickets</span>
          </div>
        </div>

        {/* Right: Segmented Control & Actions */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
            {['all', 'open', 'resolved'].map((t) => (
              <button
                key={t}
                onClick={() => { setFilterStatus(t); onFilterChange?.(t); }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                  filterStatus === t 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button 
            onClick={() => fetchReports()} 
            disabled={loading}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Data Grid */}
      <div className="flex-1 overflow-auto bg-slate-50/30 relative">
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <table className="w-full text-left border-collapse relative z-10">
          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-14">
                <input 
                  type="checkbox" 
                  checked={selectedRows.size === processedReports.length && processedReports.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4" 
                />
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Evidence</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 group" onClick={() => toggleSort('street_name')}>
                <div className="flex items-center gap-1">Location <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 group" onClick={() => toggleSort('priority')}>
                <div className="flex items-center gap-1">Severity <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              // Skeleton Loader
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse bg-white">
                  <td className="p-6"><div className="h-4 w-4 bg-slate-100 rounded" /></td>
                  <td className="p-6"><div className="h-12 w-12 bg-slate-100 rounded-lg" /></td>
                  <td className="p-6"><div className="h-4 w-32 bg-slate-100 rounded mb-2" /><div className="h-3 w-20 bg-slate-50 rounded" /></td>
                  <td className="p-6"><div className="h-4 w-16 bg-slate-100 rounded-full" /></td>
                  <td className="p-6"><div className="h-6 w-20 bg-slate-100 rounded-full" /></td>
                  <td className="p-6 text-right"><div className="h-8 w-8 bg-slate-100 rounded-full ml-auto" /></td>
                </tr>
              ))
            ) : processedReports.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <SlidersHorizontal className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">No reports found</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs">
                      Try adjusting your filters or search query to find what you're looking for.
                    </p>
                    <button 
                      onClick={() => { setFilterStatus('all'); setSearchQuery(''); }}
                      className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Clear filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              processedReports.map((report) => {
                const isSelected = selectedRows.has(report.id);
                return (
                  <tr 
                    key={report.id} 
                    className={`group transition-colors duration-200 ${
                       isSelected ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleRow(report.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4" 
                      />
                    </td>
                    
                    {/* Image */}
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setExpandedImage(report.image_url)}
                        className="group/img relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                         {report.image_url ? (
                            <img 
                              src={report.image_url} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110" 
                              alt="Evidence" 
                              onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                            />
                         ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                         )}
                         <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-100 drop-shadow-sm" />
                         </div>
                      </button>
                    </td>

                    {/* Location & Time */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {report.street_name || 'Unknown Street'}
                        </span>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {report.city}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="flex items-center gap-1" title={new Date(report.created_at).toLocaleString()}>
                            <Clock className="w-3 h-3" />
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4">
                      <PriorityIndicator dateStr={report.created_at} />
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={report.status} />
                    </td>

                    {/* Controls */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {updatingId === report.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                          <>
                            {report.status !== 'resolved' && (
                              <button 
                                onClick={() => handleStatusChange(report.id, 'resolved')}
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border border-emerald-100 transition-colors shadow-sm"
                                title="Mark Resolved"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Floating Action Bar (FAB) */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 ease-out transform ${
        selectedRows.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-xl shadow-slate-200/40 pl-4 pr-2 py-2 rounded-full ring-1 ring-black/5">
          <span className="text-sm font-semibold text-slate-700 pl-1">
            {selectedRows.size} selected
          </span>
          
          <div className="h-4 w-px bg-slate-300" />
          
          <div className="flex gap-1">
             <button className="px-3 py-1.5 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5">
               <CheckCircle2 className="w-3.5 h-3.5" />
               Resolve
             </button>
             <button className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5">
               <Download className="w-3.5 h-3.5" />
               Export
             </button>
             <button className="px-3 py-1.5 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5">
               <Trash2 className="w-3.5 h-3.5" />
               Delete
             </button>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <img 
              src={expandedImage} 
              className="max-h-[85vh] w-auto rounded-lg shadow-2xl ring-1 ring-white/10" 
              alt="Report Evidence"
            />
            <button 
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              onClick={() => setExpandedImage(null)}
            >
              <X className="w-5 h-5" /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}