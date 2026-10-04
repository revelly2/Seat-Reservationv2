import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      event: {
        id: event.id,
        venueId: event.venue_id,
        title: event.title,
        description: event.description,
        eventDate: event.event_date,
        status: event.status || 'UPCOMING',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role') || 'USER';
  if (role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden: Admin privileges required to edit events' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, eventDate, status } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (eventDate !== undefined) updates.event_date = eventDate;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      event: {
        id: data.id,
        venueId: data.venue_id,
        title: data.title,
        description: data.description,
        eventDate: data.event_date,
        status: data.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role') || 'USER';
  if (role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden: Admin privileges required to delete events' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    // Delete associated reservations if any exist for this event
    await supabaseAdmin
      .from('reservations')
      .delete()
      .eq('event_id', id);

    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
