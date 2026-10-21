import { NextRequest, NextResponse } from 'next/server';
import { UNIVERSITY_OF_ABRA_VENUE, ARENA_SECTIONS } from '@/lib/mock-data';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Section, Venue } from '@/types/seat-reservation';

// Block prices live in Supabase `sections`; fall back to the plan defaults if a row is missing.
async function loadVenue(): Promise<Venue> {
  const [{ data: venueRow }, { data: rows }] = await Promise.all([
    supabaseAdmin.from('venues').select('name').eq('id', UNIVERSITY_OF_ABRA_VENUE.id).maybeSingle(),
    supabaseAdmin.from('sections').select('id, base_price').eq('venue_id', UNIVERSITY_OF_ABRA_VENUE.id),
  ]);
  const sections: Section[] = ARENA_SECTIONS.map((s) => {
    const row = (rows || []).find((r) => r.id === s.id);
    return row ? { ...s, basePrice: Number(row.base_price) } : s;
  });
  return {
    ...UNIVERSITY_OF_ABRA_VENUE,
    name: venueRow?.name || UNIVERSITY_OF_ABRA_VENUE.name,
    layoutConfig: { ...UNIVERSITY_OF_ABRA_VENUE.layoutConfig, sections },
  };
}

export async function GET() {
  return NextResponse.json({ venue: await loadVenue() });
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role') || 'USER';
  if (role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden: Admin privileges required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, sections } = body as { name?: string; sections?: Section[] };

    if (!name || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Invalid venue payload' }, { status: 400 });
    }
    const known = new Set(ARENA_SECTIONS.map((s) => s.id));
    const invalid = sections.find((s) => !known.has(s.id) || !(Number(s.basePrice) >= 0));
    if (invalid) {
      return NextResponse.json({ error: `Invalid price for section ${invalid.name || invalid.id}` }, { status: 400 });
    }

    const results = await Promise.all([
      supabaseAdmin.from('venues').update({ name }).eq('id', UNIVERSITY_OF_ABRA_VENUE.id),
      ...sections.map((s) =>
        supabaseAdmin.from('sections').update({ base_price: Number(s.basePrice) }).eq('id', s.id).select('id')
      ),
    ]);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      return NextResponse.json({ error: `Could not save venue: ${failed.error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, venue: await loadVenue() });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
