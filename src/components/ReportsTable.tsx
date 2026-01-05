import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Check, X, Calendar, MapPin, Search, Download, 
  ChevronDown, AlertTriangle, Clock, 
  CheckCircle2, ArrowUpDown, MoreHorizontal, Trash2, 
  Filter, RefreshCw, ZoomIn, Loader2,
  ListFilter, Archive, Ban
} from 'lucide-react';
import { getReports, subscribeToReports } from '../db/reports';
import { updateReportStatus, getCurrentAdmin, subscribeToAuthChanges } from '../db/admin';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportStatus = Report['status'];
type SortConfig = { key: keyof Report | 'priority'; direction: 'asc' | 'desc' };

// --- Sub-Component: Interactive Status Select ---
const StatusSelect = ({ current, onChange, isLoading }: { current: ReportStatus, onChange: (s: ReportStatus) => void, isLoading: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const config = {
    open: { label: 'Open', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: AlertTriangle },
    in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
    false_report: { label: 'False Flag', color: 'bg-slate-50 text-slate-500 border-slate-200', icon: Ban },
  };

  const activeConfig = config[current as keyof typeof config] || config.open;
  const Icon = activeConfig.icon;

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`w-36 flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 ${activeConfig.color} ${isOpen ? 'ring-2 ring-offset-1 ring-slate-200' : 'hover:brightness-95'}`}
      >
        <div className="flex items-center gap-2">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
          <span>{activeConfig.label}</span>
        </div>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1">
            {Object.entries(config).map(([key, value]) => {
              const ItemIcon = value.icon;
              return (
                <button
                  key={key}
                  onClick={() => { onChange(key as ReportStatus); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    current === key ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <ItemIcon className={`w-4 h-4 ${key === 'resolved' ? 'text-emerald-500' : key === 'open' ? 'text-rose-500' : 'text-blue-500'}`} />
                  {value.label}
                  {current === key && <Check className="w-3 h-3 ml-auto text-slate-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-Component: Priority Badge ---
const PriorityBadge = ({ dateStr }: { dateStr: string }) => {
  const getPriority = (date: string) => {
    const hours = (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60);
    if (hours > 48) return { label: 'Critical', style: 'bg-rose-100 text-rose-700 animate-pulse' };
    if (hours > 24) return { label: 'High', style: 'bg-orange-100 text-orange-700' };
    return { label: 'Normal', style: 'bg-slate-100 text-slate-600' };
  };

  const p = getPriority(dateStr);

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${p.style}`}>
      {p.label}
    </span>
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
      return 0; 
    });

    return data;
  }, [reports, searchQuery, sortConfig]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] relative bg-white">
      
      {/* 1. Command Toolbar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md z-20 sticky top-0">
        
        {/* Left: Search */}
        <div className="relative group w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-sm font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-slate-100/50 p-1 rounded-xl border border-slate-200">
            {['all', 'open', 'resolved'].map((t) => (
              <button
                key={t}
                onClick={() => { setFilterStatus(t); onFilterChange?.(t); }}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                  filterStatus === t 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          <button 
            onClick={() => fetchReports()} 
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-95">
             <Download className="w-3.5 h-3.5" />
             <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Data Grid */}
      <div className="flex-1 overflow-auto bg-slate-50/50 relative custom-scrollbar">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <table className="w-full text-left border-collapse relative z-10">
          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
            <tr>
              <th className="px-6 py-4 w-14">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={selectedRows.size === processedReports.length && processedReports.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4" 
                  />
                </div>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evidence</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 group" onClick={() => toggleSort('street_name')}>
                <div className="flex items-center gap-1">Location <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 group" onClick={() => toggleSort('priority')}>
                <div className="flex items-center gap-1">Priority <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status & Action</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              // Skeleton Loader
              [...Array(6)].map((_, i) => (
                <tr key={i} className="bg-white animate-pulse">
                  <td className="p-6"><div className="h-4 w-4 bg-slate-100 rounded" /></td>
                  <td className="p-6"><div className="h-12 w-16 bg-slate-100 rounded-lg" /></td>
                  <td className="p-6"><div className="h-4 w-48 bg-slate-100 rounded mb-2" /><div className="h-3 w-24 bg-slate-50 rounded" /></td>
                  <td className="p-6"><div className="h-5 w-16 bg-slate-100 rounded-md" /></td>
                  <td className="p-6"><div className="h-8 w-32 bg-slate-100 rounded-lg" /></td>
                  <td className="p-6 text-right"><div className="h-8 w-8 bg-slate-100 rounded-full ml-auto" /></td>
                </tr>
              ))
            ) : processedReports.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                      <ListFilter className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No reports found</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                      We couldn't find any reports matching your current filters.
                    </p>
                    <button 
                      onClick={() => { setFilterStatus('all'); setSearchQuery(''); }}
                      className="mt-6 px-6 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              // Rows
              processedReports.map((report) => {
                const isSelected = selectedRows.has(report.id);
                return (
                  <tr 
                    key={report.id} 
                    className={`group transition-all duration-200 ${
                      isSelected ? 'bg-indigo-50/60' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleRow(report.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4" 
                        />
                      </div>
                    </td>
                    
                    {/* Image Thumbnail */}
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setExpandedImage(report.image_url)}
                        className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 group/img shadow-sm"
                      >
                          {report.image_url ? (
                             <img 
                               src={report.image_url} 
                               className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" 
                               alt="Report" 
                               onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                             />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-400">
                               <div className="w-2 h-2 bg-slate-300 rounded-full" />
                             </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                             <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-100 drop-shadow-md transform scale-90 group-hover/img:scale-100 transition-all" />
                          </div>
                      </button>
                    </td>

                    {/* Details */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {report.street_name || 'Unknown Street'}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {report.city}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4">
                      <PriorityBadge dateStr={report.created_at} />
                    </td>

                    {/* Status Select */}
                    <td className="px-6 py-4">
                      <StatusSelect 
                        current={report.status} 
                        onChange={(s) => handleStatusChange(report.id, s)}
                        isLoading={updatingId === report.id}
                      />
                    </td>

                    {/* Context Menu */}
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Floating Bulk Action Bar */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
        selectedRows.size > 0 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-indigo-500/20 ring-1 ring-white/10">
          <div className="bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-indigo-300 border border-slate-700">
            {selectedRows.size} Selected
          </div>
          
          <div className="h-6 w-px bg-slate-700 mx-1" />
          
          <div className="flex items-center gap-1">
             <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-emerald-400 tooltip-trigger" title="Resolve Selected">
               <CheckCircle2 className="w-5 h-5" />
             </button>
             <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white" title="Archive">
               <Archive className="w-5 h-5" />
             </button>
             <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-rose-400" title="Delete">
               <Trash2 className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img 
              src={expandedImage} 
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10" 
              alt="Report Evidence"
            />
            <button 
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold bg-white/10 hover:bg-white/20 rounded-full px-4 backdrop-blur-sm"
              onClick={() => setExpandedImage(null)}
            >
              <X className="w-4 h-4" /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}