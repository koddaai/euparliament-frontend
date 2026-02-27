'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// EU Stars Logo Component
function EUStars() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-12 h-12 md:w-14 md:h-14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="48" stroke="#FFD700" strokeWidth="2" fill="none" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = 50 + 35 * Math.cos(angle);
        const y = 50 + 35 * Math.sin(angle);
        return (
          <text
            key={i}
            x={x}
            y={y}
            fontSize="12"
            fill="#FFD700"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ★
          </text>
        );
      })}
    </svg>
  );
}

// X Logo component
function XLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface MEPProfile {
  name: string;
  first_name: string;
  last_name: string;
  country: string;
  group: string;
  national_party: string;
  x_handle: string;
  status: string;
  photo_url: string | null;
  mep_id: string | null;
  x_url: string;
}

// Group colors and full names
const GROUP_INFO: Record<string, { bg: string; text: string; border: string; gradient: string; fullName: string }> = {
  EPP: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600', gradient: 'from-blue-500 to-blue-700', fullName: "European People's Party" },
  'S&D': { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', gradient: 'from-red-500 to-red-700', fullName: 'Socialists & Democrats' },
  RE: { bg: 'bg-amber-400', text: 'text-amber-900', border: 'border-amber-500', gradient: 'from-amber-400 to-amber-600', fullName: 'Renew Europe' },
  'Greens/EFA': { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600', gradient: 'from-green-500 to-green-700', fullName: 'Greens/European Free Alliance' },
  ECR: { bg: 'bg-sky-600', text: 'text-white', border: 'border-sky-700', gradient: 'from-sky-500 to-sky-700', fullName: 'European Conservatives and Reformists' },
  'The Left': { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700', gradient: 'from-rose-500 to-rose-700', fullName: 'The Left in the European Parliament' },
  PfE: { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', gradient: 'from-indigo-500 to-indigo-700', fullName: 'Patriots for Europe' },
  ESN: { bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-700', gradient: 'from-violet-500 to-violet-700', fullName: 'Europe of Sovereign Nations' },
  NI: { bg: 'bg-slate-500', text: 'text-white', border: 'border-slate-600', gradient: 'from-slate-400 to-slate-600', fullName: 'Non-Inscrits' },
};

function getGroupInfo(group: string) {
  return GROUP_INFO[group] || GROUP_INFO['NI'];
}

// Country flag emoji mapping
const COUNTRY_FLAGS: Record<string, string> = {
  Austria: '🇦🇹', Belgium: '🇧🇪', Bulgaria: '🇧🇬', Croatia: '🇭🇷', Cyprus: '🇨🇾',
  Czechia: '🇨🇿', Denmark: '🇩🇰', Estonia: '🇪🇪', Finland: '🇫🇮', France: '🇫🇷',
  Germany: '🇩🇪', Greece: '🇬🇷', Hungary: '🇭🇺', Ireland: '🇮🇪', Italy: '🇮🇹',
  Latvia: '🇱🇻', Lithuania: '🇱🇹', Luxembourg: '🇱🇺', Malta: '🇲🇹', Netherlands: '🇳🇱',
  Poland: '🇵🇱', Portugal: '🇵🇹', Romania: '🇷🇴', Slovakia: '🇸🇰', Slovenia: '🇸🇮',
  Spain: '🇪🇸', Sweden: '🇸🇪',
};

type ViewMode = 'grid' | 'list';

export default function SocialPage() {
  const [profiles, setProfiles] = useState<MEPProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<MEPProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [countries, setCountries] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [selectedGroup, selectedCountry, search, allProfiles]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social/profiles');
      const data = await res.json();

      setAllProfiles(data.profiles || []);
      setProfiles(data.profiles || []);
      if (data.filters) {
        setCountries(data.filters.countries || []);
        setGroups(data.filters.groups || []);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProfiles = () => {
    let filtered = allProfiles;

    if (selectedGroup) {
      filtered = filtered.filter(p => p.group === selectedGroup);
    }

    if (selectedCountry) {
      filtered = filtered.filter(p => p.country === selectedCountry);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.x_handle.toLowerCase().includes(searchLower) ||
        p.national_party.toLowerCase().includes(searchLower)
      );
    }

    setProfiles(filtered);
  };

  // Statistics by group
  const groupStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const profile of allProfiles) {
      stats[profile.group] = (stats[profile.group] || 0) + 1;
    }
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .map(([group, count]) => ({ group, count }));
  }, [allProfiles]);

  // Statistics by country
  const countryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const profile of allProfiles) {
      stats[profile.country] = (stats[profile.country] || 0) + 1;
    }
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));
  }, [allProfiles]);

  const clearFilters = () => {
    setSelectedGroup('');
    setSelectedCountry('');
    setSearch('');
  };

  const hasActiveFilters = selectedGroup || selectedCountry || search;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003399] via-[#002266] to-[#003399] text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <EUStars />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                  MEPs on <XLogo className="w-8 h-8" />
                </h1>
                <p className="text-blue-200 text-sm md:text-base mt-1">
                  Members of European Parliament active on X (formerly Twitter)
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="hidden md:flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              <span>←</span> Back to Monitor
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <XLogo className="w-5 h-5" />
                <span className="text-slate-300 text-sm">On X</span>
              </div>
              <p className="text-3xl font-bold">{allProfiles.length}</p>
              <p className="text-slate-400 text-xs mt-1">of 718 MEPs ({Math.round(allProfiles.length / 718 * 100)}%)</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="text-blue-100 text-sm mb-1">Countries</div>
              <p className="text-3xl font-bold">{countries.length}</p>
              <p className="text-blue-200 text-xs mt-1">EU Member States</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="text-emerald-100 text-sm mb-1">Political Groups</div>
              <p className="text-3xl font-bold">{groups.length}</p>
              <p className="text-emerald-200 text-xs mt-1">Represented on X</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white">
              <div className="text-amber-100 text-sm mb-1">Showing</div>
              <p className="text-3xl font-bold">{profiles.length}</p>
              <p className="text-amber-200 text-xs mt-1">{hasActiveFilters ? 'filtered results' : 'total profiles'}</p>
            </div>
          </div>

          {/* Group distribution */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-600 mb-3">Distribution by Political Group</h3>
            <div className="flex flex-wrap gap-2">
              {groupStats.map(({ group, count }) => {
                const info = getGroupInfo(group);
                const isSelected = selectedGroup === group;
                return (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(isSelected ? '' : group)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${info.gradient} ${info.text} shadow-md scale-105`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{group}</span>
                    <span className={`${isSelected ? 'bg-white/20' : 'bg-slate-300'} px-1.5 py-0.5 rounded-full text-xs`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[250px] relative">
              <input
                type="text"
                placeholder="Search by name, @handle, or party..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399] focus:border-transparent bg-slate-50"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Country Filter */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399] bg-white min-w-[160px]"
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {COUNTRY_FLAGS[country] || ''} {country}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-[#003399] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                title="Grid view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-[#003399] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                title="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filters
              </button>
            )}

            {/* Results count */}
            <span className="text-sm text-slate-500 ml-auto">
              {profiles.length} {profiles.length === 1 ? 'MEP' : 'MEPs'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003399] mb-4"></div>
            <p className="text-slate-500">Loading MEP profiles...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <XLogo className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-700 mb-2">No MEPs found</p>
            <p className="text-sm text-slate-500 mb-4">Try adjusting your search or filters</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[#003399] hover:underline text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {profiles.map((profile) => {
              const groupInfo = getGroupInfo(profile.group);
              return (
                <a
                  key={profile.x_handle}
                  href={profile.x_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all group"
                >
                  {/* Group Color Bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${groupInfo.gradient}`} />

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Photo */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        {profile.photo_url ? (
                          <Image
                            src={profile.photo_url}
                            alt={profile.name}
                            fill
                            className="rounded-full object-cover ring-2 ring-slate-100"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center ring-2 ring-slate-100">
                            <span className="text-slate-500 text-xl font-semibold">
                              {profile.first_name[0]}{profile.last_name[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate group-hover:text-[#003399] transition-colors">
                          {profile.name}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                          <XLogo className="w-3 h-3" />
                          <span className="truncate">@{profile.x_handle}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg" title={profile.country}>
                            {COUNTRY_FLAGS[profile.country] || '🇪🇺'}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${groupInfo.bg} ${groupInfo.text}`}
                            title={groupInfo.fullName}
                          >
                            {profile.group}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* National Party */}
                    <p className="text-xs text-slate-400 mt-3 truncate border-t border-slate-100 pt-3">
                      {profile.national_party}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">MEP</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 hidden md:table-cell">X Handle</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 hidden sm:table-cell">Country</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Group</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 hidden lg:table-cell">National Party</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((profile) => {
                  const groupInfo = getGroupInfo(profile.group);
                  return (
                    <tr
                      key={profile.x_handle}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => window.open(profile.x_url, '_blank')}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 flex-shrink-0">
                            {profile.photo_url ? (
                              <Image
                                src={profile.photo_url}
                                alt={profile.name}
                                fill
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                <span className="text-slate-500 text-sm font-semibold">
                                  {profile.first_name[0]}{profile.last_name[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-slate-900">{profile.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          <XLogo className="w-3 h-3" />
                          @{profile.x_handle}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="flex items-center gap-1.5 text-sm">
                          <span>{COUNTRY_FLAGS[profile.country]}</span>
                          <span className="text-slate-600">{profile.country}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${groupInfo.bg} ${groupInfo.text}`}
                          title={groupInfo.fullName}
                        >
                          {profile.group}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-slate-500 truncate block max-w-[200px]">
                          {profile.national_party}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-10 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <EUStars />
                <div>
                  <h3 className="font-semibold">EU Parliament Monitor</h3>
                  <p className="text-slate-400 text-sm">MEPs on X</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Tracking {allProfiles.length} Members of the European Parliament with verified X (Twitter) accounts.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Top Countries on X</h4>
              <div className="space-y-1">
                {countryStats.slice(0, 5).map(({ country, count }) => (
                  <div key={country} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{COUNTRY_FLAGS[country]} {country}</span>
                    <span className="text-slate-500">{count} MEPs</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">About</h4>
              <p className="text-slate-400 text-sm mb-4">
                Data from the 10th European Parliament (2024-2029). Profile information sourced from official EU Parliament records.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                ← Back to EU Parliament Monitor
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-6 text-center text-slate-500 text-sm">
            <p>{allProfiles.length} out of 718 MEPs ({Math.round(allProfiles.length / 718 * 100)}%) have an X profile</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
