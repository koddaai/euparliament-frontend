import { NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_TWEETS_TABLE_ID = process.env.NOCODB_TWEETS_TABLE_ID;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;

interface Tweet {
  Id: number;
  mep_id: string;
  tweet_id: string;
  content: string;
  created_at: string;
  likes: number;
  retweets: number;
  replies: number;
  engagement: number;
  url: string;
  media_urls: string | null;
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
 * Get trending tweets (highest engagement in recent period)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setHours(dateThreshold.getHours() - hours);
    const dateFilter = dateThreshold.toISOString();

    // Fetch tweets sorted by engagement
    const whereClause = `(created_at,gte,${dateFilter})`;
    const tweetsUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_TWEETS_TABLE_ID}/records?where=${encodeURIComponent(whereClause)}&sort=-engagement&limit=${limit}`;

    const tweetsResponse = await fetch(tweetsUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
    });

    if (!tweetsResponse.ok) {
      throw new Error(`Failed to fetch tweets: ${tweetsResponse.status}`);
    }

    const tweetsData = await tweetsResponse.json();
    const tweets: Tweet[] = tweetsData.list || [];

    // Get MEP details
    const mepIds = [...new Set(tweets.map(t => t.mep_id))];
    const meps = await fetchMEPsByIds(mepIds);
    const mepMap = new Map(meps.map(m => [m.mep_id, m]));

    // Enrich tweets
    const enrichedTweets = tweets.map((tweet, index) => {
      const mep = mepMap.get(tweet.mep_id);
      return {
        rank: index + 1,
        tweet_id: tweet.tweet_id,
        content: tweet.content,
        created_at: tweet.created_at,
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        engagement: tweet.engagement,
        url: tweet.url,
        media_urls: tweet.media_urls ? JSON.parse(tweet.media_urls) : [],
        mep: mep ? {
          mep_id: mep.mep_id,
          name: mep.name,
          country: mep.country,
          group: mep.political_group_short,
          photo_url: mep.photo_url,
          x_handle: mep.x_handle,
        } : null,
      };
    });

    return NextResponse.json({
      period: {
        hours,
        from: dateFilter,
        to: new Date().toISOString(),
      },
      trending: enrichedTweets,
      stats: {
        totalTweets: tweets.length,
        maxEngagement: tweets.length > 0 ? tweets[0].engagement : 0,
      },
    });

  } catch (error) {
    console.error('Error fetching trending tweets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending tweets', details: String(error) },
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
