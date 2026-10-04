import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Reservation } from '@/types/seat-reservation';
import { seatToUUID, uuidToSeat } from '@/lib/mock-data';
import { createHash } from 'crypto';

function emailToUUID(email: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(email)) {
    return email;
  }
  const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      seatIds,
      totalAmount,
      userId = 'user-current-session',
      eventId = '00000000-0000-4000-a000-000000000001',
      paymentStatus = 'PAID_STRIPE',
    } = body;

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: 'seatIds array is required' },
        { status: 400 }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const reservationId = crypto.randomUUID();
    const validUserId = emailToUUID(userId);
    const validEventId = uuidRegex.test(eventId) ? eventId : '00000000-0000-4000-a000-000000000001';
    const validSeatIds = seatIds.map((s: string) => seatToUUID(s));

    const newReservation: Reservation = {
      id: reservationId,
      userId,
      userEmail: userId.includes('@') ? userId : undefined,
      eventId: validEventId,
      seatIds,
      totalAmount: totalAmount || 150.0,
      status: 'CONFIRMED',
      paymentStatus: paymentStatus,
      checkInStatus: 'PENDING',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };

    // Check if user already has an active reservation for this specific event
    const { data: existingRes } = await supabaseAdmin
      .from('reservations')
      .select('id, seat_ids, total_amount')
      .eq('user_id', validUserId)
      .eq('event_id', validEventId)
      .in('status', ['CONFIRMED', 'PENDING'])
      .maybeSingle();

    if (existingRes) {
      // Merge seat IDs and update reservation
      const combinedSeats = Array.from(new Set([...(existingRes.seat_ids || []), ...validSeatIds]));
      const newTotal = (existingRes.total_amount || 0) + (totalAmount || 150.0);
      await supabaseAdmin
        .from('reservations')
        .update({
          seat_ids: combinedSeats,
          total_amount: newTotal,
          payment_status: paymentStatus,
        })
        .eq('id', existingRes.id);

      return NextResponse.json({
        success: true,
        reservation: {
          ...newReservation,
          id: existingRes.id,
          seatIds: combinedSeats,
          totalAmount: newTotal,
        },
        receiptUrl: `/api/v1/reservations/${existingRes.id}`,
      });
    }

    // Insert live reservation into Supabase database for this specific event
    const { error: dbErr } = await supabaseAdmin.from('reservations').insert([
      {
        id: reservationId,
        user_id: validUserId,
        event_id: validEventId,
        seat_ids: validSeatIds,
        total_amount: newReservation.totalAmount,
        status: newReservation.status,
        payment_status: newReservation.paymentStatus,
        check_in_status: newReservation.checkInStatus,
        expires_at: newReservation.expiresAt.toISOString(),
      },
    ]);

    if (dbErr) {
      console.warn('Supabase reservations insert note:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      reservation: newReservation,
      receiptUrl: `/api/v1/reservations/${reservationId}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const userId = searchParams.get('userId');

    let query = supabaseAdmin
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    if (userId) {
      const validUserId = emailToUUID(userId);
      query = query.eq('user_id', validUserId);
    }

    const { data: dbReservations, error } = await query;

    if (!error && dbReservations) {
      const formatted = dbReservations.map((r) => {
        const readableSeats = (r.seat_ids || []).map((id: string) => uuidToSeat(id));
        const labels = readableSeats.map((s: string) => s.replace('seat-', '')).join(', ');

        return {
          id: r.id,
          userId: r.user_id,
          eventId: r.event_id,
          seatIds: readableSeats,
          seats: labels,
          totalAmount: r.total_amount,
          status: r.status,
          paymentStatus: r.payment_status,
          checkInStatus: r.check_in_status,
          scannedAt: r.scanned_at,
          createdAt: r.created_at,
        };
      });

      return NextResponse.json({ reservations: formatted });
    }
  } catch (err) {
    console.error('Reservations database query error:', err);
  }

  return NextResponse.json({ reservations: [] });
}
