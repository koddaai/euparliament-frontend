import { SearchMepsArgs } from '@/types/chat';
import { searchWeb } from '@/lib/tavily';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;
const NOCODB_CHANGES_TABLE_ID = process.env.NOCODB_CHANGES_TABLE_ID;

interface MEP {
  mep_id: string;
  name: string;
  country: string;
  national_party: string;
  political_group: string;
  political_group_short: string;
  photo_url: string;
  profile_url: string;
}

export async function handleSearchMeps(args: SearchMepsArgs): Promise<string> {
  const conditions: string[] = ['(status,eq,active)'];

  if (args.name) {
    conditions.push(`(name,like,%${args.name}%)`);
  }

  if (args.country) {
    conditions.push(`(country,eq,${args.country})`);
  }

  if (args.political_group) {
    conditions.push(`(political_group_short,eq,${args.political_group})`);
  }

  const whereClause = conditions.join('~and');
  const limit = args.limit || 10;

  const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?where=${encodeURIComponent(whereClause)}&limit=${limit}&sort=name`;

  const response = await fetch(url, {
    headers: { 'xc-token': NOCODB_TOKEN! },
  });

  if (!response.ok) {
    return JSON.stringify({ error: 'Failed to search MEPs' });
  }

  const data = await response.json();
  const meps: MEP[] = data.list || [];

  if (meps.length === 0) {
    return JSON.stringify({
      message: 'No MEPs found matching the criteria',
      count: 0,
    });
  }

  return JSON.stringify({
    count: meps.length,
    meps: meps.map((m) => ({
      name: m.name,
      country: m.country,
      party: m.national_party,
      group: m.political_group_short,
      profile: m.profile_url,
    })),
  });
}

export async function handleGetStats(): Promise<string> {
  const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?where=(status,eq,active)&limit=1000`;

  const response = await fetch(url, {
    headers: { 'xc-token': NOCODB_TOKEN! },
  });

  if (!response.ok) {
    return JSON.stringify({ error: 'Failed to fetch stats' });
  }

  const data = await response.json();
  const meps: MEP[] = data.list || [];

  // Calculate stats
  const byGroup: Record<string, number> = {};
  const byCountry: Record<string, number> = {};

  meps.forEach((mep) => {
    byGroup[mep.political_group_short] = (byGroup[mep.political_group_short] || 0) + 1;
    byCountry[mep.country] = (byCountry[mep.country] || 0) + 1;
  });

  // Sort by count
  const groupStats = Object.entries(byGroup)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const countryStats = Object.entries(byCountry)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return JSON.stringify({
    totalMeps: meps.length,
    byGroup: groupStats,
    byCountry: countryStats,
  });
}

export async function handleSearchWeb(args: { query: string }): Promise<string> {
  try {
    const results = await searchWeb(args.query);
    return JSON.stringify(results);
  } catch (error) {
    return JSON.stringify({
      error: 'Web search failed',
      details: String(error),
    });
  }
}

interface Change {
  id: number;
  mep_id: string;
  mep_name: string;
  change_type: 'joined' | 'left' | 'group_change';
  old_value?: string;
  new_value?: string;
  detected_at: string;
}

export async function handleGetRecentChanges(args: {
  change_type?: string;
  limit?: number;
}): Promise<string> {
  const limit = args.limit || 10;
  let whereClause = '';

  if (args.change_type && args.change_type !== 'all') {
    whereClause = `?where=(change_type,eq,${args.change_type})`;
  }

  const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_CHANGES_TABLE_ID}/records${whereClause}&limit=${limit}&sort=-detected_at`;

  try {
    const response = await fetch(url, {
      headers: { 'xc-token': NOCODB_TOKEN! },
    });

    if (!response.ok) {
      return JSON.stringify({ error: 'Failed to fetch changes' });
    }

    const data = await response.json();
    const changes: Change[] = data.list || [];

    if (changes.length === 0) {
      return JSON.stringify({
        message: 'No recent changes found',
        count: 0,
      });
    }

    return JSON.stringify({
      count: changes.length,
      changes: changes.map((c) => ({
        mep_name: c.mep_name,
        change_type: c.change_type,
        old_value: c.old_value,
        new_value: c.new_value,
        date: c.detected_at,
      })),
    });
  } catch (error) {
    return JSON.stringify({
      error: 'Failed to fetch changes',
      details: String(error),
    });
  }
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'search_meps':
      return handleSearchMeps(args as SearchMepsArgs);
    case 'get_stats':
      return handleGetStats();
    case 'search_web':
      return handleSearchWeb(args as { query: string });
    case 'get_recent_changes':
      return handleGetRecentChanges(args as { change_type?: string; limit?: number });
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
