import { NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_TWEETS_TABLE_ID = process.env.NOCODB_TWEETS_TABLE_ID;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;

interface Tweet {
  mep_id: string;
  engagement: number;
  created_at: string;
}

interface MEP {
  mep_id: string;
  name: string;
  country: string;
  political_group_short: string;
  photo_url: string;
  x_handle: string | null;
}

/**
 * Get rankings of MEPs by engagement and activity
 * Returns top MEPs by total engagement and tweet count
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateFilter = dateThreshold.toISOString();

    // Fetch all tweets within the time period
    const whereClause = `(created_at,gte,${dateFilter})`;
    const tweetsUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_TWEETS_TABLE_ID}/records?where=${encodeURIComponent(whereClause)}&limit=10000`;

    const tweetsResponse = await fetch(tweetsUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
    });

    if (!tweetsResponse.ok) {
      throw new Error(`Failed to fetch tweets: ${tweetsResponse.status}`);
    }

    const tweetsData = await tweetsResponse.json();
    const tweets: Tweet[] = tweetsData.list || [];

    // Aggregate by MEP
    const mepStats = new Map<string, { engagement: number; tweetCount: number }>();

    for (const tweet of tweets) {
      const existing = mepStats.get(tweet.mep_id) || { engagement: 0, tweetCount: 0 };
      existing.engagement += tweet.engagement || 0;
      existing.tweetCount += 1;
      mepStats.set(tweet.mep_id, existing);
    }

    // Fetch MEP details
    const mepIds = Array.from(mepStats.keys());
    const meps = await fetchMEPsByIds(mepIds);
    const mepMap = new Map(meps.map(m => [m.mep_id, m]));

    // Build rankings
    const engagementRanking = Array.from(mepStats.entries())
      .map(([mepId, stats]) => ({
        mep_id: mepId,
        mep: mepMap.get(mepId) || null,
        total_engagement: stats.engagement,
        tweet_count: stats.tweetCount,
        avg_engagement: Math.round(stats.engagement / stats.tweetCount),
      }))
      .filter(r => r.mep)
      .sort((a, b) => b.total_engagement - a.total_engagement)
      .slice(0, limit);

    const activityRanking = Array.from(mepStats.entries())
      .map(([mepId, stats]) => ({
        mep_id: mepId,
        mep: mepMap.get(mepId) || null,
        tweet_count: stats.tweetCount,
        total_engagement: stats.engagement,
      }))
      .filter(r => r.mep)
      .sort((a, b) => b.tweet_count - a.tweet_count)
      .slice(0, limit);

    return NextResponse.json({
      period: {
        days,
        from: dateFilter,
        to: new Date().toISOString(),
      },
      rankings: {
        byEngagement: engagementRanking.map((r, i) => ({
          rank: i + 1,
          ...r,
          mep: r.mep ? {
            name: r.mep.name,
            country: r.mep.country,
            group: r.mep.political_group_short,
            photo_url: r.mep.photo_url,
            x_handle: r.mep.x_handle,
          } : null,
        })),
        byActivity: activityRanking.map((r, i) => ({
          rank: i + 1,
          ...r,
          mep: r.mep ? {
            name: r.mep.name,
            country: r.mep.country,
            group: r.mep.political_group_short,
            photo_url: r.mep.photo_url,
            x_handle: r.mep.x_handle,
          } : null,
        })),
      },
      stats: {
        totalTweets: tweets.length,
        totalEngagement: tweets.reduce((sum, t) => sum + (t.engagement || 0), 0),
        activeMeps: mepStats.size,
      },
    });

  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings', details: String(error) },
      { status: 500 }
    );
  }
}

async function fetchMEPsByIds(mepIds: string[]): Promise<MEP[]> {
  if (mepIds.length === 0) return [];

  try {
    const filter = `(mep_id,in,${mepIds.join(',')})`;
    const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?where=${encodeURIComponent(filter)}&limit=1000`;

    const response = await fetch(url, {
      headers: { 'xc-token': NOCODB_TOKEN! },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.list || [];
  } catch {
    return [];
  }
}
