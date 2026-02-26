import { NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;

interface MEP {
  Id: number;
  mep_id: string;
  name: string;
}

/**
 * Cleanup duplicate MEPs - keeps the one with highest Id for each mep_id
 */
export async function POST() {
  try {
    // Fetch ALL MEPs from database (with pagination)
    const allMeps: MEP[] = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?limit=${pageSize}&offset=${offset}`;
      const response = await fetch(url, {
        headers: { 'xc-token': NOCODB_TOKEN! },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch MEPs: ${response.status}`);
      }

      const data = await response.json();
      const batch: MEP[] = data.list || [];
      allMeps.push(...batch);

      if (batch.length < pageSize) {
        break;
      }
      offset += pageSize;
    }

    // Group MEPs by mep_id
    const mepsByMepId = new Map<string, MEP[]>();
    for (const mep of allMeps) {
      const existing = mepsByMepId.get(mep.mep_id) || [];
      existing.push(mep);
      mepsByMepId.set(mep.mep_id, existing);
    }

    // Find duplicates and collect IDs to delete
    const idsToDelete: number[] = [];
    let duplicateGroups = 0;

    for (const [mepId, meps] of mepsByMepId) {
      if (meps.length > 1) {
        duplicateGroups++;
        // Sort by Id descending, keep the highest, delete the rest
        meps.sort((a, b) => b.Id - a.Id);
        const toDelete = meps.slice(1); // All except the first (highest Id)
        idsToDelete.push(...toDelete.map(m => m.Id));
      }
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No duplicates found',
        stats: {
          totalMeps: allMeps.length,
          uniqueMepIds: mepsByMepId.size,
          duplicatesDeleted: 0,
        },
      });
    }

    // Delete duplicates in batches of 100
    let deletedCount = 0;
    const batchSize = 100;

    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      const deletePayload = batch.map(id => ({ Id: id }));

      const deleteResponse = await fetch(
        `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records`,
        {
          method: 'DELETE',
          headers: {
            'xc-token': NOCODB_TOKEN!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(deletePayload),
        }
      );

      if (deleteResponse.ok) {
        deletedCount += batch.length;
      } else {
        console.error('Failed to delete batch:', await deleteResponse.text());
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} duplicate MEPs`,
      stats: {
        totalMepsBefore: allMeps.length,
        uniqueMepIds: mepsByMepId.size,
        duplicateGroups,
        duplicatesDeleted: deletedCount,
        totalMepsAfter: allMeps.length - deletedCount,
      },
    });

  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup duplicates', details: String(error) },
      { status: 500 }
    );
  }
}

// GET for easy testing
export async function GET() {
  return POST();
}
