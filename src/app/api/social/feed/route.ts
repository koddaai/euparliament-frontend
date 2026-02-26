import { NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_TWEETS_TABLE_ID = process.env.NOCODB_TWEETS_TABLE_ID;
// const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID; // Not used until we add x_handle to MEPs

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

// MEP interface - will be used when we add x_handle field to MEPs table
// interface MEP {
//   mep_id: string;
//   name: string;
//   country: string;
//   political_group_short: string;
//   photo_url: string;
//   x_handle: string | null;
// }

/**
 * Get feed of recent tweets from all MEPs
 * Note: mep_id in tweets is the X username, not the numeric EP ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch tweets sorted by created_at desc (most recent first)
    const tweetsUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_TWEETS_TABLE_ID}/records?sort=-created_at&limit=${limit}&offset=${offset}`;

    const tweetsResponse = await fetch(tweetsUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!tweetsResponse.ok) {
      throw new Error(`Failed to fetch tweets: ${tweetsResponse.status}`);
    }

    const tweetsData = await tweetsResponse.json();
    const tweets: Tweet[] = tweetsData.list || [];

    // Format tweets for response (mep_id is the X username)
    const formattedTweets = tweets.map(tweet => ({
      ...tweet,
      media_urls: tweet.media_urls ? JSON.parse(tweet.media_urls) : [],
      // mep_id is the X handle, use it directly
      mep: {
        name: tweet.mep_id, // X username as display name for now
        x_handle: tweet.mep_id,
        country: null,
        group: null,
        photo_url: null,
      },
    }));

    // Get total count for pagination
    const countUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_TWEETS_TABLE_ID}/records/count`;
    const countResponse = await fetch(countUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
    });
    const countData = await countResponse.json();
    const total = countData.count || 0;

    return NextResponse.json({
      tweets: formattedTweets,
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

// fetchMEPs function - will be used when we add x_handle field to MEPs table
// async function fetchMEPs(group?: string | null, country?: string | null): Promise<MEP[]> {
//   let whereClause = '(status,eq,active)';
//   if (group) whereClause += `~and(political_group_short,eq,${group})`;
//   if (country) whereClause += `~and(country,eq,${country})`;
//   const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?where=${encodeURIComponent(whereClause)}&limit=1000`;
//   const response = await fetch(url, { headers: { 'xc-token': NOCODB_TOKEN! } });
//   if (!response.ok) return [];
//   const data = await response.json();
//   return data.list || [];
// }
