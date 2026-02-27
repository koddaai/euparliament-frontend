import { NextResponse } from 'next/server';
import mepsXProfiles from '@/data/meps-x-profiles.json';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;

interface MEPXProfile {
  name: string;
  first_name: string;
  last_name: string;
  country: string;
  group: string;
  national_party: string;
  x_handle: string;
  status: string;
}

interface MEPFromDB {
  mep_id: string;
  name: string;
  photo_url: string;
  country: string;
  political_group_short: string;
}

interface EnrichedProfile extends MEPXProfile {
  photo_url: string | null;
  mep_id: string | null;
  x_url: string;
}

/**
 * Get list of current MEPs (718) with X profiles (301)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const group = searchParams.get('group');
    const search = searchParams.get('search')?.toLowerCase();

    // Start with our curated list
    const profiles: EnrichedProfile[] = (mepsXProfiles as MEPXProfile[]).map(p => ({
      ...p,
      photo_url: null,
      mep_id: null,
      x_url: `https://x.com/${p.x_handle}`,
    }));

    // Fetch MEPs from our database to get photos and mep_id
    const mepsUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?limit=1000&fields=mep_id,name,photo_url,country,political_group_short`;
    const mepsResponse = await fetch(mepsUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
      next: { revalidate: 3600 },
    });

    if (mepsResponse.ok) {
      const mepsData = await mepsResponse.json();
      const dbMeps = (mepsData.list || []) as MEPFromDB[];

      // Match by name (first + last name)
      for (const profile of profiles) {
        const normalizedName = profile.name.toLowerCase();
        const match = dbMeps.find(mep => {
          const dbName = mep.name.toLowerCase();
          // Try exact match or contains
          return dbName === normalizedName ||
                 dbName.includes(profile.last_name.toLowerCase());
        });

        if (match) {
          profile.photo_url = match.photo_url;
          profile.mep_id = match.mep_id;
        }
      }
    }

    // Apply filters
    let filtered = profiles;

    if (country) {
      filtered = filtered.filter(p => p.country.toLowerCase() === country.toLowerCase());
    }

    if (group) {
      filtered = filtered.filter(p => p.group.toLowerCase() === group.toLowerCase());
    }

    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.x_handle.toLowerCase().includes(search) ||
        p.national_party.toLowerCase().includes(search)
      );
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    // Get unique countries and groups for filters
    const countries = [...new Set(profiles.map(p => p.country))].sort();
    const groups = [...new Set(profiles.map(p => p.group))].sort();

    return NextResponse.json({
      profiles: filtered,
      total: filtered.length,
      filters: {
        countries,
        groups,
      },
    });

  } catch (error) {
    console.error('Error fetching MEP profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MEP profiles', details: String(error) },
      { status: 500 }
    );
  }
}
