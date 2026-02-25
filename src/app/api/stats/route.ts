import { NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;

export async function GET() {
  try {
    // Get all active MEPs to calculate stats
    const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?where=(status,eq,active)&limit=1000`;

    const response = await fetch(url, {
      headers: {
        'xc-token': NOCODB_TOKEN!,
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch MEPs for stats');
    }

    const data = await response.json();
    const meps = data.list || [];

    // Calculate stats
    const totalMeps = meps.length;

    // Group by political group
    const byGroup: Record<string, number> = {};
    meps.forEach((mep: { political_group_short: string }) => {
      const group = mep.political_group_short || 'Unknown';
      byGroup[group] = (byGroup[group] || 0) + 1;
    });

    // Group by country
    const byCountry: Record<string, number> = {};
    meps.forEach((mep: { country: string }) => {
      const country = mep.country || 'Unknown';
      byCountry[country] = (byCountry[country] || 0) + 1;
    });

    // Sort groups by count
    const groupStats = Object.entries(byGroup)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Sort countries by count
    const countryStats = Object.entries(byCountry)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalMeps,
      byGroup: groupStats,
      byCountry: countryStats
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
