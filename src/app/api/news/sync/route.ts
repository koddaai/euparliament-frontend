import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import crypto from 'crypto';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_NEWS_TABLE_ID = process.env.NOCODB_NEWS_TABLE_ID;

// RSS Feed sources
const RSS_FEEDS = [
  { source: 'politico', url: 'https://www.politico.eu/feed/', name: 'POLITICO' },
  { source: 'guardian', url: 'https://www.theguardian.com/world/eu/rss', name: 'The Guardian' },
  { source: 'euronews', url: 'https://www.euronews.com/rss?level=theme&name=news', name: 'Euronews' },
];

interface NewsArticle {
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

interface ExistingArticle {
  Id: number;
  article_id: string;
  image_url: string | null;
}

// Extract image from various RSS formats
function extractImage(item: Record<string, unknown>): string | null {
  // media:content (can be array or single object)
  if (item['media:content']) {
    const media = item['media:content'];
    if (Array.isArray(media) && media[0]?.['$']) {
      return (media[0]['$'] as Record<string, string>).url || null;
    }
    if ((media as Record<string, unknown>)['$']) {
      return ((media as Record<string, unknown>)['$'] as Record<string, string>).url || null;
    }
  }

  // media:thumbnail
  if (item['media:thumbnail']) {
    const thumb = item['media:thumbnail'];
    if (Array.isArray(thumb) && thumb[0]?.['$']) {
      return (thumb[0]['$'] as Record<string, string>).url || null;
    }
    if ((thumb as Record<string, unknown>)['$']) {
      return ((thumb as Record<string, unknown>)['$'] as Record<string, string>).url || null;
    }
  }

  // media:group containing media:content
  if (item['media:group']) {
    const group = item['media:group'] as Record<string, unknown>;
    if (group['media:content']) {
      const content = group['media:content'];
      if (Array.isArray(content) && content[0]?.['$']) {
        return (content[0]['$'] as Record<string, string>).url || null;
      }
      if ((content as Record<string, unknown>)['$']) {
        return ((content as Record<string, unknown>)['$'] as Record<string, string>).url || null;
      }
    }
  }

  // enclosure (common in podcasts and some news feeds)
  if (item.enclosure) {
    const enclosure = item.enclosure;
    if (Array.isArray(enclosure) && enclosure[0]?.['$']) {
      const attrs = enclosure[0]['$'] as Record<string, string>;
      if (attrs.type?.startsWith('image/') || attrs.url?.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
        return attrs.url || null;
      }
    }
    if ((enclosure as Record<string, unknown>)['$']) {
      const attrs = (enclosure as Record<string, unknown>)['$'] as Record<string, string>;
      if (attrs.type?.startsWith('image/') || attrs.url?.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
        return attrs.url || null;
      }
    }
  }

  // content:encoded - extract img src
  if (item['content:encoded']) {
    const content = String(item['content:encoded']);
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
    if (imgMatch) return imgMatch[1];
  }

  // description - extract img src (handle both quotes)
  if (item.description) {
    const desc = String(Array.isArray(item.description) ? item.description[0] : item.description);
    const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/);
    if (imgMatch) return imgMatch[1];
  }

  return null;
}

// Fetch Open Graph image from article URL
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EU Parliament Monitor/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();

    // Look for og:image meta tag
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch) return ogMatch[1];

    // Look for twitter:image meta tag
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twMatch) return twMatch[1];

    return null;
  } catch {
    return null;
  }
}

