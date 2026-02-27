import { NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_NEWS_TABLE_ID = process.env.NOCODB_NEWS_TABLE_ID;

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
  fetched_at: string;
}

export async function GET(request: Request) {
  try {
    if (!NOCODB_URL || !NOCODB_TOKEN || !NOCODB_NEWS_TABLE_ID) {
      return NextResponse.json(
        { error: 'News API not configured', articles: [], total: 0, sources: {} },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    // Build where clause
    const conditions: string[] = [];

    if (source) {
      conditions.push(`(source,eq,${source})`);
    }

    if (search) {
      conditions.push(`(title,like,%${search}%)~or(description,like,%${search}%)`);
    }

    const whereClause = conditions.length > 0 ? conditions.join('~and') : '';

    // Fetch articles
    const url = new URL(`${NOCODB_URL}/api/v2/tables/${NOCODB_NEWS_TABLE_ID}/records`);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('offset', offset.toString());
    url.searchParams.set('sort', '-published_at');
    if (whereClause) {
      url.searchParams.set('where', whereClause);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'xc-token': NOCODB_TOKEN,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`NocoDB error: ${response.status}`);
    }

    const data = await response.json();
    const articles: NewsArticle[] = data.list || [];

    // Get total count
    const countUrl = new URL(`${NOCODB_URL}/api/v2/tables/${NOCODB_NEWS_TABLE_ID}/records/count`);
    if (whereClause) {
      countUrl.searchParams.set('where', whereClause);
    }

    const countResponse = await fetch(countUrl.toString(), {
      headers: {
        'xc-token': NOCODB_TOKEN,
      },
      next: { revalidate: 300 },
    });

    const countData = await countResponse.json();
    const total = countData.count || 0;

    // Get source counts (for filter badges)
    const sourceCountsUrl = new URL(`${NOCODB_URL}/api/v2/tables/${NOCODB_NEWS_TABLE_ID}/records`);
    sourceCountsUrl.searchParams.set('limit', '1000');
    sourceCountsUrl.searchParams.set('fields', 'source');

    const sourceResponse = await fetch(sourceCountsUrl.toString(), {
      headers: {
        'xc-token': NOCODB_TOKEN,
      },
      next: { revalidate: 300 },
    });

    const sourceData = await sourceResponse.json();
    const sourceCounts: Record<string, number> = {};

    for (const item of (sourceData.list || [])) {
      const src = item.source || 'unknown';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    }

    return NextResponse.json({
      articles,
      total,
      sources: sourceCounts,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', details: String(error), articles: [], total: 0, sources: {} },
      { status: 500 }
    );
  }
}
