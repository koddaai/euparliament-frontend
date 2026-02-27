'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
        const x = Math.round((50 + 35 * Math.cos(angle)) * 100) / 100;
        const y = Math.round((50 + 35 * Math.sin(angle)) * 100) / 100;
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

interface NewsArticle {
  Id: number;
  article_id: string;
  source: string;
  title: string;
  description: string;
  url: string;
  image_url: string | null;
  category: string | null;
  author: string | null;
  published_at: string;
}

// Theme configuration
const THEMES = {
  all: {
    name: 'All News',
    icon: '📰',
    keywords: [],
    color: 'bg-slate-600',
  },
  eu_affairs: {
    name: 'EU Affairs',
    icon: '🇪🇺',
    keywords: ['eu', 'european union', 'parliament', 'commission', 'mep', 'brussels', 'council', 'von der leyen', 'bloc', 'member state'],
    color: 'bg-blue-600',
  },
  economy: {
    name: 'Economy',
    icon: '💰',
    keywords: ['economy', 'economic', 'trade', 'market', 'business', 'euro', 'bank', 'inflation', 'gdp', 'budget', 'tax', 'finance', 'investment'],
    color: 'bg-emerald-600',
  },
  environment: {
    name: 'Environment',
    icon: '🌱',
    keywords: ['climate', 'green', 'environment', 'energy', 'carbon', 'emission', 'renewable', 'sustainable', 'nature', 'biodiversity', 'pollution'],
    color: 'bg-green-600',
  },
  foreign_affairs: {
    name: 'Foreign Affairs',
    icon: '🌍',
    keywords: ['defense', 'defence', 'military', 'nato', 'ukraine', 'russia', 'china', 'war', 'security', 'sanctions', 'trump', 'us ', 'america', 'foreign', 'diplomacy'],
    color: 'bg-red-600',
  },
  society: {
    name: 'Society',
    icon: '👥',
    keywords: ['health', 'migration', 'migrant', 'asylum', 'rights', 'culture', 'education', 'social', 'democracy', 'election', 'vote', 'protest'],
    color: 'bg-purple-600',
  },
};

type ThemeKey = keyof typeof THEMES;

// Detect theme from article content
function detectTheme(article: NewsArticle): ThemeKey {
  const text = `${article.title} ${article.description} ${article.category || ''}`.toLowerCase();

  // Check each theme's keywords
  for (const [themeKey, theme] of Object.entries(THEMES)) {
    if (themeKey === 'all') continue;
    for (const keyword of theme.keywords) {
      if (text.includes(keyword)) {
        return themeKey as ThemeKey;
      }
    }
  }

  return 'eu_affairs'; // Default theme
}

// Source badge
const SOURCE_CONFIG: Record<string, { name: string; color: string }> = {
  politico: { name: 'POLITICO', color: 'bg-red-500' },
  guardian: { name: 'Guardian', color: 'bg-blue-800' },
  euronews: { name: 'Euronews', color: 'bg-indigo-500' },
};

function getSourceConfig(source: string) {
  return SOURCE_CONFIG[source.toLowerCase()] || { name: source, color: 'bg-slate-500' };
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Featured News Card
function FeaturedCard({ article }: { article: NewsArticle }) {
  const sourceConfig = getSourceConfig(article.source);
  const theme = THEMES[detectTheme(article)];

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        {article.image_url && (
          <div className="absolute inset-0 opacity-30">
            <img
              src={article.image_url}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
          </div>
        )}
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`${sourceConfig.color} text-white text-xs font-bold px-2.5 py-1 rounded`}>
              {sourceConfig.name}
            </span>
            <span className={`${theme.color} text-white text-xs font-medium px-2.5 py-1 rounded flex items-center gap-1`}>
              <span>{theme.icon}</span>
              <span>{theme.name}</span>
            </span>
            <span className="text-slate-400 text-sm ml-auto">
              {formatRelativeTime(article.published_at)}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors line-clamp-3">
            {article.title}
          </h2>
          <p className="text-slate-300 text-base md:text-lg line-clamp-2">
            {article.description}
          </p>
          {article.author && (
            <p className="text-slate-400 text-sm mt-4">By {article.author}</p>
          )}
        </div>
      </div>
    </a>
  );
}