// Parse RSS feed
async function parseRssFeed(feedConfig: { source: string; url: string; name: string }): Promise<NewsArticle[]> {
  try {
    const response = await fetch(feedConfig.url, {
      headers: {
        'User-Agent': 'EU Parliament Monitor/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${feedConfig.name}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const result = await parseStringPromise(xml, { explicitArray: false });

    const channel = result.rss?.channel || result.feed;
    if (!channel) {
      console.error(`Invalid RSS structure for ${feedConfig.name}`);
      return [];
    }

    const items = channel.item || channel.entry || [];
    const itemArray = Array.isArray(items) ? items : [items];

    // First pass: extract basic data
    const articles = itemArray.slice(0, 30).map((item: Record<string, unknown>) => {
      const title = String(item.title || '').trim();
      const link = item.link || item.guid;
      const url = typeof link === 'string' ? link : (link as Record<string, string>)?.['_'] || String(link);

      // Generate unique article ID using hash
      const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
      const articleId = `${feedConfig.source}_${hash}`;

      // Get description, strip HTML
      let description = '';
      if (item.description) {
        description = String(Array.isArray(item.description) ? item.description[0] : item.description);
        description = description.replace(/<[^>]*>/g, '').trim().slice(0, 500);
      }

      // Get published date
      let publishedAt = new Date().toISOString();
      if (item.pubDate) {
        publishedAt = new Date(String(item.pubDate)).toISOString();
      } else if (item.published) {
        publishedAt = new Date(String(item.published)).toISOString();
      } else if (item['dc:date']) {
        publishedAt = new Date(String(item['dc:date'])).toISOString();
      }

      // Get category
      let category: string | null = null;
      if (item.category) {
        const cat = Array.isArray(item.category) ? item.category[0] : item.category;
        category = typeof cat === 'string' ? cat : (cat as Record<string, string>)?.['_'] || null;
      }

      // Get author
      let author: string | null = null;
      if (item['dc:creator']) {
        author = String(item['dc:creator']);
      } else if (item.author) {
        const auth = item.author;
        author = typeof auth === 'string' ? auth : (auth as Record<string, string>)?.name || null;
      }

      return {
        article_id: articleId,
        source: feedConfig.source,
        title,
        description,
        url,
        image_url: extractImage(item),
        category,
        author,
        published_at: publishedAt,
      };
    });

    // Fetch OG image only for the first article (featured) if no image from RSS
    if (articles.length > 0 && !articles[0].image_url) {
      console.log(`Fetching OG image for featured article from ${feedConfig.name}`);
      const ogImage = await fetchOgImage(articles[0].url);
      if (ogImage) {
        articles[0].image_url = ogImage;
      }
    }

    return articles;
  } catch (error) {
    console.error(`Error parsing ${feedConfig.name}:`, error);
    return [];
  }
}

// GET endpoint - allows triggering sync via browser/cron
export async function GET() {
  return handleSync();
}

// POST endpoint - for n8n or other automation
export async function POST() {
  return handleSync();
}

async function handleSync() {
  try {
    if (!NOCODB_URL || !NOCODB_TOKEN || !NOCODB_NEWS_TABLE_ID) {
      return NextResponse.json(
        { error: 'News API not configured. Set NOCODB_NEWS_TABLE_ID in .env' },
        { status: 500 }
      );
    }

    // Fetch all RSS feeds in parallel
    console.log('Fetching RSS feeds...');
    const feedResults = await Promise.all(RSS_FEEDS.map(parseRssFeed));
    const articles: NewsArticle[] = feedResults.flat();

    console.log(`Fetched ${articles.length} articles from ${RSS_FEEDS.length} sources`);

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles fetched from RSS feeds',
        inserted: 0,
        updated: 0,
      });
    }

    // Fetch existing articles to check for duplicates
    const existingMap = new Map<string, { Id: number; image_url: string | null }>();
    let offset = 0;

    while (true) {
      const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_NEWS_TABLE_ID}/records?limit=1000&offset=${offset}&fields=Id,article_id,image_url`;
      const response = await fetch(url, {
        headers: { 'xc-token': NOCODB_TOKEN },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch existing articles: ${response.status}`);
      }

      const data = await response.json();
      const list: ExistingArticle[] = data.list || [];

      for (const article of list) {
        existingMap.set(article.article_id, { Id: article.Id, image_url: article.image_url });
      }

      if (list.length < 1000) break;
      offset += 1000;
    }

    // Insert new articles and update images for existing articles without images
    const toInsert: Record<string, unknown>[] = [];
    const toUpdateImages: { Id: number; image_url: string }[] = [];
    const now = new Date().toISOString();

    for (const article of articles) {
      const existing = existingMap.get(article.article_id);
      if (!existing) {
        // New article - insert
        toInsert.push({
          article_id: article.article_id,
          source: article.source,
          title: article.title,
          description: article.description,
          url: article.url,
          image_url: article.image_url,
          category: article.category,
          author: article.author,
          published_at: article.published_at,
          fetched_at: now,
        });
      } else if (!existing.image_url && article.image_url) {
        // Existing article without image but new data has image - update
        toUpdateImages.push({ Id: existing.Id, image_url: article.image_url });
      }
    }

    const skipped = articles.length - toInsert.length - toUpdateImages.length;

    // Insert new articles
    if (toInsert.length > 0) {
      const insertResponse = await fetch(
        `${NOCODB_URL}/api/v2/tables/${NOCODB_NEWS_TABLE_ID}/records`,
        {
          method: 'POST',
          headers: {
            'xc-token': NOCODB_TOKEN,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(toInsert),
        }
      );

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        console.error('Insert error:', errorText);
        throw new Error(`Failed to insert articles: ${insertResponse.status}`);
      }
    }

    // Update images for existing articles that didn't have one
    if (toUpdateImages.length > 0) {
      console.log(`Updating images for ${toUpdateImages.length} existing articles`);
      const updateResponse = await fetch(
        `${NOCODB_URL}/api/v2/tables/${NOCODB_NEWS_TABLE_ID}/records`,
        {
          method: 'PATCH',
          headers: {
            'xc-token': NOCODB_TOKEN,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(toUpdateImages),
        }
      );

      if (!updateResponse.ok) {
        console.error('Failed to update images:', await updateResponse.text());
      }
    }

    // Clean up old articles (keep only last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString();

    const oldArticlesUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_NEWS_TABLE_ID}/records?where=(published_at,lt,${cutoffDate})&fields=Id`;
    const oldResponse = await fetch(oldArticlesUrl, {
      headers: { 'xc-token': NOCODB_TOKEN },
    });

    let deleted = 0;
    if (oldResponse.ok) {
      const oldData = await oldResponse.json();
      const toDelete = (oldData.list || []).map((a: { Id: number }) => ({ Id: a.Id }));

      if (toDelete.length > 0) {
        for (let i = 0; i < toDelete.length; i += 100) {
          const batch = toDelete.slice(i, i + 100);
          await fetch(
            `${NOCODB_URL}/api/v2/tables/${NOCODB_NEWS_TABLE_ID}/records`,
            {
              method: 'DELETE',
              headers: {
                'xc-token': NOCODB_TOKEN,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(batch),
            }
          );
          deleted += batch.length;
        }
      }
    }

    const sourceCounts: Record<string, number> = {};
    for (const article of articles) {
      sourceCounts[article.source] = (sourceCounts[article.source] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      fetched: articles.length,
      inserted: toInsert.length,
      imagesUpdated: toUpdateImages.length,
      skipped,
      deleted,
      sources: sourceCounts,
      timestamp: now,
    });
  } catch (error) {
    console.error('Error syncing news:', error);
    return NextResponse.json(
      { error: 'Failed to sync news', details: String(error) },
      { status: 500 }
    );
  }
}
