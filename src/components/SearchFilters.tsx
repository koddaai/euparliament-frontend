'use client';

import { useEffect, useState } from 'react';
import { Stats } from '@/types';

interface SearchFiltersProps {
  onFilterChange: (filters: { country: string; group: string; search: string }) => void;
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [country, setCountry] = useState('');
  const [group, setGroup] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({ country, group, search });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [country, group, search, onFilterChange]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search by name
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search MEPs..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All countries</option>
            {stats?.byCountry.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
            Political Group
          </label>
          <select
            id="group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All groups</option>
            {stats?.byGroup.map(g => (
              <option key={g.name} value={g.name}>
                {g.name} ({g.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {(country || group || search) && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              setCountry('');
              setGroup('');
              setSearch('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
