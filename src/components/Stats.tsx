'use client';

import { useEffect, useState } from 'react';
import { Stats as StatsType } from '@/types';

const GROUP_COLORS: Record<string, { bg: string; bar: string; text: string }> = {
  'EPP': { bg: 'bg-blue-50', bar: 'bg-blue-600', text: 'text-blue-700' },
  'S&D': { bg: 'bg-red-50', bar: 'bg-red-600', text: 'text-red-700' },
  'RE': { bg: 'bg-amber-50', bar: 'bg-amber-500', text: 'text-amber-700' },
  'Greens/EFA': { bg: 'bg-emerald-50', bar: 'bg-emerald-600', text: 'text-emerald-700' },
  'ECR': { bg: 'bg-sky-50', bar: 'bg-sky-700', text: 'text-sky-700' },
  'The Left': { bg: 'bg-rose-50', bar: 'bg-rose-700', text: 'text-rose-700' },
  'PfE': { bg: 'bg-indigo-50', bar: 'bg-indigo-700', text: 'text-indigo-700' },
  'ESN': { bg: 'bg-slate-50', bar: 'bg-slate-700', text: 'text-slate-700' },
  'NI': { bg: 'bg-gray-50', bar: 'bg-gray-500', text: 'text-gray-600' },
};

const GROUP_FULL_NAMES: Record<string, string> = {
  'EPP': 'European People\'s Party',
  'S&D': 'Socialists & Democrats',
  'RE': 'Renew Europe',
  'Greens/EFA': 'Greens / EFA',
  'ECR': 'European Conservatives',
  'The Left': 'The Left (GUE/NGL)',
  'PfE': 'Patriots for Europe',
  'ESN': 'Europe of Sovereign Nations',
  'NI': 'Non-Inscrits',
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-10"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const maxGroupCount = Math.max(...stats.byGroup.map(g => g.count));
  const totalCountries = stats.byCountry.length;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total MEPs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total MEPs</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalMeps}</p>
            </div>
            <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Political Groups */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Political Groups</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.byGroup.length}</p>
            </div>
            <div className="w-11 h-11 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Countries */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">EU Countries</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalCountries}</p>
            </div>
            <div className="w-11 h-11 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Political Groups Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Political Groups Distribution
          </h2>
          <span className="text-xs text-slate-500">
            {stats.totalMeps} members total
          </span>
        </div>

        <div className="space-y-3">
          {stats.byGroup.map((group, index) => {
            const colors = GROUP_COLORS[group.name] || { bg: 'bg-gray-50', bar: 'bg-gray-400', text: 'text-gray-600' };
            const percentage = ((group.count / stats.totalMeps) * 100).toFixed(1);

            return (
              <div
                key={group.name}
                className="group animate-slide-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <span className={`text-xs font-semibold ${colors.text}`}>
                      {group.name}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="h-7 bg-slate-100 rounded overflow-hidden">
                      <div
                        className={`h-full ${colors.bar} rounded transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                        style={{ width: `${(group.count / maxGroupCount) * 100}%` }}
                      >
                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          {GROUP_FULL_NAMES[group.name] || group.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right shrink-0">
                    <span className="text-sm font-bold text-slate-900">{group.count}</span>
                    <span className="text-[10px] text-slate-400 ml-0.5">({percentage}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
