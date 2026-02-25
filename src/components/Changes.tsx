'use client';

import { useEffect, useState } from 'react';

interface Change {
  id: number;
  mep_id: string;
  mep_name: string;
  change_type: 'entry' | 'exit' | 'update';
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  detected_at: string;
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
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const entries = changes.filter(c => c.change_type === 'entry');
  const exits = changes.filter(c => c.change_type === 'exit');

  if (entries.length === 0 && exits.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Changes</h2>
        <p className="text-gray-500 text-sm">No recent changes detected. Changes will appear here after the daily sync detects entries or exits.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Changes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entries */}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium text-green-700 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full text-sm font-bold">+</span>
            New MEPs ({entries.length})
          </h3>
          {entries.length > 0 ? (
            <ul className="space-y-2">
              {entries.slice(0, 10).map(entry => (
                <li key={entry.id} className="flex items-center gap-2 text-sm">
                  <span className="text-green-600">+</span>
                  <span className="font-medium">{entry.mep_name}</span>
                  <span className="text-gray-400 text-xs">
                    {new Date(entry.detected_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No new entries</p>
          )}
        </div>

        {/* Exits */}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium text-red-700 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-800 rounded-full text-sm font-bold">-</span>
            Exited MEPs ({exits.length})
          </h3>
          {exits.length > 0 ? (
            <ul className="space-y-2">
              {exits.slice(0, 10).map(exit => (
                <li key={exit.id} className="flex items-center gap-2 text-sm">
                  <span className="text-red-600">-</span>
                  <span className="font-medium">{exit.mep_name}</span>
                  <span className="text-gray-400 text-xs">
                    {new Date(exit.detected_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No recent exits</p>
          )}
        </div>
      </div>
    </div>
  );
}
