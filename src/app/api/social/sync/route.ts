import { NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_TWEETS_TABLE_ID = process.env.NOCODB_TWEETS_TABLE_ID;

interface TweetData {
  mep_id: string;
  tweet_id: string;
  content: string;
  created_at: string;
  likes: number;
  retweets: number;
  replies: number;
  url: string;
  media_urls?: string[];
}

interface ExistingTweet {
  Id: number;
  tweet_id: string;
}

/**
 * Sync tweets from external source (Apify) to NocoDB
 * Handles upsert to prevent duplicates
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tweets: TweetData[] = Array.isArray(body) ? body : (body.tweets || []);

    if (tweets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No tweets provided',
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Get existing tweets to avoid duplicates
    const tweetIds = tweets.map(t => t.tweet_id);
    const existingTweets = await fetchExistingTweets(tweetIds);
    const existingTweetIds = new Set(existingTweets.map(t => t.tweet_id));

    // Separate into updates and inserts
    interface TweetRecord {
      mep_id: string;
      tweet_id: string;
      content: string;
      created_at: string;
      likes: number;
      retweets: number;
      replies: number;
      url: string;
      engagement: number;
      media_urls: string | null;
      fetched_at: string;
    }

    const toInsert: TweetRecord[] = [];
    const toUpdate: Array<{ Id: number } & TweetRecord> = [];

    for (const tweet of tweets) {
      const engagement = tweet.likes + tweet.retweets + tweet.replies;
      const tweetRecord: TweetRecord = {
        mep_id: tweet.mep_id,
        tweet_id: tweet.tweet_id,
        content: tweet.content,
        created_at: tweet.created_at,
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        url: tweet.url,
        engagement,
        media_urls: tweet.media_urls ? JSON.stringify(tweet.media_urls) : null,
        fetched_at: now,
      };

      if (existingTweetIds.has(tweet.tweet_id)) {
        // Update existing tweet (engagement may have changed)
        const existing = existingTweets.find(t => t.tweet_id === tweet.tweet_id);
        if (existing) {
          toUpdate.push({ Id: existing.Id, ...tweetRecord });
        }
      } else {
        toInsert.push(tweetRecord);
      }
    }

    let insertedCount = 0;
    let updatedCount = 0;

    // Batch insert new tweets
    if (toInsert.length > 0) {
      const insertResponse = await fetch(
        `${NOCODB_URL}/api/v2/tables/${NOCODB_TWEETS_TABLE_ID}/records`,
        {
          method: 'POST',
          headers: {
            'xc-token': NOCODB_TOKEN!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(toInsert),
        }
      );
      if (insertResponse.ok) {
        insertedCount = toInsert.length;
      }
    }

    // Batch update existing tweets
    if (toUpdate.length > 0) {
      const updateResponse = await fetch(
        `${NOCODB_URL}/api/v2/tables/${NOCODB_TWEETS_TABLE_ID}/records`,
        {
          method: 'PATCH',
          headers: {
            'xc-token': NOCODB_TOKEN!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(toUpdate),
        }
      );
      if (updateResponse.ok) {
        updatedCount = toUpdate.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${tweets.length} tweets: ${insertedCount} inserted, ${updatedCount} updated`,
      stats: {
        received: tweets.length,
        inserted: insertedCount,
        updated: updatedCount,
      },
    });

  } catch (error) {
    console.error('Error syncing tweets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync tweets', details: String(error) },
      { status: 500 }
    );
  }
}

async function fetchExistingTweets(tweetIds: string[]): Promise<ExistingTweet[]> {
  if (tweetIds.length === 0) return [];

  try {
    // NocoDB filter for tweet_ids
    const filter = `(tweet_id,in,${tweetIds.join(',')})`;
    const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_TWEETS_TABLE_ID}/records?where=${encodeURIComponent(filter)}&limit=1000`;

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
