import { NextRequest, NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const country = searchParams.get('country');
  const group = searchParams.get('group');
  const search = searchParams.get('search');
  const limit = searchParams.get('limit') || '100';
  const offset = searchParams.get('offset') || '0';

  try {
    // Build where clause
    const conditions: string[] = ['(status,eq,active)'];

    if (country) {
      conditions.push(`(country,eq,${country})`);
    }

    if (group) {
      conditions.push(`(political_group_short,eq,${group})`);
    }

    if (search) {
      conditions.push(`(name,like,%${search}%)`);
    }

    const whereClause = conditions.join('~and');

    const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?where=${encodeURIComponent(whereClause)}&limit=${limit}&offset=${offset}&sort=name`;

    const response = await fetch(url, {
      headers: {
        'xc-token': NOCODB_TOKEN!,
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NocoDB error:', errorText);
      throw new Error('NocoDB request failed');
    }

    const data = await response.json();

    return NextResponse.json({
      meps: data.list || [],
      pageInfo: data.pageInfo
    });

  } catch (error) {
    console.error('Error fetching MEPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MEPs' },
      { status: 500 }
    );
  }
}
