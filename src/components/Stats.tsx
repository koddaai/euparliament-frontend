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

const GROUP_FULL_NAMES: Record<string, string> = {
  'EPP': 'European People\'s Party (Christian Democrats)',
  'S&D': 'Progressive Alliance of Socialists and Democrats',
  'RE': 'Renew Europe (Liberals)',
  'Greens/EFA': 'The Greens–European Free Alliance',
  'ECR': 'European Conservatives and Reformists',
  'The Left': 'The Left in the European Parliament (GUE/NGL)',
  'PfE': 'Patriots for Europe',
  'ESN': 'Europe of Sovereign Nations',
  'NI': 'Non-Inscrits (Non-attached Members)',
};

export default function Stats() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

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
            <span className="w-24 text-sm font-medium text-gray-700">
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

      {/* Legend Toggle */}
      <button
        onClick={() => setShowLegend(!showLegend)}
        className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        <svg
          className={`w-4 h-4 transition-transform ${showLegend ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {showLegend ? 'Hide legend' : 'Show legend'}
      </button>

      {/* Legend Content */}
      {showLegend && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Political Groups</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {stats.byGroup.map(group => (
              <div key={group.name} className="flex items-center gap-2 text-sm">
                <span
                  className={`w-3 h-3 rounded-full ${GROUP_COLORS[group.name] || GROUP_COLORS['Unknown']}`}
                ></span>
                <span className="font-medium text-gray-800">{group.name}</span>
                <span className="text-gray-500">-</span>
                <span className="text-gray-600">{GROUP_FULL_NAMES[group.name] || group.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
