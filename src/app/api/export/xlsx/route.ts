import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

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
  status: string;
  last_updated: string;
}

interface Change {
  mep_id: string;
  mep_name?: string;
  change_type: 'joined' | 'left' | 'group_change' | 'party_change';
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
}

function splitName(fullName: string): { lastName: string; firstName: string } {
  const parts = fullName.trim().split(' ');

  if (parts.length === 1) {
    return { lastName: parts[0], firstName: '' };
  }

  const uppercaseIndices: number[] = [];
  parts.forEach((part, index) => {
    if (part === part.toUpperCase() && part.length > 1) {
      uppercaseIndices.push(index);
    }
  });

  if (uppercaseIndices.length > 0) {
    const lastName = uppercaseIndices.map(i => parts[i]).join(' ');
    const firstName = parts.filter((_, i) => !uppercaseIndices.includes(i)).join(' ');
    return { lastName, firstName };
  }

  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(' ');
  return { lastName, firstName };
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Apply header styling to a worksheet
function applyHeaderStyle(ws: XLSX.WorkSheet, headerRow: number, numCols: number): void {
  for (let col = 0; col < numCols; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '003399' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
  }
}

export async function GET() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Start of current month
    const monthStart = new Date(currentYear, currentMonth, 1).toISOString();
    // Start of current year
    const yearStart = new Date(currentYear, 0, 1).toISOString();

    // Fetch all MEPs (active and left)
    const mepsUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?limit=1000&sort=name`;
    const mepsResponse = await fetch(mepsUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
      next: { revalidate: 300 }
    });

    if (!mepsResponse.ok) {
      throw new Error('Failed to fetch MEPs');
    }

    const mepsData = await mepsResponse.json();
    const allMeps: MEP[] = mepsData.list || [];
    const activeMeps = allMeps.filter(m => m.status === 'active');

    // Create a map for quick lookup
    const mepMap = new Map<string, MEP>();
    allMeps.forEach(mep => mepMap.set(mep.mep_id, mep));

    // Fetch all changes from this year
    const changesUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_CHANGES_TABLE_ID}/records?where=(detected_at,gte,${yearStart})&limit=1000&sort=-detected_at`;
    const changesResponse = await fetch(changesUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
      next: { revalidate: 300 }
    });

    let changes: Change[] = [];
    if (changesResponse.ok) {
      const changesData = await changesResponse.json();
      changes = changesData.list || [];
    }

    // Separate changes by type
    const joinedThisYear = changes.filter(c => c.change_type === 'joined');
    const leftThisYear = changes.filter(c => c.change_type === 'left');
    const groupChangesThisYear = changes.filter(c => c.change_type === 'group_change');

    // Changes this month (for +/- indicator)
    const joinedThisMonth = new Set(
      changes
        .filter(c => c.change_type === 'joined' && new Date(c.detected_at) >= new Date(monthStart))
        .map(c => c.mep_id)
    );
    const leftThisMonth = new Set(
      changes
        .filter(c => c.change_type === 'left' && new Date(c.detected_at) >= new Date(monthStart))
        .map(c => c.mep_id)
    );

    // ========== SHEET 1: All MEPs ==========
    const sortedMeps = activeMeps.sort((a, b) => {
      const groupCompare = a.political_group_short.localeCompare(b.political_group_short);
      if (groupCompare !== 0) return groupCompare;
      const { lastName: aLastName } = splitName(a.name);
      const { lastName: bLastName } = splitName(b.name);
      return aLastName.localeCompare(bLastName);
    });

    const wsMainData: (string | number | null)[][] = [];
    // Title row
    wsMainData.push(['European Parliament - Members List', null, null, null, null, null]);
    wsMainData.push([`Generated: ${formatDate(now.toISOString())}`, null, null, null, `Total: ${activeMeps.length} MEPs`, null]);
    wsMainData.push([]); // Empty row
    // Header row
    wsMainData.push(['Last Name', 'First Name', 'Status', 'Group', 'Country', 'National Party']);

    sortedMeps.forEach(mep => {
      const { lastName, firstName } = splitName(mep.name);

      // Determine status indicator based on this month's changes
      let status = '-'; // Default: no change
      if (joinedThisMonth.has(mep.mep_id)) {
        status = 'NEW';
      } else if (leftThisMonth.has(mep.mep_id)) {
        status = 'LEFT';
      }

      wsMainData.push([lastName, firstName, status, mep.political_group_short, mep.country, mep.national_party]);
    });

    // ========== SHEET 2: New Members ==========
    const wsJoinedData: (string | null)[][] = [];
    wsJoinedData.push([`New Members - ${currentYear}`, null, null, null, null]);
    wsJoinedData.push([]); // Empty row
    wsJoinedData.push(['Last Name', 'First Name', 'Group', 'Country', 'Date Joined']);

    joinedThisYear.forEach(change => {
      const mep = mepMap.get(change.mep_id);
      if (mep) {
        const { lastName, firstName } = splitName(mep.name);
        wsJoinedData.push([
          lastName,
          firstName,
          mep.political_group_short,
          mep.country,
          formatDate(change.detected_at)
        ]);
      }
    });

    if (wsJoinedData.length === 3) {
      wsJoinedData.push(['No new members recorded this year', null, null, null, null]);
    }

    // ========== SHEET 3: Departures ==========
    const wsDepartedData: (string | null)[][] = [];
    wsDepartedData.push([`Departures - ${currentYear}`, null, null, null, null]);
    wsDepartedData.push([]); // Empty row
    wsDepartedData.push(['Last Name', 'First Name', 'Last Group', 'Country', 'Date Left']);

    leftThisYear.forEach(change => {
      const mep = mepMap.get(change.mep_id);
      if (mep) {
        const { lastName, firstName } = splitName(mep.name);
        wsDepartedData.push([
          lastName,
          firstName,
          mep.political_group_short,
          mep.country,
          formatDate(change.detected_at)
        ]);
      }
    });

    if (wsDepartedData.length === 3) {
      wsDepartedData.push(['No departures recorded this year', null, null, null, null]);
    }

    // ========== SHEET 4: Group Changes ==========
    const wsChangesData: (string | null)[][] = [];
    wsChangesData.push([`Group Changes - ${currentYear}`, null, null, null, null, null]);
    wsChangesData.push([]); // Empty row
    wsChangesData.push(['Last Name', 'First Name', 'Previous Group', 'New Group', 'Country', 'Date']);

    groupChangesThisYear.forEach(change => {
      const mep = mepMap.get(change.mep_id);
      if (mep) {
        const { lastName, firstName } = splitName(mep.name);
        wsChangesData.push([
          lastName,
          firstName,
          change.old_value || '',
          change.new_value || '',
          mep.country,
          formatDate(change.detected_at)
        ]);
      }
    });

    if (wsChangesData.length === 3) {
      wsChangesData.push(['No group changes recorded this year', null, null, null, null, null]);
    }

    // ========== CREATE WORKBOOK ==========
    const wb = XLSX.utils.book_new();

    // Sheet 1: MEPs (main)
    const wsMain = XLSX.utils.aoa_to_sheet(wsMainData);
    wsMain['!cols'] = [
      { wch: 22 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 16 }, { wch: 30 }
    ];
    // Merge title cells
    wsMain['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Title
    ];
    XLSX.utils.book_append_sheet(wb, wsMain, 'All MEPs');

    // Sheet 2: New Members
    const wsJoined = XLSX.utils.aoa_to_sheet(wsJoinedData);
    wsJoined['!cols'] = [
      { wch: 22 }, { wch: 18 }, { wch: 10 }, { wch: 16 }, { wch: 14 }
    ];
    wsJoined['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsJoined, `New Members ${currentYear}`);

    // Sheet 3: Departures
    const wsDeparted = XLSX.utils.aoa_to_sheet(wsDepartedData);
    wsDeparted['!cols'] = [
      { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 14 }
    ];
    wsDeparted['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsDeparted, `Departures ${currentYear}`);

    // Sheet 4: Group Changes
    const wsChanges = XLSX.utils.aoa_to_sheet(wsChangesData);
    wsChanges['!cols'] = [
      { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }
    ];
    wsChanges['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsChanges, `Group Changes ${currentYear}`);

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="European_Parliament_MEPs_${now.toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error exporting MEPs:', error);
    return NextResponse.json(
      { error: 'Failed to export MEPs' },
      { status: 500 }
    );
  }
}
