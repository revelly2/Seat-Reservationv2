import { GET as getSeats } from '@/app/api/v1/events/[id]/seats/route';
import { POST as holdSeats, DELETE as releaseSeats } from '@/app/api/v1/seats/hold/route';
import { POST as createReservation } from '@/app/api/v1/reservations/route';
import { GET as getReservationReceipt } from '@/app/api/v1/reservations/[id]/route';
import { NextRequest } from 'next/server';

describe('Phase 2: UI & Real-time Integration Endpoints', () => {
  test('GET /api/v1/events/:id/seats returns venue seating map and seats', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/events/evt-200/seats');
    const params = Promise.resolve({ id: 'evt-200' });
    const res = await getSeats(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.eventId).toBe('evt-200');
    expect(data.venue).toBeDefined();
    expect(Array.isArray(data.seats)).toBe(true);
    expect(data.seats.length).toBeGreaterThan(0);
  });

  test('POST /api/v1/seats/hold locks available seats with 10-min TTL', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/seats/hold', {
      method: 'POST',
      body: JSON.stringify({
        seatIds: ['seat-B-1', 'seat-B-2'],
        userId: 'test-user-1',
      }),
    });

    const res = await holdSeats(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.heldSeatIds).toContain('seat-B-1');
    expect(data.expiresAt).toBeDefined();
  });

  test('DELETE /api/v1/seats/hold releases held seats', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/seats/hold', {
      method: 'DELETE',
      body: JSON.stringify({
        seatIds: ['seat-B-1'],
        userId: 'test-user-1',
      }),
    });

    const res = await releaseSeats(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('POST /api/v1/reservations creates confirmed reservation', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/reservations', {
      method: 'POST',
      body: JSON.stringify({
        seatIds: ['seat-B-2'],
        totalAmount: 150.0,
        userId: 'test-user-1',
      }),
    });

    const res = await createReservation(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reservation.status).toBe('CONFIRMED');
    expect(data.receiptUrl).toBeDefined();
  });

  test('GET /api/v1/reservations/:id fetches digital receipt and QR payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/reservations/res-999');
    const params = Promise.resolve({ id: 'res-999' });
    const res = await getReservationReceipt(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe('res-999');
    expect(data.status).toBe('CONFIRMED');
    expect(data.ticketNumber).toBeDefined();
    expect(data.qrCodeData).toBe('sotero://ticket/res-999');
  });
});
