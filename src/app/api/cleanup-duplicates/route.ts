import { NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;

interface MEP {
  Id: number;
  mep_id: string;
  CreatedAt: string;
}

export async function POST() {
  try {
    // Get all MEPs with pagination
    const allMeps: MEP[] = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const mepsUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?limit=${pageSize}&offset=${offset}&sort=Id`;
      const mepsResponse = await fetch(mepsUrl, {
        headers: { 'xc-token': NOCODB_TOKEN! },
        cache: 'no-store',
      });

      if (!mepsResponse.ok) {
        const errorText = await mepsResponse.text();
        throw new Error(`Failed to fetch MEPs: ${mepsResponse.status} - ${errorText}`);
      }

      const mepsData = await mepsResponse.json();
      const pageMeps: MEP[] = mepsData.list || [];

      if (pageMeps.length === 0) {
        break;
      }

      allMeps.push(...pageMeps);
      offset += pageSize;

      // Safety check to prevent infinite loop
      if (offset > 10000) break;
    }

    const meps = allMeps;

    // Group by mep_id and find duplicates (keep lowest Id)
    const mepIdMap = new Map<string, MEP[]>();
    meps.forEach(mep => {
      const existing = mepIdMap.get(mep.mep_id) || [];
      existing.push(mep);
      mepIdMap.set(mep.mep_id, existing);
    });

    // Find IDs to delete (all except the one with lowest Id)
    const idsToDelete: number[] = [];
    mepIdMap.forEach((mepList) => {
      if (mepList.length > 1) {
        // Sort by Id ascending
        mepList.sort((a, b) => a.Id - b.Id);
        // Keep first (lowest Id), delete the rest
        for (let i = 1; i < mepList.length; i++) {
          idsToDelete.push(mepList[i].Id);
        }
      }
    });

    if (idsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No duplicates found',
        deletedCount: 0,
      });
    }

    // Delete duplicates in batches
    const batchSize = 100;
    let deletedCount = 0;

    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);

      const deleteResponse = await fetch(
        `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records`,
        {
          method: 'DELETE',
          headers: {
            'xc-token': NOCODB_TOKEN!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch.map(id => ({ Id: id }))),
        }
      );

      if (deleteResponse.ok) {
        deletedCount += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} duplicate MEPs`,
      deletedCount,
      totalMepsBeforeCleanup: meps.length,
      totalMepsAfterCleanup: meps.length - deletedCount,
    });

  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup duplicates', details: String(error) },
      { status: 500 }
    );
  }
}

// GET for easy testing
export async function GET() {
  return POST();
}
