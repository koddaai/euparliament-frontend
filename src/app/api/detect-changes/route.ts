import { NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;
const NOCODB_CHANGES_TABLE_ID = process.env.NOCODB_CHANGES_TABLE_ID;

interface MEP {
  Id: number;
  mep_id: string;
  name: string;
  country: string;
  national_party: string;
  political_group: string;
  political_group_short: string;
  photo_url: string;
  profile_url: string;
  status: string;
  last_updated: string;
}

interface ScrapedMEP {
  mep_id: string;
  name: string;
  country: string;
  national_party: string;
  political_group: string;
  political_group_short: string;
  photo_url: string;
  profile_url: string;
}

interface ChangeRecord {
  mep_id: string;
  mep_name?: string;
  change_type: 'joined' | 'left' | 'group_change';
  old_value?: string | null;
  new_value?: string | null;
  detected_at: string;
}

async function logChange(change: ChangeRecord): Promise<boolean> {
  try {
    const response = await fetch(
      `${NOCODB_URL}/api/v2/tables/${NOCODB_CHANGES_TABLE_ID}/records`,
      {
        method: 'POST',
        headers: {
          'xc-token': NOCODB_TOKEN!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(change),
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function updateMepStatus(mepId: number, status: string): Promise<void> {
  await fetch(
    `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records`,
    {
      method: 'PATCH',
      headers: {
        'xc-token': NOCODB_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: mepId, status, last_updated: new Date().toISOString() }),
    }
  );
}

async function updateMepGroup(mepId: number, political_group: string, political_group_short: string): Promise<void> {
  await fetch(
    `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records`,
    {
      method: 'PATCH',
      headers: {
        'xc-token': NOCODB_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Id: mepId,
        political_group,
        political_group_short,
        last_updated: new Date().toISOString()
      }),
    }
  );
}

export async function POST(request: Request) {
  try {
    const now = new Date().toISOString();
    const loggedChanges: ChangeRecord[] = [];

    // Get all MEPs from database
    const mepsUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?limit=1000`;
    const mepsResponse = await fetch(mepsUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
    });

    if (!mepsResponse.ok) {
      const errorText = await mepsResponse.text();
      throw new Error(`Failed to fetch MEPs from database: ${mepsResponse.status} - ${errorText}`);
    }

    const mepsData = await mepsResponse.json();
    const dbMeps: MEP[] = mepsData.list || [];

    // Create lookup maps
    const dbMepById = new Map<string, MEP>();
    dbMeps.forEach(mep => dbMepById.set(mep.mep_id, mep));

    // Try to get scraped data from request body (optional)
    let scrapedMeps: ScrapedMEP[] = [];
    try {
      const body = await request.json();
      if (body && Array.isArray(body.meps)) {
        scrapedMeps = body.meps;
      }
    } catch {
      // No body or invalid JSON - use timestamp-based detection
    }

    // If we have scraped data, use it for comparison
    if (scrapedMeps.length > 0) {
      const scrapedMepIds = new Set(scrapedMeps.map(m => m.mep_id));
      const scrapedMepById = new Map<string, ScrapedMEP>();
      scrapedMeps.forEach(mep => scrapedMepById.set(mep.mep_id, mep));

      // Detect JOINS: MEPs in scrape but not in DB (or were inactive)
      for (const scraped of scrapedMeps) {
        const dbMep = dbMepById.get(scraped.mep_id);

        if (!dbMep) {
          // Completely new MEP
          const change: ChangeRecord = {
            mep_id: scraped.mep_id,
            mep_name: scraped.name,
            change_type: 'joined',
            new_value: scraped.political_group_short,
            detected_at: now,
          };
          if (await logChange(change)) {
            loggedChanges.push(change);
          }
        } else if (dbMep.status === 'inactive') {
          // MEP returned after leaving
          const change: ChangeRecord = {
            mep_id: scraped.mep_id,
            mep_name: scraped.name,
            change_type: 'joined',
            new_value: scraped.political_group_short,
            detected_at: now,
          };
          if (await logChange(change)) {
            loggedChanges.push(change);
            await updateMepStatus(dbMep.Id, 'active');
          }
        } else {
          // MEP exists and is active - check for group changes
          if (dbMep.political_group_short !== scraped.political_group_short) {
            const change: ChangeRecord = {
              mep_id: scraped.mep_id,
              mep_name: scraped.name,
              change_type: 'group_change',
              old_value: dbMep.political_group_short,
              new_value: scraped.political_group_short,
              detected_at: now,
            };
            if (await logChange(change)) {
              loggedChanges.push(change);
              await updateMepGroup(dbMep.Id, scraped.political_group, scraped.political_group_short);
            }
          }
        }
      }

      // Detect LEAVES: Active MEPs in DB but not in scrape
      for (const dbMep of dbMeps) {
        if (dbMep.status === 'active' && !scrapedMepIds.has(dbMep.mep_id)) {
          const change: ChangeRecord = {
            mep_id: dbMep.mep_id,
            mep_name: dbMep.name,
            change_type: 'left',
            old_value: dbMep.political_group_short,
            detected_at: now,
          };
          if (await logChange(change)) {
            loggedChanges.push(change);
            await updateMepStatus(dbMep.Id, 'inactive');
          }
        }
      }
    } else {
      // Fallback: timestamp-based detection (when no scraped data provided)
      // Find the most recent update timestamp
      const updateTimes = dbMeps.map(m => new Date(m.last_updated).getTime());
      const mostRecentUpdate = Math.max(...updateTimes);
      const scrapeThreshold = mostRecentUpdate - (5 * 60 * 1000); // 5 minutes tolerance

      // MEPs NOT updated recently but still active = they left
      const exitedMeps = dbMeps.filter(m =>
        m.status === 'active' &&
        new Date(m.last_updated).getTime() < scrapeThreshold
      );

      for (const mep of exitedMeps) {
        const change: ChangeRecord = {
          mep_id: mep.mep_id,
          mep_name: mep.name,
          change_type: 'left',
          old_value: mep.political_group_short,
          detected_at: now,
        };
        if (await logChange(change)) {
          loggedChanges.push(change);
          await updateMepStatus(mep.Id, 'inactive');
        }
      }
    }

    const joins = loggedChanges.filter(c => c.change_type === 'joined');
    const leaves = loggedChanges.filter(c => c.change_type === 'left');
    const groupChanges = loggedChanges.filter(c => c.change_type === 'group_change');

    return NextResponse.json({
      success: true,
      message: `Detected ${joins.length} joins, ${leaves.length} leaves, ${groupChanges.length} group changes`,
      changes: loggedChanges,
      stats: {
        totalMepsInDb: dbMeps.length,
        scrapedMepsReceived: scrapedMeps.length,
        detectedJoins: joins.length,
        detectedLeaves: leaves.length,
        detectedGroupChanges: groupChanges.length,
      }
    });

  } catch (error) {
    console.error('Error detecting changes:', error);
    return NextResponse.json(
      { error: 'Failed to detect changes', details: String(error) },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing
export async function GET(request: Request) {
  return POST(request);
}
