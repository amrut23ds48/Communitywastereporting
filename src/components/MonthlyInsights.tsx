import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';
import { getMonthlyInsights, getCurrentMonthWeeklyStats } from '../db/analytics';

export function MonthlyInsights() {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyData();
  }, []);

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const [monthlyRes, weeklyRes] = await Promise.all([
        getMonthlyInsights(6),
        getCurrentMonthWeeklyStats()
      ]);

      if (monthlyRes.error) {
        console.error('Error fetching monthly insights:', monthlyRes.error);
      } else if (monthlyRes.data) {
        // Transform data for charts
        const chartData = monthlyRes.data.map(item => {
          const date = new Date(item.month + '-01');
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            reports: item.total,
            resolved: item.resolved,
            open: item.open,
            inProgress: item.inProgress,
          };
        });
        setMonthlyData(chartData);
      }

      if (weeklyRes.error) {
        console.error('Error fetching weekly stats:', weeklyRes.error);
      } else if (weeklyRes.data) {
        setWeeklyData(weeklyRes.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading monthly trends...</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading weekly data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (monthlyData.length === 0 && weeklyData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-center h-96">
          <p className="text-sm text-gray-500">No monthly data available</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-center h-96">
          <p className="text-sm text-gray-500">No weekly data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Reports Trend */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl text-gray-900 mb-6">Monthly Reports Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="reports"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ fill: '#60a5fa', r: 4 }}
              name="Total Reports"
            />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ fill: '#34d399', r: 4 }}
              name="Resolved"
            />
            <Line
              type="monotone"
              dataKey="inProgress"
              stroke="#fb923c"
              strokeWidth={2}
              dot={{ fill: '#fb923c', r: 4 }}
              name="In Progress"
            />
            <Line
              type="monotone"
              dataKey="open"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              name="Open"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Resolution Status */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl text-gray-900 mb-6">This Month - Resolution Status</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Bar dataKey="resolved" fill="#34d399" radius={[4, 4, 0, 0]} name="Resolved" />
            <Bar dataKey="inProgress" fill="#fb923c" radius={[4, 4, 0, 0]} name="In Progress" />
            <Bar dataKey="open" fill="#ef4444" radius={[4, 4, 0, 0]} name="Open" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}