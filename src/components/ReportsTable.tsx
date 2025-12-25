import React, { useState, useEffect } from 'react';
import { Check, X, Image as ImageIcon, Calendar, MapPin, Filter, ZoomIn, Loader2 } from 'lucide-react';
import { getReports, subscribeToReports } from '../db/reports';
import { updateReportStatus, getCurrentAdmin } from '../db/admin';
import type { Database } from '../utils/supabase/client';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportStatus = Report['status'];

interface ReportsTableProps {
  initialFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export function ReportsTable({ initialFilter = 'all', onFilterChange }: ReportsTableProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>(initialFilter);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);

  React.useEffect(() => {
    setFilterStatus(initialFilter);
  }, [initialFilter]);

  // Get current admin
  useEffect(() => {
    const fetchAdmin = async () => {
      const { userId } = await getCurrentAdmin();
      setAdminId(userId);
    };
    fetchAdmin();
  }, []);

  // Fetch reports
  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await getReports({
        status: filterStatus === 'all' ? undefined : filterStatus as ReportStatus,
      });

      if (error) {
        console.error('Error fetching reports:', error);
      } else if (data) {
        setReports(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilterStatus(newFilter);
    onFilterChange?.(newFilter);
  };

  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    if (!adminId) {
      alert('You must be logged in as admin to update status');
      return;
    }

    setUpdatingStatus(reportId);
    
    try {
      const { data, error } = await updateReportStatus(reportId, newStatus, adminId);
      
      if (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status: ' + error.message);
      } else {
        // Refresh reports
        await fetchReports();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-red-100 text-red-700',
      'in-progress': 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      false: 'bg-gray-100 text-gray-700',
    };
    return styles[status as keyof typeof styles] || styles.open;
  };

  const filteredReports = reports;

  return (
    <div className="bg-white rounded-xl shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-gray-900">Reports Management</h2>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Reports</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="false">False Reports</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </td>
              </tr>
            ) : filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div 
                      className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all relative group"
                      onClick={() => setExpandedImage(report.image_url)}
                    >
                      <img
                        src={report.image_url}
                        alt="Waste report"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-gray-900">{report.street_name}</div>
                        <div className="text-xs text-gray-500">{report.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {report.description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs capitalize ${getStatusBadge(
                        report.status
                      )}`}
                    >
                      {report.status.replace('_', ' ').replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {report.status !== 'resolved' && report.status !== 'false_report' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(report.id, 'resolved')}
                            disabled={updatingStatus === report.id}
                            className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Mark as Resolved"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(report.id, 'false_report')}
                            disabled={updatingStatus === report.id}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Mark as False Report"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {(report.status === 'resolved' || report.status === 'false_report') && (
                        <span className="text-xs text-gray-500">Completed</span>
                      )}
                      {updatingStatus === report.id && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  No reports found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {filteredReports.length} of {reports.length} reports
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Previous
          </button>
          <button className="px-4 py-2 bg-blue-400 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors">
            Next
          </button>
        </div>
      </div>

      {/* Image Expansion Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 flex items-center gap-2"
            >
              <X className="w-6 h-6" />
              Close
            </button>
            <img
              src={expandedImage}
              alt="Expanded waste report"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}