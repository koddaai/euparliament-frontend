import { NextResponse } from 'next/server';

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
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch changes');
    }

    const data = await response.json();

    return NextResponse.json({
      changes: data.list || [],
      pageInfo: data.pageInfo
    });

  } catch (error) {
    console.error('Error fetching changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch changes' },
      { status: 500 }
    );
  }
}
