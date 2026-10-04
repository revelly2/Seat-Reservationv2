import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateInitialSeats, UNIVERSITY_OF_ABRA_VENUE, uuidToSeat } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  try {
    // 1. Generate venue base seats layout
    const baseSeats = generateInitialSeats();

    // 2. Fetch reservations booked for this specific event only
    const { data: dbReservations, error } = await supabaseAdmin
      .from('reservations')
      .select('seat_ids, status')
      .eq('event_id', eventId)
      .in('status', ['CONFIRMED', 'PENDING']);

    const bookedSeatIds = new Set<string>();

    if (!error && dbReservations) {
      for (const res of dbReservations) {
        if (Array.isArray(res.seat_ids)) {
          for (const rawId of res.seat_ids) {
            // Can be in UUID format or seat-X-Y format
            const seatKey = uuidToSeat(rawId);
            bookedSeatIds.add(seatKey);
            bookedSeatIds.add(rawId);
          }
        }
      }
    }

    // 3. Mark only seats belonging to this specific event as BOOKED
    const eventSeats = baseSeats.map((s) => ({
      ...s,
      status: bookedSeatIds.has(s.id) ? ('BOOKED' as const) : ('AVAILABLE' as const),
    }));

    return NextResponse.json({
      eventId,
      venue: UNIVERSITY_OF_ABRA_VENUE,
      seats: eventSeats,
    });
  } catch (err) {
    console.error('Seats fetch error from Supabase:', err);
    return NextResponse.json({
      eventId,
      venue: UNIVERSITY_OF_ABRA_VENUE,
      seats: generateInitialSeats(),
    });
  }
}
