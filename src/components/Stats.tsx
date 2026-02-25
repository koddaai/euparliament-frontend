'use client';

import { useEffect, useState } from 'react';
import { Stats as StatsType } from '@/types';

const GROUP_COLORS: Record<string, string> = {
  'EPP': 'bg-blue-600',
  'S&D': 'bg-red-600',
  'RE': 'bg-yellow-500',
  'Greens/EFA': 'bg-green-600',
  'ECR': 'bg-sky-700',
  'The Left': 'bg-red-800',
  'PfE': 'bg-indigo-700',
  'ESN': 'bg-slate-700',
  'NI': 'bg-gray-500',
  'Unknown': 'bg-gray-400',
};

export default function Stats() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const maxGroupCount = Math.max(...stats.byGroup.map(g => g.count));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          European Parliament
        </h2>
        <span className="text-2xl font-bold text-blue-600">
          {stats.totalMeps} MEPs
        </span>
      </div>

      <div className="space-y-2">
        {stats.byGroup.map(group => (
          <div key={group.name} className="flex items-center gap-3">
            <span className="w-20 text-sm font-medium text-gray-700">
              {group.name}
            </span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${GROUP_COLORS[group.name] || GROUP_COLORS['Unknown']} transition-all duration-500`}
                style={{ width: `${(group.count / maxGroupCount) * 100}%` }}
              ></div>
            </div>
            <span className="w-12 text-sm text-gray-600 text-right">
              {group.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
