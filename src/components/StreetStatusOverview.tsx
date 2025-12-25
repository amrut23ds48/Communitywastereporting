import React from 'react';
import { MapPin, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface StreetStatusOverviewProps {
  streetName: string;
  totalReports: number;
  openReports: number;
  inProgressReports: number;
  resolvedReports: number;
}

export function StreetStatusOverview({
  streetName,
  totalReports,
  openReports,
  inProgressReports,
  resolvedReports,
}: StreetStatusOverviewProps) {
  const openPercentage = (openReports / totalReports) * 100;
  const inProgressPercentage = (inProgressReports / totalReports) * 100;
  const resolvedPercentage = (resolvedReports / totalReports) * 100;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl text-gray-900">{streetName} - Street Status</h2>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Total Reports on This Street</span>
          <span className="text-2xl text-gray-900">{totalReports}</span>
        </div>
      </div>

      {/* Status Badges */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-700">Open</span>
          </div>
          <div className="text-2xl text-red-600">{openReports}</div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-700">In Progress</span>
          </div>
          <div className="text-2xl text-yellow-600">{inProgressReports}</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-700">Resolved</span>
          </div>
          <div className="text-2xl text-green-600">{resolvedReports}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Status Distribution</p>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            className="bg-red-500 h-full transition-all"
            style={{ width: `${openPercentage}%` }}
            title={`Open: ${openPercentage.toFixed(1)}%`}
          />
          <div
            className="bg-yellow-500 h-full transition-all"
            style={{ width: `${inProgressPercentage}%` }}
            title={`In Progress: ${inProgressPercentage.toFixed(1)}%`}
          />
          <div
            className="bg-green-500 h-full transition-all"
            style={{ width: `${resolvedPercentage}%` }}
            title={`Resolved: ${resolvedPercentage.toFixed(1)}%`}
          />
        </div>
        <p className="text-xs text-gray-500 text-center">
          Status reflects all reports submitted on this street
        </p>
      </div>
    </div>
  );
}
