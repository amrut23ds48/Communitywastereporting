import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { getStreetStatistics } from '../db/analytics';

export function StreetIndicators() {
  const [streetData, setStreetData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreetData();
  }, []);

  const fetchStreetData = async () => {
    setLoading(true);
    try {
      const { data, error } = await getStreetStatistics();
      
      if (error) {
        console.error('Error fetching street statistics:', error);
      } else if (data) {
        // Sort by total reports (descending) and take top 5
        const sortedData = data
          .sort((a, b) => b.totalReports - a.totalReports)
          .slice(0, 5)
          .map(street => ({
            name: street.streetName,
            total: street.totalReports,
            open: street.openReports,
            resolved: street.resolvedReports,
            inProgress: street.inProgressReports,
          }));
        
        setStreetData(sortedData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading street data...</p>
        </div>
      </div>
    );
  }

  if (streetData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No street data available</p>
          <p className="text-xs text-gray-500 mt-1">Data will appear once reports are submitted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-gray-900">Street-wise Reports</h2>
        <TrendingUp className="w-5 h-5 text-blue-400" />
      </div>

      <div className="space-y-4">
        {streetData.map((street, index) => (
          <div key={street.name} className="border-b border-gray-100 pb-4 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900">{index + 1}.</span>
                <span className="text-gray-900">{street.name}</span>
              </div>
              <span className="text-gray-900">{street.total} reports</span>
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">{street.open} Open</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">{street.inProgress} Progress</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{street.resolved} Resolved</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex mt-3">
              <div
                className="bg-red-500 h-full"
                style={{ width: `${(street.open / street.total) * 100}%` }}
              />
              <div
                className="bg-yellow-500 h-full"
                style={{ width: `${(street.inProgress / street.total) * 100}%` }}
              />
              <div
                className="bg-green-500 h-full"
                style={{ width: `${(street.resolved / street.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button 
          onClick={fetchStreetData}
          className="w-full text-sm text-blue-400 hover:text-blue-600 transition-colors"
        >
          Refresh Data →
        </button>
      </div>
    </div>
  );
}