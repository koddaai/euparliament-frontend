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

async function logChanges(changes: ChangeRecord[]): Promise<number> {
  if (changes.length === 0) return 0;

  try {
    // NocoDB supports bulk insert
    const response = await fetch(
      `${NOCODB_URL}/api/v2/tables/${NOCODB_CHANGES_TABLE_ID}/records`,
      {
        method: 'POST',
        headers: {
          'xc-token': NOCODB_TOKEN!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
      }
    );
    return response.ok ? changes.length : 0;
  } catch {
    return 0;
  }
}

interface MepUpdate {
  Id: number;
  status?: string;
  political_group?: string;
  political_group_short?: string;
  last_updated: string;
}

async function batchUpdateMeps(updates: MepUpdate[]): Promise<void> {
  if (updates.length === 0) return;

  // NocoDB supports bulk patch
  await fetch(
    `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records`,
    {
      method: 'PATCH',
      headers: {
        'xc-token': NOCODB_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );
}

export async function POST(request: Request) {
  try {
    const now = new Date().toISOString();
    const loggedChanges: ChangeRecord[] = [];

    // Try to get scraped data from request body (optional)
    let scrapedMeps: ScrapedMEP[] = [];
    try {
      const body = await request.json();
      if (body && Array.isArray(body.meps)) {
        scrapedMeps = body.meps;
      } else if (Array.isArray(body)) {
        // Also support direct array format
        scrapedMeps = body;
      }
    } catch {
      // No body or invalid JSON - use timestamp-based detection
    }

    // First sync MEPs to database (upsert to prevent duplicates)
    if (scrapedMeps.length > 0) {
      const syncUrl = new URL('/api/meps/sync', request.url);
      const syncResponse = await fetch(syncUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meps: scrapedMeps }),
      });

      if (!syncResponse.ok) {
        console.error('Failed to sync MEPs:', await syncResponse.text());
      }
    }

    // Get all MEPs from database (after sync)
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

    // Collect all changes and updates, then batch execute
    const changesToLog: ChangeRecord[] = [];
    const mepUpdates: MepUpdate[] = [];

    // If we have scraped data, use it for comparison
    if (scrapedMeps.length > 0) {
      const scrapedMepIds = new Set(scrapedMeps.map(m => m.mep_id));
      const scrapedMepById = new Map<string, ScrapedMEP>();
      scrapedMeps.forEach(mep => scrapedMepById.set(mep.mep_id, mep));

      // Detect JOINS: MEPs in scrape but not in DB (or were inactive)
      for (const scraped of scrapedMeps) {
        const dbMep = dbMepById.get(scraped.mep_id);

        if (!dbMep) {
          // Completely new MEP - log join but don't update (will be inserted by sync)
          changesToLog.push({
            mep_id: scraped.mep_id,
            mep_name: scraped.name,
            change_type: 'joined',
            new_value: scraped.political_group_short,
            detected_at: now,
          });
        } else if (dbMep.status === 'inactive') {
          // MEP returned after leaving
          changesToLog.push({
            mep_id: scraped.mep_id,
            mep_name: scraped.name,
            change_type: 'joined',
            new_value: scraped.political_group_short,
            detected_at: now,
          });
          mepUpdates.push({
            Id: dbMep.Id,
            status: 'active',
            last_updated: now,
          });
        } else {
          // MEP exists and is active - check for group changes
          if (dbMep.political_group_short !== scraped.political_group_short) {
            changesToLog.push({
              mep_id: scraped.mep_id,
              mep_name: scraped.name,
              change_type: 'group_change',
              old_value: dbMep.political_group_short,
              new_value: scraped.political_group_short,
              detected_at: now,
            });
            mepUpdates.push({
              Id: dbMep.Id,
              political_group: scraped.political_group,
              political_group_short: scraped.political_group_short,
              last_updated: now,
            });
          }
        }
      }

      // Detect LEAVES: Active MEPs in DB but not in scrape
      for (const dbMep of dbMeps) {
        if (dbMep.status === 'active' && !scrapedMepIds.has(dbMep.mep_id)) {
          changesToLog.push({
            mep_id: dbMep.mep_id,
            mep_name: dbMep.name,
            change_type: 'left',
            old_value: dbMep.political_group_short,
            detected_at: now,
          });
          mepUpdates.push({
            Id: dbMep.Id,
            status: 'inactive',
            last_updated: now,
          });
        }
      }
    } else {
      // Fallback: timestamp-based detection (when no scraped data provided)
      const updateTimes = dbMeps.map(m => new Date(m.last_updated).getTime());
      const mostRecentUpdate = Math.max(...updateTimes);
      const scrapeThreshold = mostRecentUpdate - (5 * 60 * 1000); // 5 minutes tolerance

      const exitedMeps = dbMeps.filter(m =>
        m.status === 'active' &&
        new Date(m.last_updated).getTime() < scrapeThreshold
      );

      for (const mep of exitedMeps) {
        changesToLog.push({
          mep_id: mep.mep_id,
          mep_name: mep.name,
          change_type: 'left',
          old_value: mep.political_group_short,
          detected_at: now,
        });
        mepUpdates.push({
          Id: mep.Id,
          status: 'inactive',
          last_updated: now,
        });
      }
    }

    // Execute batch operations in parallel
    const [loggedCount] = await Promise.all([
      logChanges(changesToLog),
      batchUpdateMeps(mepUpdates),
    ]);

    // Mark as logged only if batch succeeded
    if (loggedCount > 0) {
      loggedChanges.push(...changesToLog);
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
