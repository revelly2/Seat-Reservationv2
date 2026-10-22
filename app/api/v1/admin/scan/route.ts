import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, emailToUUID } from '@/lib/supabase-admin';
import { uuidToSeat } from '@/lib/mock-data';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role') || 'USER';
  if (role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden: Admin privileges required for gate entry scanning' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const raw: unknown = body?.reservationId || body?.qrCodeData;
    const reservationId = typeof raw === 'string' ? raw.replace('sotero://ticket/', '').trim() : '';

    if (!UUID_RE.test(reservationId)) {
      return NextResponse.json({ error: 'INVALID TICKET: QR code is not a Sotero ticket.' }, { status: 400 });
    }

    const { data: res, error: fetchErr } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: `Ticket lookup failed: ${fetchErr.message}` }, { status: 500 });
    }
    if (!res) {
      return NextResponse.json({ error: 'INVALID TICKET: Reservation not found.' }, { status: 404 });
    }
    if (res.status === 'CANCELLED' || res.status === 'EXPIRED') {
      return NextResponse.json({ error: `ENTRY DENIED: Reservation is ${res.status}.` }, { status: 409 });
    }
    if (res.check_in_status === 'CHECKED_IN') {
      return NextResponse.json(
        { error: `DUPLICATE TICKET ENTRY DETECTED! Ticket was already scanned at ${res.scanned_at}` },
        { status: 409 }
      );
    }

    // Conditional update: only one concurrent scan of the same ticket can flip PENDING -> CHECKED_IN.
    const scannedAt = new Date().toISOString();
    const paymentStatus = res.payment_status === 'UNPAID' ? 'PAID_ON_SITE' : res.payment_status;
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('reservations')
      .update({ check_in_status: 'CHECKED_IN', scanned_at: scannedAt, status: 'CONFIRMED', payment_status: paymentStatus })
      .eq('id', reservationId)
      .neq('check_in_status', 'CHECKED_IN')
      .select('id');

    if (updateErr) {
      return NextResponse.json({ error: `Check-in could not be saved: ${updateErr.message}` }, { status: 500 });
    }
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'DUPLICATE TICKET ENTRY DETECTED! Ticket was just scanned.' }, { status: 409 });
    }

    // shortcut: scans all profiles to reverse the email-derived user_id; store the email on reservations if users grow large.
    const [{ data: event }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from('events').select('title').eq('id', res.event_id).maybeSingle(),
      supabaseAdmin.from('user_profiles').select('id, full_name, email'),
    ]);
    const profile = (profiles || []).find((p) => p.id === res.user_id || emailToUUID(p.email) === res.user_id);
    const seatIds: string[] = Array.isArray(res.seat_ids) ? res.seat_ids : [];

    return NextResponse.json({
      success: true,
      message: 'VALID TICKET: Check-in recorded, gate barrier opened.',
      ticket: {
        id: res.id,
        userId: res.user_id,
        userName: profile?.full_name || res.user_id,
        userEmail: profile?.email || res.user_id,
        eventId: res.event_id,
        eventName: event?.title || res.event_id,
        seatIds,
        seatLabels: seatIds.map((s) => uuidToSeat(s).replace(/^seat-/, '')),
        totalAmount: Number(res.total_amount),
        status: 'CONFIRMED',
        paymentStatus,
        checkInStatus: 'CHECKED_IN',
        scannedAt,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
