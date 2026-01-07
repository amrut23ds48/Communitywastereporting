import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Check, X, Calendar, MapPin, Search, Download, 
  ChevronDown, AlertTriangle, Clock, 
  CheckCircle2, ArrowUpDown, MoreHorizontal, Trash2, 
  Filter, RefreshCw, ZoomIn, Loader2,
  ListFilter, Archive, Ban, Flag, SlidersHorizontal, Layers
} from 'lucide-react';
import { getReports, subscribeToReports } from '../db/reports';
import { updateReportStatus, getCurrentAdmin, subscribeToAuthChanges } from '../db/admin';
import type { Database } from '../utils/supabase/client';

// Types
type Report = Database['public']['Tables']['reports']['Row'];
type ReportStatus = Report['status'];
type SortConfig = { key: keyof Report | 'urgency'; direction: 'asc' | 'desc' };

// --- Sub-Component: Interactive Status Select ---
const StatusSelect = ({ current, onChange, isLoading }: { current: ReportStatus, onChange: (s: ReportStatus) => void, isLoading: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const config = {
    open: { label: 'Open', color: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100', icon: AlertTriangle },
    in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100', icon: CheckCircle2 },
    false_report: { label: 'False Flag', color: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100', icon: Ban },
  };

  const activeConfig = config[current as keyof typeof config] || config.open;
  const Icon = activeConfig.icon;

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`w-36 flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 ${activeConfig.color} ${isOpen ? 'ring-2 ring-offset-1 ring-slate-200' : ''}`}
      >
        <div className="flex items-center gap-2">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
          <span>{activeConfig.label}</span>
        </div>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1 space-y-0.5">
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
    if (hours > 48) return { label: 'Critical', style: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200 animate-pulse', icon: AlertTriangle };
    if (hours > 24) return { label: 'High', style: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200', icon: Clock };
    return { label: 'Normal', style: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200', icon: CheckCircle2 };
  };

  const p = getPriority(dateStr);
  const Icon = p.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.style}`}>
      <Icon className="w-3 h-3" />
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
  
  // Advanced Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month

  // UI States
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openDescriptionId, setOpenDescriptionId] = useState<string | null>(null);

  // Mock Zones/Districts (Replace with actual data)
  const zones = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central'];
  const districts = ['District 1', 'District 2', 'District 3', 'District 4'];

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

  const toggleSort = (key: keyof Report | 'urgency') => {
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

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(r => 
        r.street_name?.toLowerCase().includes(q) || 
        r.city?.toLowerCase().includes(q) || 
        r.description?.toLowerCase().includes(q) ||
        r.waste_type?.toLowerCase().includes(q) ||
        r.urgency?.toLowerCase().includes(q)
      );
    }

    // Advanced Filters (Mock implementation for Zone/District as data might not have it yet)
    if (selectedZone !== 'all') {
       // Filter logic here...
    }
    if (selectedDistrict !== 'all') {
       // Filter logic here...
    }
    
    // Date Filter
    if (dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.setHours(0,0,0,0));
      data = data.filter(r => {
        const d = new Date(r.created_at);
        if (dateRange === 'today') return d >= today;
        // Add week/month logic...
        return true;
      });
    }

    // Sort
    data.sort((a, b) => {
      if (sortConfig.key === 'urgency') {
        const order = { high: 3, medium: 2, low: 1 } as const;
        const aVal = order[(a.urgency as keyof typeof order) || 'medium'];
        const bVal = order[(b.urgency as keyof typeof order) || 'medium'];
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aValue = `${a[sortConfig.key as keyof Report] ?? ''}`;
      const bValue = `${b[sortConfig.key as keyof Report] ?? ''}`;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [reports, searchQuery, sortConfig, selectedZone, selectedDistrict, dateRange]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] relative bg-white">
      
      {/* 1. Command Toolbar */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md z-20 sticky top-0 space-y-4">
        
        {/* Top Row: Search & Primary Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Search */}
          <div className="relative group w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by ID, location, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-sm font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          {/* Right: Tools */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border text-xs font-bold rounded-xl transition-all ${
                showFilters 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(selectedZone !== 'all' || selectedDistrict !== 'all' || dateRange !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </button>

            <div className="h-6 w-px bg-slate-200 hidden md:block mx-1" />

            <button 
              onClick={() => fetchReports()} 
              className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-95">
               <Download className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Filter Panel (Collapsible) */}
        {showFilters && (
          <div className="animate-in slide-in-from-top-2 duration-200">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Zone Filter */}
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Zone</label>
                   <div className="relative">
                      <select 
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                         <option value="all">All Zones</option>
                         {zones.map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
                      <Layers className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                   </div>
                </div>

                {/* District Filter */}
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">District</label>
                   <div className="relative">
                      <select 
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                         <option value="all">All Districts</option>
                         {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                   </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</label>
                   <div className="relative">
                      <select 
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); onFilterChange?.(e.target.value); }}
                        className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                         <option value="all">All Statuses</option>
                         <option value="open">Open Issues</option>
                         <option value="in_progress">In Progress</option>
                         <option value="resolved">Resolved</option>
                         <option value="false_report">False Flag</option>
                      </select>
                      <Filter className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                   </div>
                </div>

                {/* Date Range */}
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Timeframe</label>
                   <div className="relative">
                      <select 
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                         <option value="all">All Time</option>
                         <option value="today">Today</option>
                         <option value="week">This Week</option>
                         <option value="month">This Month</option>
                      </select>
                      <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                   </div>
                </div>
             </div>
          </div>
        )}
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
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Waste Type</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 group" onClick={() => toggleSort('urgency')}>
                <div className="flex items-center gap-1">Urgency <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status & Action</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Options</th>
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
                  <td className="p-6"><div className="h-5 w-20 bg-slate-100 rounded-md" /></td>
                  <td className="p-6"><div className="h-5 w-32 bg-slate-100 rounded-md" /></td>
                  <td className="p-6"><div className="h-5 w-16 bg-slate-100 rounded-md" /></td>
                  <td className="p-6"><div className="h-8 w-32 bg-slate-100 rounded-lg" /></td>
                  <td className="p-6 text-right"><div className="h-8 w-8 bg-slate-100 rounded-full ml-auto" /></td>
                </tr>
              ))
            ) : processedReports.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                      <ListFilter className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No reports found</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                      We couldn't find any reports matching your current filters.
                    </p>
                    <button 
                      onClick={() => { setFilterStatus('all'); setSearchQuery(''); setDateRange('all'); setSelectedZone('all'); }}
                      className="mt-6 px-6 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      Clear All Filters
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
                        <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer">
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

                    {/* Waste Type */}
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {report.waste_type || 'general'}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4">
                      <div className="relative max-w-xs">
                        <button
                          type="button"
                          onClick={() => setOpenDescriptionId(report.id)}
                          className="text-xs text-slate-600 text-left line-clamp-2 hover:text-indigo-600 hover:underline"
                          title="Click to view full description"
                        >
                          {report.description && report.description.trim().length > 0
                            ? report.description
                            : 'No description provided'}
                        </button>

                        {openDescriptionId === report.id && (
                          <div className="absolute z-30 mt-2 w-72 max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-xs text-slate-700 whitespace-pre-wrap">
                                {report.description && report.description.trim().length > 0
                                  ? report.description
                                  : 'No description provided'}
                              </div>
                              <button
                                type="button"
                                onClick={() => setOpenDescriptionId(null)}
                                className="ml-2 text-slate-400 hover:text-slate-700"
                                aria-label="Close description"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Urgency */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        report.urgency === 'high'
                          ? 'bg-rose-100 text-rose-700 border-rose-200'
                          : report.urgency === 'low'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {report.urgency || 'medium'}
                      </span>
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
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Details">
                             <MoreHorizontal className="w-4 h-4" />
                          </button>
                       </div>
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
             <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-emerald-400 tooltip-trigger group relative" title="Resolve Selected">
               <CheckCircle2 className="w-5 h-5" />
               <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Mark Resolved</span>
             </button>
             <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white group relative" title="Archive">
               <Archive className="w-5 h-5" />
               <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">Archive</span>
             </button>
             <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-rose-400 group relative" title="Delete">
               <Trash2 className="w-5 h-5" />
               <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">Delete</span>
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