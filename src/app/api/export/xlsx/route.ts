import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;

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

// Map country names to Spanish (to match the reference file format)
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
  // Names are typically in format "FirstName LASTNAME" or "FirstName MiddleName LASTNAME"
  // We need to separate them into Apellido (surname) and Nombre (first name)
  const parts = fullName.trim().split(' ');

  if (parts.length === 1) {
    return { apellido: parts[0], nombre: '' };
  }

  // Find uppercase words (likely surnames)
  const uppercaseIndices: number[] = [];
  parts.forEach((part, index) => {
    if (part === part.toUpperCase() && part.length > 1) {
      uppercaseIndices.push(index);
    }
  });

  if (uppercaseIndices.length > 0) {
    // Surnames are the uppercase parts
    const apellido = uppercaseIndices.map(i => parts[i]).join(' ');
    const nombre = parts.filter((_, i) => !uppercaseIndices.includes(i)).join(' ');
    return { apellido, nombre };
  }

  // Fallback: last word is surname
  const apellido = parts[parts.length - 1];
  const nombre = parts.slice(0, -1).join(' ');
  return { apellido, nombre };
}

export async function GET() {
  try {
    // Get all active MEPs
    const url = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?where=(status,eq,active)&limit=1000&sort=name`;

    const response = await fetch(url, {
      headers: {
        'xc-token': NOCODB_TOKEN!,
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch MEPs');
    }

    const data = await response.json();
    const meps: MEP[] = data.list || [];

    // Sort by political group, then by surname
    const sortedMeps = meps.sort((a, b) => {
      const groupCompare = a.political_group_short.localeCompare(b.political_group_short);
      if (groupCompare !== 0) return groupCompare;
      const { apellido: aApellido } = splitName(a.name);
      const { apellido: bApellido } = splitName(b.name);
      return aApellido.localeCompare(bApellido);
    });

    // Create worksheet data
    const wsData: (string | null)[][] = [];

    // Header row 1 (title row)
    wsData.push([null, null, 'Pos. Gal.\nMS-UE', null, null]);

    // Header row 2 (column names)
    wsData.push(['Apellido', 'Nombre', null, 'Grupo', 'País']);

    // Data rows
    sortedMeps.forEach(mep => {
      const { apellido, nombre } = splitName(mep.name);
      const pais = COUNTRY_MAP[mep.country] || mep.country;

      // Position indicator: we don't have this data, use (-)
      const posicion = '(-)';

      wsData.push([
        apellido,
        nombre,
        posicion,
        mep.political_group_short,
        pais
      ]);
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Apellido
      { wch: 20 }, // Nombre
      { wch: 12 }, // Pos. Gal.
      { wch: 12 }, // Grupo
      { wch: 15 }, // País
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'MEPs');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="MEPs_European_Parliament_${new Date().toISOString().split('T')[0]}.xlsx"`,
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
