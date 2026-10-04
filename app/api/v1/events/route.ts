import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UNIVERSITY_OF_ABRA_VENUE } from '@/lib/mock-data';

const DEFAULT_EVENTS = [
  {
    id: '00000000-0000-4000-a000-000000000001',
    venue_id: UNIVERSITY_OF_ABRA_VENUE.id,
    title: 'University of Abra Intramurals 2026 Basketball Finals',
    description: 'The championship game between College of Engineering and College of Education at the Abra Arena.',
    event_date: '2026-10-15T18:00:00.000Z',
    status: 'UPCOMING',
  },
  {
    id: '00000000-0000-4000-a000-000000000002',
    venue_id: UNIVERSITY_OF_ABRA_VENUE.id,
    title: 'University Foundation Day Musical Gala',
    description: 'Annual cultural extravaganza showcasing university artists, bands, and choir performances.',
    event_date: '2026-10-25T19:30:00.000Z',
    status: 'UPCOMING',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { data: dbEvents, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (!error && dbEvents && dbEvents.length > 0) {
      // Deduplicate events by title so identical event cards are never displayed repeatedly
      const seenTitles = new Set<string>();
      const uniqueDbEvents = dbEvents.filter((evt) => {
        const normalized = (evt.title || '').trim().toLowerCase();
        if (seenTitles.has(normalized)) return false;
        seenTitles.add(normalized);
        return true;
      });

      const formattedEvents = uniqueDbEvents.map((evt) => ({
        id: evt.id,
        venueId: evt.venue_id || UNIVERSITY_OF_ABRA_VENUE.id,
        title: evt.title,
        description: evt.description,
        eventDate: evt.event_date,
        status: evt.status || 'UPCOMING',
        created_at: evt.created_at,
      }));

      return NextResponse.json({
        venue: UNIVERSITY_OF_ABRA_VENUE,
        events: formattedEvents,
      });
    }

    // Seed default events if table is empty
    await supabaseAdmin.from('events').upsert(DEFAULT_EVENTS);

    const { data: seededEvents } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (seededEvents && seededEvents.length > 0) {
      const seenTitles = new Set<string>();
      const uniqueSeeded = seededEvents.filter((evt) => {
        const normalized = (evt.title || '').trim().toLowerCase();
        if (seenTitles.has(normalized)) return false;
        seenTitles.add(normalized);
        return true;
      });

      return NextResponse.json({
        venue: UNIVERSITY_OF_ABRA_VENUE,
        events: uniqueSeeded.map((evt) => ({
          id: evt.id,
          venueId: evt.venue_id || UNIVERSITY_OF_ABRA_VENUE.id,
          title: evt.title,
          description: evt.description,
          eventDate: evt.event_date,
          status: evt.status || 'UPCOMING',
          created_at: evt.created_at,
        })),
      });
    }
  } catch (err: any) {
    console.error('Database query note for events:', err);
  }

  return NextResponse.json({
    venue: UNIVERSITY_OF_ABRA_VENUE,
    events: DEFAULT_EVENTS.map((evt) => ({
      id: evt.id,
      venueId: evt.venue_id,
      title: evt.title,
      description: evt.description,
      eventDate: evt.event_date,
      status: evt.status,
    })),
  });
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role') || 'USER';
  if (role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden: Admin privileges required to manage events' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, description, eventDate } = body;

    if (!title || !eventDate) {
      return NextResponse.json(
        { error: 'Title and eventDate are required' },
        { status: 400 }
      );
    }

    // Check if an event with the same title already exists in Supabase
    const { data: existingEvents } = await supabaseAdmin
      .from('events')
      .select('*')
      .ilike('title', title.trim())
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      const existing = existingEvents[0];
      return NextResponse.json({
        success: true,
        event: {
          id: existing.id,
          venueId: existing.venue_id,
          title: existing.title,
          description: existing.description,
          eventDate: existing.event_date,
          status: existing.status,
        },
      });
    }

    const eventId = crypto.randomUUID();
    const newEvent = {
      id: eventId,
      venue_id: UNIVERSITY_OF_ABRA_VENUE.id,
      title,
      description: description || 'Official event at University of Abra Arena.',
      event_date: eventDate,
      status: 'UPCOMING',
    };

    const { error } = await supabaseAdmin
      .from('events')
      .insert([newEvent]);

    if (error) {
      console.warn('Supabase event insert note:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      event: {
        id: newEvent.id,
        venueId: newEvent.venue_id,
        title: newEvent.title,
        description: newEvent.description,
        eventDate: newEvent.event_date,
        status: newEvent.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
