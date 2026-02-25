import { NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;
const NOCODB_CHANGES_TABLE_ID = process.env.NOCODB_CHANGES_TABLE_ID;

interface MEP {
  Id: number;
  mep_id: string;
  name: string;
  status: string;
  last_updated: string;
}

interface ChangeRecord {
  mep_id: string;
  mep_name: string;
  change_type: 'entry' | 'exit';
  detected_at: string;
}

export async function POST() {
  try {
    // Get all MEPs from database
    const mepsUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?limit=1000`;
    const mepsResponse = await fetch(mepsUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
    });

    if (!mepsResponse.ok) {
      throw new Error('Failed to fetch MEPs');
    }

    const mepsData = await mepsResponse.json();
    const meps: MEP[] = mepsData.list || [];

    // Find the most recent update timestamp (this is when the scrape ran)
    const updateTimes = meps.map(m => new Date(m.last_updated).getTime());
    const mostRecentUpdate = Math.max(...updateTimes);
    const scrapeThreshold = mostRecentUpdate - (5 * 60 * 1000); // 5 minutes tolerance

    // MEPs updated in this scrape (present in current parliament list)
    const currentMeps = meps.filter(m =>
      new Date(m.last_updated).getTime() >= scrapeThreshold
    );
    const currentMepIds = new Set(currentMeps.map(m => m.mep_id));

    // MEPs NOT updated in this scrape but still marked active = they left
    const exitedMeps = meps.filter(m =>
      m.status === 'active' &&
      new Date(m.last_updated).getTime() < scrapeThreshold
    );

    // Get existing changes to check for already logged changes
    const changesUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_CHANGES_TABLE_ID}/records?limit=2000&sort=-detected_at`;
    const changesResponse = await fetch(changesUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
    });

    let existingChanges: { mep_id: string; change_type: string; detected_at: string }[] = [];
    if (changesResponse.ok) {
      const changesData = await changesResponse.json();
      existingChanges = changesData.list || [];
    }

    // Get the set of MEP IDs that have EVER had an entry logged
    // (to distinguish between "new MEP" and "MEP that was already tracked")
    const everLoggedAsEntry = new Set(
      existingChanges.filter(c => c.change_type === 'entry').map(c => c.mep_id)
    );

    // Get MEPs logged as exit that haven't re-entered
    const exitedButNotReentered = new Set(
      existingChanges
        .filter(c => c.change_type === 'exit')
        .filter(c => {
          // Check if there's a more recent entry for this MEP
          const exitDate = new Date(c.detected_at);
          const hasReentry = existingChanges.some(e =>
            e.mep_id === c.mep_id &&
            e.change_type === 'entry' &&
            new Date(e.detected_at) > exitDate
          );
          return !hasReentry;
        })
        .map(c => c.mep_id)
    );

    const loggedChanges: ChangeRecord[] = [];
    const now = new Date().toISOString();

    // Detect ENTRIES: MEPs in current scrape that were previously marked as exited
    // (they came back) or completely new MEPs
    for (const mep of currentMeps) {
      // Case 1: MEP was previously exited and is now back
      if (exitedButNotReentered.has(mep.mep_id)) {
        const changeRecord: ChangeRecord = {
          mep_id: mep.mep_id,
          mep_name: mep.name,
          change_type: 'entry',
          detected_at: now,
        };

        const createResponse = await fetch(
          `${NOCODB_URL}/api/v2/tables/${NOCODB_CHANGES_TABLE_ID}/records`,
          {
            method: 'POST',
            headers: {
              'xc-token': NOCODB_TOKEN!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(changeRecord),
          }
        );

        if (createResponse.ok) {
          loggedChanges.push(changeRecord);
        }
      }
      // Note: We don't log "entry" for MEPs that have always been here
      // The initial population is not a "change"
    }

    // Detect EXITS: MEPs that were active but not in current scrape
    for (const mep of exitedMeps) {
      // Check if already logged as exit
      const alreadyLoggedExit = existingChanges.some(c =>
        c.mep_id === mep.mep_id &&
        c.change_type === 'exit' &&
        !everLoggedAsEntry.has(mep.mep_id) // Only if no subsequent entry
      );

      if (!exitedButNotReentered.has(mep.mep_id)) {
        const changeRecord: ChangeRecord = {
          mep_id: mep.mep_id,
          mep_name: mep.name,
          change_type: 'exit',
          detected_at: now,
        };

        const createResponse = await fetch(
          `${NOCODB_URL}/api/v2/tables/${NOCODB_CHANGES_TABLE_ID}/records`,
          {
            method: 'POST',
            headers: {
              'xc-token': NOCODB_TOKEN!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(changeRecord),
          }
        );

        if (createResponse.ok) {
          loggedChanges.push(changeRecord);

          // Update MEP status to inactive
          await fetch(
            `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records`,
            {
              method: 'PATCH',
              headers: {
                'xc-token': NOCODB_TOKEN!,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ Id: mep.Id, status: 'inactive' }),
            }
          );
        }
      }
    }

    const entries = loggedChanges.filter(c => c.change_type === 'entry');
    const exits = loggedChanges.filter(c => c.change_type === 'exit');

    return NextResponse.json({
      success: true,
      message: `Detected ${entries.length} entries and ${exits.length} exits`,
      changes: loggedChanges,
      stats: {
        totalMeps: meps.length,
        currentActiveMeps: currentMeps.length,
        detectedExits: exits.length,
        detectedEntries: entries.length,
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
export async function GET() {
  return POST();
}
