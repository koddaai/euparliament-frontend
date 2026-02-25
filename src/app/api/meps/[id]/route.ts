import { NextRequest, NextResponse } from 'next/server';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
const NOCODB_MEPS_TABLE_ID = process.env.NOCODB_MEPS_TABLE_ID;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mepId } = await params;

  try {
    const mepUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_MEPS_TABLE_ID}/records?where=(mep_id,eq,${mepId})`;
    const mepResponse = await fetch(mepUrl, {
      headers: { 'xc-token': NOCODB_TOKEN! },
      next: { revalidate: 300 }
    });

    if (!mepResponse.ok) {
      throw new Error('Failed to fetch MEP');
    }

    const mepData = await mepResponse.json();

    if (!mepData.list || mepData.list.length === 0) {
      return NextResponse.json({ error: 'MEP not found' }, { status: 404 });
    }

    const mep = mepData.list[0];

    return NextResponse.json(mep);

  } catch (error) {
    console.error('Error fetching MEP:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MEP' },
      { status: 500 }
    );
  }
}
