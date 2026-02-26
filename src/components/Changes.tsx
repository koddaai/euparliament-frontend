'use client';

import { useEffect, useState } from 'react';

interface Change {
  id: number;
  mep_id: string;
  mep_name: string;
  change_type: 'joined' | 'left' | 'group_change';
  old_value?: string;
  new_value?: string;
  detected_at: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Changes() {
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/changes')
      .then(res => res.json())
      .then(data => {
        setChanges(data.changes || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch changes:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const entries = changes.filter(c => c.change_type === 'joined');
  const exits = changes.filter(c => c.change_type === 'left');
  const groupChanges = changes.filter(c => c.change_type === 'group_change');

  const totalChanges = entries.length + exits.length + groupChanges.length;

  if (totalChanges === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent Changes</h2>
            <p className="text-sm text-slate-500">Tracking membership and group changes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-600">No recent changes detected. Parliament composition is stable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent Changes</h2>
            <p className="text-sm text-slate-500">{totalChanges} changes detected</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* New Members */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm">
              +{entries.length}
            </span>
            <h3 className="font-semibold text-slate-900">New Members</h3>
          </div>
          {entries.length > 0 ? (
            <ul className="space-y-3">
              {entries.slice(0, 5).map(entry => (
                <li key={entry.id} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 text-sm truncate">{entry.mep_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {entry.new_value && (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {entry.new_value}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(entry.detected_at)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {entries.length > 5 && (
                <p className="text-xs text-slate-500 pl-5">+{entries.length - 5} more</p>
              )}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">No new members</p>
          )}
        </div>

        {/* Departures */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-red-100 text-red-700 rounded-lg flex items-center justify-center font-bold text-sm">
              −{exits.length}
            </span>
            <h3 className="font-semibold text-slate-900">Departures</h3>
          </div>
          {exits.length > 0 ? (
            <ul className="space-y-3">
              {exits.slice(0, 5).map(exit => (
                <li key={exit.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 text-sm truncate">{exit.mep_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {exit.old_value && (
                        <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded">
                          {exit.old_value}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(exit.detected_at)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {exits.length > 5 && (
                <p className="text-xs text-slate-500 pl-5">+{exits.length - 5} more</p>
              )}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">No departures</p>
          )}
        </div>

        {/* Group Changes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">
              ↔{groupChanges.length}
            </span>
            <h3 className="font-semibold text-slate-900">Group Changes</h3>
          </div>
          {groupChanges.length > 0 ? (
            <ul className="space-y-3">
              {groupChanges.slice(0, 5).map(change => (
                <li key={change.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 text-sm truncate">{change.mep_name}</p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        {change.old_value}
                      </span>
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {change.new_value}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">
                      {formatRelativeTime(change.detected_at)}
                    </span>
                  </div>
                </li>
              ))}
              {groupChanges.length > 5 && (
                <p className="text-xs text-slate-500 pl-5">+{groupChanges.length - 5} more</p>
              )}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">No group changes</p>
          )}
        </div>
      </div>
    </div>
  );
}
