import { NextResponse } from 'next/server';

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

function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<meps exported="${new Date().toISOString()}" total="${meps.length}">
${meps.map(mep => `  <mep>
    <id>${escapeXml(mep.mep_id)}</id>
    <name>${escapeXml(mep.name)}</name>
    <country>${escapeXml(mep.country)}</country>
    <national_party>${escapeXml(mep.national_party)}</national_party>
    <political_group>${escapeXml(mep.political_group)}</political_group>
    <political_group_short>${escapeXml(mep.political_group_short)}</political_group_short>
    <photo_url>${escapeXml(mep.photo_url)}</photo_url>
    <profile_url>${escapeXml(mep.profile_url)}</profile_url>
    <status>${escapeXml(mep.status)}</status>
    <last_updated>${escapeXml(mep.last_updated)}</last_updated>
  </mep>`).join('\n')}
</meps>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="meps_${new Date().toISOString().split('T')[0]}.xml"`,
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
