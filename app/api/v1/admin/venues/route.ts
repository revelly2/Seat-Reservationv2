import { NextRequest, NextResponse } from 'next/server';
import { UNIVERSITY_OF_ABRA_VENUE } from '@/lib/mock-data';
import { Venue } from '@/types/seat-reservation';

let currentVenue: Venue = { ...UNIVERSITY_OF_ABRA_VENUE };

export async function GET(request: NextRequest) {
  return NextResponse.json({
    venue: currentVenue,
  });
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
    const { name, rows, columns, sections } = body;

    if (!name || !sections) {
      return NextResponse.json(
        { error: 'Invalid venue payload' },
        { status: 400 }
      );
    }

    currentVenue = {
      ...currentVenue,
      name: name || currentVenue.name,
      totalCapacity: (rows || currentVenue.layoutConfig.rows) * (columns || currentVenue.layoutConfig.columns),
      layoutConfig: {
        rows: rows || currentVenue.layoutConfig.rows,
        columns: columns || currentVenue.layoutConfig.columns,
        sections: sections || currentVenue.layoutConfig.sections,
      },
    };

    return NextResponse.json({
      success: true,
      venue: currentVenue,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
