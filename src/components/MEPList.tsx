'use client';

import { useEffect, useState, useCallback } from 'react';
import { MEP } from '@/types';
import MEPCard from './MEPCard';
import SearchFilters from './SearchFilters';

export default function MEPList() {
  const [meps, setMeps] = useState<MEP[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ country: '', group: '', search: '' });

  const fetchMeps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.country) params.set('country', filters.country);
      if (filters.group) params.set('group', filters.group);
      if (filters.search) params.set('search', filters.search);
      params.set('limit', '200');

      const response = await fetch(`/api/meps?${params.toString()}`);
      const data = await response.json();
      setMeps(data.meps || []);
    } catch (error) {
      console.error('Failed to fetch MEPs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMeps();
  }, [fetchMeps]);

  const handleFilterChange = useCallback((newFilters: { country: string; group: string; search: string }) => {
    setFilters(newFilters);
  }, []);

  return (
    <div>
      <SearchFilters onFilterChange={handleFilterChange} />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : meps.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No MEPs found matching your filters.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Showing {meps.length} MEPs
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {meps.map(mep => (
              <MEPCard key={mep.mep_id} mep={mep} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
