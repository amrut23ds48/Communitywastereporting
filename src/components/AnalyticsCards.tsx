import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getAnalyticsOverview } from '../db/analytics';

interface AnalyticsCardsProps {
  onCardClick?: (filter: string) => void;
  refreshKey?: number;
}

export function AnalyticsCards({ onCardClick, refreshKey = 0 }: AnalyticsCardsProps) {
  const [stats, setStats] = useState({
    totalReports: 0,
    openReports: 0,
    resolvedReports: 0,
    falseReports: 0,
    thisMonthChange: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    const { data, error } = await getAnalyticsOverview();
    if (data) {
      setStats(data);
    }
    setLoading(false);
  };

  const cards = [
    {
      title: 'Total Reports',
      value: loading ? '...' : stats.totalReports.toString(),
      subtitle: 'This month',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: stats.thisMonthChange >= 0 ? `+${stats.thisMonthChange}%` : `${stats.thisMonthChange}%`,
      filter: 'all',
    },
    {
      title: 'Open Reports',
      value: loading ? '...' : stats.openReports.toString(),
      subtitle: 'Awaiting action',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: loading ? '...' : `${stats.openReports}`,
      filter: 'open',
    },
    {
      title: 'Resolved Reports',
      value: loading ? '...' : stats.resolvedReports.toString(),
      subtitle: 'This month',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: loading ? '...' : `${stats.resolvedReports}`,
      filter: 'resolved',
    },
    {
      title: 'False Reports',
      value: loading ? '...' : stats.falseReports.toString(),
      subtitle: 'Marked as invalid',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      trend: loading ? '...' : `${stats.falseReports}`,
      filter: 'false_report',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.title}
            onClick={() => onCardClick?.(card.filter)}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer text-left"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {card.trend}
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl text-gray-900">{card.value}</h3>
              <p className="text-gray-900">{card.title}</p>
              <p className="text-sm text-gray-500">{card.subtitle}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}