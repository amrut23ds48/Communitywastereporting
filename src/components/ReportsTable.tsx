import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, X, Calendar, MapPin, Search, Download, 
  ChevronLeft, ChevronRight, AlertTriangle, Clock, 
  CheckCircle2, ArrowUpDown, MoreVertical, Trash2, 
  Eye, Filter, RefreshCw, ZoomIn, Loader2, Layers,
  ArrowUpRight
} from 'lucide-react';
import { getReports, subscribeToReports } from '../db/reports';
import { updateReportStatus, getCurrentAdmin, subscribeToAuthChanges } from '../db/admin';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportStatus = Report['status'];
type SortConfig = { key: keyof Report | 'priority'; direction: 'asc' | 'desc' };

// --- Sub-Component: Table Skeleton ---
const TableSkeleton = () => (
  <tbody className="animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i} className="border-b border-slate-50">
        <td className="p-4"><div className="h-4 w-4 bg-slate-200 rounded" /></td>
        <td className="p-4"><div className="h-12 w-12 bg-slate-200 rounded-lg" /></td>
        <td className="p-4">
          <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-20 bg-slate-100 rounded" />
        </td>
        <td className="p-4"><div className="h-6 w-16 bg-slate-200 rounded-full" /></td>
        <td className="p-4"><div className="h-6 w-24 bg-slate-200 rounded-full" /></td>
        <td className="p-4"><div className="h-8 w-8 bg-slate-200 rounded-full ml-auto" /></td>
      </tr>
    ))}
  </tbody>
);

// --- Sub-Component: Status Badge ---
const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    open: 'bg-red-50 text-red-700 border-red-100',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-100',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    false_report: 'bg-slate-50 text-slate-700 border-slate-100'
  };

  const labels = {
    open: 'Open Issue',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    false_report: 'False Flag'
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
      ${styles[status as keyof typeof styles] || styles.open}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'open' ? 'bg-red-500 animate-pulse' : 'bg-current'}`} />
      {labels[status as keyof typeof labels] || status}
    </span>
  );
};

// --- Main Component ---
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

  // Priority Calculator
  const getPriority = (dateStr: string) => {
    const hours = (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
    if (hours > 48) return { label: 'CRITICAL', color: 'text-red-600 bg-red-100 border-red-200' };
    if (hours > 24) return { label: 'HIGH', color: 'text-orange-600 bg-orange-100 border-orange-200' };
    if (hours > 12) return { label: 'MEDIUM', color: 'text-amber-600 bg-amber-100 border-amber-200' };
    return { label: 'LOW', color: 'text-emerald-600 bg-emerald-100 border-emerald-200' };
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col h-[calc(100vh-120px)] min-h-[600px] relative overflow-hidden">
      
      {/* 1. Command Center Header (Dark) */}
      <div className="bg-slate-900 p-6 z-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Title Block */}
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h2 className="text-xl font-bold text-white tracking-tight">Operations Console</h2>
               <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
               </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
              <span>All Tickets: <span className="text-white">{reports.length}</span></span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>Pending Action: <span className="text-orange-400">{reports.filter(r => r.status === 'open').length}</span></span>
            </div>
          </div>

          {/* Controls Block */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search location, ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
              {['all', 'open', 'resolved'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setFilterStatus(t); onFilterChange?.(t); }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                    filterStatus === t 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button 
                onClick={() => fetchReports()} 
                className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Data Grid */}
      <div className="flex-1 overflow-auto relative bg-slate-50/50">
        <table className="w-full text-left border-collapse">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4 w-14">
                <input 
                  type="checkbox" 
                  checked={selectedRows.size === processedReports.length && processedReports.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                />
              </th>
              <th className="px-6 py-4">Evidence</th>
              <th className="px-6 py-4 cursor-pointer hover:text-emerald-600 group transition-colors" onClick={() => toggleSort('street_name')}>
                <div className="flex items-center gap-1">Location <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" /></div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-emerald-600 group transition-colors" onClick={() => toggleSort('priority')}>
                <div className="flex items-center gap-1">Severity <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" /></div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-emerald-600 group transition-colors" onClick={() => toggleSort('status')}>
                <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" /></div>
              </th>
              <th className="px-6 py-4 text-right">Controls</th>
            </tr>
          </thead>

          {/* Table Body */}
          {loading ? (
             <TableSkeleton />
          ) : (
            <tbody className="divide-y divide-slate-100 bg-white">
              {processedReports.map((report) => {
                const priority = getPriority(report.created_at);
                const isSelected = selectedRows.has(report.id);
                
                return (
                  <tr 
                    key={report.id} 
                    className={`group transition-all duration-200 ${
                        isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50 hover:shadow-sm'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleRow(report.id)}
                        className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </td>
                    
                    {/* Image Thumbnail */}
                    <td className="px-6 py-4">
                      <button 
                        className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all group-hover:ring-2 group-hover:ring-emerald-500/20"
                        onClick={() => setExpandedImage(report.image_url)}
                      >
                        <img 
                          src={report.image_url} 
                          className="w-full h-full object-cover" 
                          alt="Report"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=No+Img'; }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                            <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                        </div>
                      </button>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 max-w-[240px]">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 truncate" title={report.street_name}>
                          {report.street_name || 'Unknown Location'}
                        </span>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{report.city || 'Unknown City'}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-medium">
                          <Clock className="w-3 h-3" />
                          {new Date(report.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        </div>
                      </div>
                    </td>

                    {/* Priority Badge */}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm ${priority.color}`}>
                        {priority.label === 'CRITICAL' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {priority.label}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <StatusBadge status={report.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                        {updatingId === report.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                        ) : (
                          <>
                            {report.status !== 'resolved' && (
                              <button 
                                onClick={() => handleStatusChange(report.id, 'resolved')}
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-200"
                                title="Mark Resolved"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {/* Empty State */}
              {!loading && processedReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                      <Layers className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No records found</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                        Your filters did not match any reports. Try adjusting the search or status filter.
                    </p>
                    <button 
                      onClick={() => { setFilterStatus('all'); setSearchQuery(''); }}
                      className="mt-6 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>

      {/* 3. Footer / Pagination (Glass) */}
      <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 z-10">
        <div>
           Showing <span className="font-bold text-slate-900">{processedReports.length}</span> results
        </div>
        <div className="flex gap-2">
           <button disabled className="p-2 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
           <button disabled className="p-2 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* 4. Floating Action Dock (macOS Style) */}
      {selectedRows.size > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-6 duration-300 fade-in">
          <div className="bg-slate-900 text-white pl-6 pr-2 py-2 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700/50">
            <div className="text-sm font-semibold whitespace-nowrap">
              <span className="text-emerald-400 font-bold">{selectedRows.size}</span> Selected
            </div>
            
            <div className="h-6 w-px bg-slate-700" />
            
            <div className="flex items-center gap-1">
               <button className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl transition-all text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Resolve
               </button>
               <button className="flex items-center gap-2 px-3 py-2 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-all text-xs font-semibold">
                  <Trash2 className="w-4 h-4" /> Delete
               </button>
               <button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-xs font-semibold">
                  <Download className="w-4 h-4" /> CSV
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img 
              src={expandedImage} 
              className="max-h-[85vh] w-auto rounded-lg shadow-2xl border border-white/10 object-contain" 
              onClick={e => e.stopPropagation()} 
              alt="Expanded Evidence"
            />
            <button 
              className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium backdrop-blur-sm transition-all flex items-center gap-2"
              onClick={() => setExpandedImage(null)}
            >
              <X className="w-4 h-4" /> Close Viewer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}