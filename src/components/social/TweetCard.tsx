'use client';

import Image from 'next/image';

interface TweetCardProps {
  tweet: {
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
  };
  showRank?: number;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default function TweetCard({ tweet, showRank }: TweetCardProps) {
  const { mep } = tweet;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
      {showRank && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-[#003399]">#{showRank}</span>
          <span className="text-xs text-slate-500">Top Engagement</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* MEP Photo */}
        <div className="shrink-0">
          {mep?.photo_url ? (
            <Image
              src={mep.photo_url}
              alt={mep.name || 'MEP'}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-slate-500 text-lg">?</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900 truncate">
              {mep?.name || 'Unknown MEP'}
            </span>
            {mep?.x_handle && (
              <span className="text-slate-500 text-sm">@{mep.x_handle}</span>
            )}
            <span className="text-slate-400 text-sm">·</span>
            <span className="text-slate-500 text-sm">{formatTimeAgo(tweet.created_at)}</span>
          </div>

          {/* MEP details */}
          {mep && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {mep.country}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#003399]/10 text-[#003399]">
                {mep.group}
              </span>
            </div>
          )}

          {/* Tweet content */}
          <p className="text-slate-700 mb-3 whitespace-pre-wrap break-words">
            {tweet.content}
          </p>

          {/* Media */}
          {tweet.media_urls.length > 0 && (
            <div className="mb-3 rounded-lg overflow-hidden border border-slate-200">
              <Image
                src={tweet.media_urls[0]}
                alt="Tweet media"
                width={500}
                height={280}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Engagement stats */}
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {formatNumber(tweet.likes)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {formatNumber(tweet.retweets)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {formatNumber(tweet.replies)}
            </span>
            <a
              href={tweet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[#003399] hover:underline"
            >
              View on X
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
