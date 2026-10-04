import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return NextResponse.json({
    id,
    status: 'CONFIRMED',
    userId: 'user-current-session',
    eventId: 'evt-200',
    eventName: 'Grand Gala Concert 2026',
    venueName: 'Grand Metropolitan Arena',
    seatIds: ['seat-A-1', 'seat-A-2'],
    totalAmount: 500.00,
    ticketNumber: `TKT-${id.toUpperCase()}`,
    qrCodeData: `sotero://ticket/${id}`,
    createdAt: new Date().toISOString(),
  });
}
