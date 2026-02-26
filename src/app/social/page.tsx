'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TweetCard from '@/components/social/TweetCard';

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

type Tab = 'feed' | 'rankings' | 'trending';

interface Tweet {
  tweet_id: string;
  content: string;
  created_at: string;
  likes: number;
  retweets: number;
  replies: number;
  engagement: number;
  url: string;
  media_urls: string[];
  mep: {
    name: string;
    country: string;
    group: string;
    photo_url: string;
    x_handle: string | null;
  } | null;
}

interface RankingEntry {
  rank: number;
  mep_id: string;
  total_engagement: number;
  tweet_count: number;
  mep: {
    name: string;
    country: string;
    group: string;
    photo_url: string;
    x_handle: string | null;
  } | null;
}

const GROUPS = ['EPP', 'S&D', 'RE', 'Greens/EFA', 'ECR', 'The Left', 'PfE', 'ESN', 'NI'];

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [rankings, setRankings] = useState<{ byEngagement: RankingEntry[]; byActivity: RankingEntry[] } | null>(null);
  const [trending, setTrending] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchFeed();
    } else if (activeTab === 'rankings') {
      fetchRankings();
    } else if (activeTab === 'trending') {
      fetchTrending();
    }
  }, [activeTab, selectedGroup]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGroup) params.set('group', selectedGroup);
      const res = await fetch(`/api/social/feed?${params}`);
      const data = await res.json();
      setTweets(data.tweets || []);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social/rankings?days=7');
      const data = await res.json();
      setRankings(data.rankings || null);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social/trending?hours=24');
      const data = await res.json();
      setTrending(data.trending || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003399] via-[#002266] to-[#003399] text-white shadow-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <EUStars />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  MEP Social Feed
                </h1>
                <p className="text-blue-200 text-sm md:text-base">
                  What Members are saying on X
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Monitor
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'feed' as Tab, label: 'Feed', icon: '📰' },
              { id: 'rankings' as Tab, label: 'Rankings', icon: '🏆' },
              { id: 'trending' as Tab, label: 'Trending', icon: '🔥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-[#003399] border-[#003399]'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      {activeTab === 'feed' && (
        <div className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">Filter by group:</span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]"
              >
                <option value="">All Groups</option>
                {GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003399]"></div>
          </div>
        ) : (
          <>
            {/* Feed Tab */}
            {activeTab === 'feed' && (
              <div className="max-w-2xl mx-auto space-y-4">
                {tweets.length === 0 ? (
                  <div className="text-center py-20 text-slate-500">
                    <p className="text-lg mb-2">No tweets yet</p>
                    <p className="text-sm">Social feed data will appear here once synced</p>
                  </div>
                ) : (
                  tweets.map((tweet) => (
                    <TweetCard key={tweet.tweet_id} tweet={tweet} />
                  ))
                )}
              </div>
            )}

            {/* Rankings Tab */}
            {activeTab === 'rankings' && rankings && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Top Engagement */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                      <span>🏆</span> Top Engagement (7 days)
                    </h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {rankings.byEngagement.map((entry) => (
                      <div key={entry.mep_id} className="px-6 py-4 flex items-center gap-4">
                        <span className="text-2xl font-bold text-slate-300 w-8">
                          {entry.rank}
                        </span>
                        {entry.mep?.photo_url && (
                          <img
                            src={entry.mep.photo_url}
                            alt={entry.mep.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {entry.mep?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {entry.mep?.country} · {entry.mep?.group}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#003399]">
                            {entry.total_engagement.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">engagement</p>
                        </div>
                      </div>
                    ))}
                    {rankings.byEngagement.length === 0 && (
                      <div className="px-6 py-8 text-center text-slate-500">
                        No data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Most Active */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                      <span>📊</span> Most Active (7 days)
                    </h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {rankings.byActivity.map((entry) => (
                      <div key={entry.mep_id} className="px-6 py-4 flex items-center gap-4">
                        <span className="text-2xl font-bold text-slate-300 w-8">
                          {entry.rank}
                        </span>
                        {entry.mep?.photo_url && (
                          <img
                            src={entry.mep.photo_url}
                            alt={entry.mep.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {entry.mep?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {entry.mep?.country} · {entry.mep?.group}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#003399]">
                            {entry.tweet_count}
                          </p>
                          <p className="text-xs text-slate-500">tweets</p>
                        </div>
                      </div>
                    ))}
                    {rankings.byActivity.length === 0 && (
                      <div className="px-6 py-8 text-center text-slate-500">
                        No data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Trending Tab */}
            {activeTab === 'trending' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl px-6 py-4 mb-6">
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <span>🔥</span> Trending in the last 24 hours
                  </h2>
                  <p className="text-white/80 text-sm">Tweets with highest engagement</p>
                </div>
                {trending.length === 0 ? (
                  <div className="text-center py-20 text-slate-500">
                    <p className="text-lg mb-2">No trending tweets</p>
                    <p className="text-sm">Check back when more data is available</p>
                  </div>
                ) : (
                  trending.map((tweet, index) => (
                    <TweetCard key={tweet.tweet_id} tweet={tweet} showRank={index + 1} />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-slate-400 text-sm">
          <p>Data updated daily via X (Twitter) public scraping</p>
          <p className="mt-1">
            <Link href="/" className="hover:text-white transition-colors">
              ← Back to EU Parliament Monitor
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
