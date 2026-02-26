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
 * Get feed of recent tweets from all MEPs
 * Supports filtering by group and country
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const group = searchParams.get('group');
    const country = searchParams.get('country');

    // First, get MEPs (for filtering and enrichment)
    const meps = await fetchMEPs(group, country);
    const mepIds = meps.map(m => m.mep_id);
    const mepMap = new Map(meps.map(m => [m.mep_id, m]));

    if (mepIds.length === 0) {
      return NextResponse.json({
        tweets: [],
        pagination: { total: 0, limit, offset },
      });
    }

    // Build filter for tweets
    let whereClause = `(mep_id,in,${mepIds.join(',')})`;

    // Fetch tweets sorted by created_at desc
    const tweetsUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_TWEETS_TABLE_ID}/records?where=${encodeURIComponent(whereClause)}&sort=-created_at&limit=${limit}&offset=${offset}`;

    const tweetsResponse = await fetch(tweetsUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
    });

    if (!tweetsResponse.ok) {
      throw new Error(`Failed to fetch tweets: ${tweetsResponse.status}`);
    }

    const tweetsData = await tweetsResponse.json();
    const tweets: Tweet[] = tweetsData.list || [];

    // Enrich tweets with MEP info
    const enrichedTweets = tweets.map(tweet => {
      const mep = mepMap.get(tweet.mep_id);
      return {
        ...tweet,
        media_urls: tweet.media_urls ? JSON.parse(tweet.media_urls) : [],
        mep: mep ? {
          name: mep.name,
          country: mep.country,
          group: mep.political_group_short,
          photo_url: mep.photo_url,
          x_handle: mep.x_handle,
        } : null,
      };
    });

    // Get total count for pagination
    const countUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_TWEETS_TABLE_ID}/records/count?where=${encodeURIComponent(whereClause)}`;
    const countResponse = await fetch(countUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
    });
    const countData = await countResponse.json();
    const total = countData.count || 0;

    return NextResponse.json({
      tweets: enrichedTweets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + tweets.length < total,
      },
    });

  } catch (error) {
    console.error('Error fetching social feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social feed', details: String(error) },
      { status: 500 }
    );
  }
}

async function fetchMEPs(group?: string | null, country?: string | null): Promise<MEP[]> {
  let whereClause = '(status,eq,active)';

  if (group) {
    whereClause += `~and(political_group_short,eq,${group})`;
  }
  if (country) {
    whereClause += `~and(country,eq,${country})`;
  }

  const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?where=${encodeURIComponent(whereClause)}&limit=1000`;

  const response = await fetch(url, {
    headers: { 'xc-token': NOCODB_TOKEN! },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.list || [];
}
