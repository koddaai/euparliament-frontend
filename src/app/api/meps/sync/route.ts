import { NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;

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

interface ExistingMEP {
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
}

/**
 * Sync MEPs endpoint - handles upserts to prevent duplicates
 *
 * This endpoint receives scraped MEP data and:
 * 1. Updates existing MEPs (matched by mep_id)
 * 2. Inserts new MEPs that don't exist
 *
 * Use this endpoint from n8n instead of directly inserting into NocoDB
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support both array directly and { meps: [...] } format
    const scrapedMeps: ScrapedMEP[] = Array.isArray(body) ? body : (body.meps || []);

    if (scrapedMeps.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No MEPs provided',
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Fetch all existing MEPs from database
    const mepsUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?limit=1000`;
    const existingResponse = await fetch(mepsUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
    });

    if (!existingResponse.ok) {
      throw new Error(`Failed to fetch existing MEPs: ${existingResponse.status}`);
    }

    const existingData = await existingResponse.json();
    const existingMeps: ExistingMEP[] = existingData.list || [];

    // Create lookup map by mep_id
    const existingByMepId = new Map<string, ExistingMEP>();
    existingMeps.forEach(mep => existingByMepId.set(mep.mep_id, mep));

    // Separate MEPs into updates and inserts
    const toUpdate: Array<{ Id: number } & Partial<ScrapedMEP> & { status: string; last_updated: string }> = [];
    const toInsert: Array<ScrapedMEP & { status: string; last_updated: string }> = [];

    for (const scraped of scrapedMeps) {
      const existing = existingByMepId.get(scraped.mep_id);

      if (existing) {
        // MEP exists - update it
        toUpdate.push({
          Id: existing.Id,
          name: scraped.name,
          country: scraped.country,
          national_party: scraped.national_party,
          political_group: scraped.political_group,
          political_group_short: scraped.political_group_short,
          photo_url: scraped.photo_url,
          profile_url: scraped.profile_url,
          status: 'active',
          last_updated: now,
        });
      } else {
        // New MEP - insert it
        toInsert.push({
          ...scraped,
          status: 'active',
          last_updated: now,
        });
      }
    }

    // Execute batch operations
    let updatedCount = 0;
    let insertedCount = 0;

    // Batch update existing MEPs
    if (toUpdate.length > 0) {
      const updateResponse = await fetch(
        `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records`,
        {
          method: 'PATCH',
          headers: {
            'xc-token': NOCODB_TOKEN!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(toUpdate),
        }
      );
      if (updateResponse.ok) {
        updatedCount = toUpdate.length;
      }
    }

    // Batch insert new MEPs
    if (toInsert.length > 0) {
      const insertResponse = await fetch(
        `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records`,
        {
          method: 'POST',
          headers: {
            'xc-token': NOCODB_TOKEN!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(toInsert),
        }
      );
      if (insertResponse.ok) {
        insertedCount = toInsert.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${scrapedMeps.length} MEPs: ${updatedCount} updated, ${insertedCount} inserted`,
      stats: {
        received: scrapedMeps.length,
        updated: updatedCount,
        inserted: insertedCount,
        existingInDb: existingMeps.length,
      },
    });

  } catch (error) {
    console.error('Error syncing MEPs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync MEPs', details: String(error) },
      { status: 500 }
    );
  }
}
