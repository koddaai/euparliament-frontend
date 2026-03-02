import { NextResponse } from 'next/server';

// Force this route to be dynamic - never cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_CHANGES_TABLE_ID = process.env.NOCODB_CHANGES_TABLE_ID;

export async function GET() {
  try {
    const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_CHANGES_TABLE_ID}/records?sort=-detected_at&limit=50`;

    const response = await fetch(url, {
      headers: {
        'xc-token': NOCODB_TOKEN!,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch changes');
    }

    const data = await response.json();

    return NextResponse.json({
      changes: data.list || [],
      pageInfo: data.pageInfo
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Error fetching changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch changes' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  }
}
