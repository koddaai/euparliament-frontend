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
  change_type: 'joined' | 'left' | 'group_change' | 'party_change';
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
}

// Map country names to Spanish
const COUNTRY_MAP: Record<string, string> = {
  'Germany': 'Alemania',
  'France': 'Francia',
  'Italy': 'Italia',
  'Spain': 'España',
  'Poland': 'Polonia',
  'Romania': 'Rumanía',
  'Netherlands': 'Países Bajos',
  'Belgium': 'Bélgica',
  'Greece': 'Grecia',
  'Czechia': 'Chequia',
  'Portugal': 'Portugal',
  'Hungary': 'Hungría',
  'Sweden': 'Suecia',
  'Austria': 'Austria',
  'Bulgaria': 'Bulgaria',
  'Denmark': 'Dinamarca',
  'Finland': 'Finlandia',
  'Slovakia': 'Eslovaquia',
  'Ireland': 'Irlanda',
  'Croatia': 'Croacia',
  'Lithuania': 'Lituania',
  'Slovenia': 'Eslovenia',
  'Latvia': 'Letonia',
  'Estonia': 'Estonia',
  'Cyprus': 'Chipre',
  'Luxembourg': 'Luxemburgo',
  'Malta': 'Malta',
};

function splitName(fullName: string): { apellido: string; nombre: string } {
  const parts = fullName.trim().split(' ');

  if (parts.length === 1) {
    return { apellido: parts[0], nombre: '' };
  }

  const uppercaseIndices: number[] = [];
  parts.forEach((part, index) => {
    if (part === part.toUpperCase() && part.length > 1) {
      uppercaseIndices.push(index);
    }
  });

  if (uppercaseIndices.length > 0) {
    const apellido = uppercaseIndices.map(i => parts[i]).join(' ');
    const nombre = parts.filter((_, i) => !uppercaseIndices.includes(i)).join(' ');
    return { apellido, nombre };
  }

  const apellido = parts[parts.length - 1];
  const nombre = parts.slice(0, -1).join(' ');
  return { apellido, nombre };
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

    // ========== ABA 1: MEPs (Consolidado) ==========
    const sortedMeps = activeMeps.sort((a, b) => {
      const groupCompare = a.political_group_short.localeCompare(b.political_group_short);
      if (groupCompare !== 0) return groupCompare;
      const { apellido: aApellido } = splitName(a.name);
      const { apellido: bApellido } = splitName(b.name);
      return aApellido.localeCompare(bApellido);
    });

    const wsMainData: (string | null)[][] = [];
    wsMainData.push([null, null, 'Pos. Gal.\nMS-UE', null, null]);
    wsMainData.push(['Apellido', 'Nombre', null, 'Grupo', 'País']);

    sortedMeps.forEach(mep => {
      const { apellido, nombre } = splitName(mep.name);
      const pais = COUNTRY_MAP[mep.country] || mep.country;

      // Determine position indicator based on this month's changes
      let posicion = '0'; // Default: no change
      if (joinedThisMonth.has(mep.mep_id)) {
        posicion = '(+)'; // Joined this month
      } else if (leftThisMonth.has(mep.mep_id)) {
        posicion = '(-)'; // Left this month (shouldn't appear in active list, but just in case)
      }

      wsMainData.push([apellido, nombre, posicion, mep.political_group_short, pais]);
    });

    // ========== ABA 2: Entradas 2026 ==========
    const wsEntradasData: (string | null)[][] = [];
    wsEntradasData.push(['Apellido', 'Nombre', 'Grupo', 'País', 'Fecha de Entrada']);

    joinedThisYear.forEach(change => {
      const mep = mepMap.get(change.mep_id);
      if (mep) {
        const { apellido, nombre } = splitName(mep.name);
        const pais = COUNTRY_MAP[mep.country] || mep.country;
        wsEntradasData.push([
          apellido,
          nombre,
          mep.political_group_short,
          pais,
          formatDate(change.detected_at)
        ]);
      }
    });

    if (wsEntradasData.length === 1) {
      wsEntradasData.push(['No hay entradas registradas este año', null, null, null, null]);
    }

    // ========== ABA 3: Saídas 2026 ==========
    const wsSalidasData: (string | null)[][] = [];
    wsSalidasData.push(['Apellido', 'Nombre', 'Último Grupo', 'País', 'Fecha de Salida']);

    leftThisYear.forEach(change => {
      const mep = mepMap.get(change.mep_id);
      if (mep) {
        const { apellido, nombre } = splitName(mep.name);
        const pais = COUNTRY_MAP[mep.country] || mep.country;
        wsSalidasData.push([
          apellido,
          nombre,
          mep.political_group_short,
          pais,
          formatDate(change.detected_at)
        ]);
      }
    });

    if (wsSalidasData.length === 1) {
      wsSalidasData.push(['No hay salidas registradas este año', null, null, null, null]);
    }

    // ========== ABA 4: Cambios de Grupo ==========
    const wsCambiosData: (string | null)[][] = [];
    wsCambiosData.push(['Apellido', 'Nombre', 'Grupo Anterior', 'Grupo Nuevo', 'País', 'Fecha']);

    groupChangesThisYear.forEach(change => {
      const mep = mepMap.get(change.mep_id);
      if (mep) {
        const { apellido, nombre } = splitName(mep.name);
        const pais = COUNTRY_MAP[mep.country] || mep.country;
        wsCambiosData.push([
          apellido,
          nombre,
          change.old_value || '',
          change.new_value || '',
          pais,
          formatDate(change.detected_at)
        ]);
      }
    });

    if (wsCambiosData.length === 1) {
      wsCambiosData.push(['No hay cambios de grupo registrados este año', null, null, null, null, null]);
    }

    // ========== CREATE WORKBOOK ==========
    const wb = XLSX.utils.book_new();

    // Sheet 1: MEPs (main)
    const wsMain = XLSX.utils.aoa_to_sheet(wsMainData);
    wsMain['!cols'] = [
      { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsMain, 'MEPs');

    // Sheet 2: Entradas
    const wsEntradas = XLSX.utils.aoa_to_sheet(wsEntradasData);
    wsEntradas['!cols'] = [
      { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsEntradas, `Entradas ${currentYear}`);

    // Sheet 3: Salidas
    const wsSalidas = XLSX.utils.aoa_to_sheet(wsSalidasData);
    wsSalidas['!cols'] = [
      { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSalidas, `Salidas ${currentYear}`);

    // Sheet 4: Cambios de Grupo
    const wsCambios = XLSX.utils.aoa_to_sheet(wsCambiosData);
    wsCambios['!cols'] = [
      { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsCambios, `Cambios Grupo ${currentYear}`);

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="MEPs_European_Parliament_${now.toISOString().split('T')[0]}.xlsx"`,
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