// Regular News Card
function NewsCard({ article }: { article: NewsArticle }) {
  const sourceConfig = getSourceConfig(article.source);
  const theme = THEMES[detectTheme(article)];
  const hasImage = !!article.image_url;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden hover:-translate-y-0.5 ${hasImage ? 'h-full' : ''}`}>
        {hasImage && article.image_url && (
          <div className="aspect-video overflow-hidden bg-slate-100">
            <img
              src={article.image_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`${sourceConfig.color} text-white text-xs font-bold px-2 py-0.5 rounded`}>
              {sourceConfig.name}
            </span>
            <span className={`${theme.color} text-white text-xs px-2 py-0.5 rounded`}>
              {theme.icon} {theme.name}
            </span>
          </div>
          <h3 className={`font-semibold text-slate-800 group-hover:text-blue-600 transition-colors mb-2 ${hasImage ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {article.title}
          </h3>
          <p className={`text-slate-600 text-sm mb-3 ${hasImage ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {article.description}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{formatRelativeTime(article.published_at)}</span>
            {article.author && <span className="truncate ml-2">{article.author}</span>}
          </div>
        </div>
      </div>
    </a>
  );
}

// Compact News Card
function CompactCard({ article }: { article: NewsArticle }) {
  const sourceConfig = getSourceConfig(article.source);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 bg-white rounded-lg hover:bg-slate-50 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`${sourceConfig.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded`}>
            {sourceConfig.name}
          </span>
          <span className="text-slate-400 text-xs">
            {formatRelativeTime(article.published_at)}
          </span>
        </div>
        <h4 className="font-medium text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
          {article.title}
        </h4>
      </div>
    </a>
  );
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(20);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/news?limit=100');
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter articles by theme and search
  const filteredArticles = articles.filter((article) => {
    const matchesTheme = selectedTheme === 'all' || detectTheme(article) === selectedTheme;
    const matchesSearch = searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTheme && matchesSearch;
  });

  // Count articles by theme
  const themeCounts = Object.keys(THEMES).reduce((acc, theme) => {
    if (theme === 'all') {
      acc[theme] = articles.length;
    } else {
      acc[theme] = articles.filter(a => detectTheme(a) === theme).length;
    }
    return acc;
  }, {} as Record<string, number>);

  const displayedArticles = filteredArticles.slice(0, displayCount);
  const featuredArticle = filteredArticles[0];
  const remainingArticles = filteredArticles.slice(1, displayCount);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003399] to-[#002266] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <EUStars />
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">EU News</h1>
                <p className="text-blue-200 text-xs md:text-sm">European Political News</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-blue-200 hover:text-white text-sm transition-colors"
              >
                ← MEPs
              </Link>
              <Link
                href="/social"
                className="text-blue-200 hover:text-white text-sm transition-colors"
              >
                Social
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Theme Tabs */}
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {Object.entries(THEMES).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => setSelectedTheme(key as ThemeKey)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  selectedTheme === key
                    ? `${theme.color} text-white shadow-lg`
                    : 'bg-white text-slate-600 hover:bg-slate-100 shadow'
                }`}
              >
                <span>{theme.icon}</span>
                <span>{theme.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  selectedTheme === key ? 'bg-white/20' : 'bg-slate-100'
                }`}>
                  {themeCounts[key] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No articles found</p>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featuredArticle && (
              <div className="mb-8">
                <FeaturedCard article={featuredArticle} />
              </div>
            )}

            {/* News Grid - Masonry Layout */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 mb-8 [column-fill:_balance]">
              {remainingArticles.slice(0, 12).map((article) => (
                <div key={article.article_id} className="mb-6 break-inside-avoid">
                  <NewsCard article={article} />
                </div>
              ))}
            </div>

            {/* More News - Compact List */}
            {remainingArticles.length > 12 && (
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span>📋</span> More Headlines
                </h3>
                <div className="divide-y divide-slate-100">
                  {remainingArticles.slice(12).map((article) => (
                    <CompactCard key={article.article_id} article={article} />
                  ))}
                </div>
              </div>
            )}

            {/* Load More */}
            {filteredArticles.length > displayCount && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 20)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Load More News
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-slate-500 text-sm">
          <p>
            News aggregated from POLITICO, The Guardian, and Euronews
          </p>
          <p className="mt-1">
            Updated 4x daily at 00:00, 06:00, 12:00, 18:00 UTC
          </p>
        </footer>
      </main>
    </div>
  );
}
