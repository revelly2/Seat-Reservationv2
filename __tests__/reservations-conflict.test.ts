import { NextRequest } from 'next/server';

// Fake Supabase client: the real lib/supabase-admin (incl. findTakenSeats) runs against these in-memory rows.
let rows: any[] = [];
let insertError: { message: string } | null = null;
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => {
      const filters: Array<(r: any) => boolean> = [];
      const q: any = {
        select: () => q,
        eq: (k: string, v: any) => { filters.push((r) => r[k] === v); return q; },
        in: (k: string, v: any[]) => { filters.push((r) => v.includes(r[k])); return q; },
        maybeSingle: async () => ({ data: rows.filter((r) => filters.every((f) => f(r)))[0] ?? null, error: null }),
        insert: async (newRows: any[]) => {
          if (insertError) return { error: insertError };
          rows.push(...newRows);
          return { error: null };
        },
        then: (resolve: any) => resolve({ data: rows.filter((r) => filters.every((f) => f(r))), error: null }),
      };
      return q;
    },
  }),
}));

jest.mock('@/lib/stripe', () => ({ stripe: {} })); // never reached: these tests stop at the seat check

import { POST as createReservation } from '@/app/api/v1/reservations/route';
import { POST as createIntent } from '@/app/api/v1/payments/create-intent/route';
import { seatToUUID } from '@/lib/mock-data';

const EVENT = '21804339-5052-4508-bd76-60986e997033';
const post = (handler: (r: NextRequest) => Promise<Response>, body: object) =>
  handler(new NextRequest('http://localhost/api', { method: 'POST', body: JSON.stringify(body) }));

beforeEach(() => {
  rows = [{ id: 'r1', user_id: 'someone-else', event_id: EVENT, seat_ids: [seatToUUID('seat-VIP-C-10')], status: 'CONFIRMED' }];
});

describe('booking without seat holds', () => {
  test('saving a reservation refuses a seat that is already reserved', async () => {
    const res = await post(createReservation, { seatIds: ['seat-VIP-C-10'], eventId: EVENT, userId: 'juan@test.local', totalAmount: 250 });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain('VIP-C-10');
    expect(rows).toHaveLength(1);
  });

  test('saving a reservation for free seats creates a confirmed reservation', async () => {
    const res = await post(createReservation, { seatIds: ['seat-VIP-C-11'], eventId: EVENT, userId: 'juan@test.local', totalAmount: 250 });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.reservation.status).toBe('CONFIRMED');
    expect(rows).toHaveLength(2);
  });

  test('a second booking by the same user for the same event is a separate ticket', async () => {
    const first = await (await post(createReservation, { seatIds: ['seat-VIP-C-11'], eventId: EVENT, userId: 'juan@test.local', totalAmount: 250 })).json();
    const second = await (await post(createReservation, { seatIds: ['seat-VIP-C-12', 'seat-VIP-C-13'], eventId: EVENT, userId: 'juan@test.local', totalAmount: 500 })).json();
    expect(second.reservation.id).not.toBe(first.reservation.id);
    expect(second.reservation.seatIds).toEqual(['seat-VIP-C-12', 'seat-VIP-C-13']);
    expect(second.reservation.totalAmount).toBe(500);
    expect(rows).toHaveLength(3);
  });

  test('a failed save is reported, not shown as a successful booking', async () => {
    insertError ={ message: 'duplicate key value violates unique constraint' };
    const res = await post(createReservation, { seatIds: ['seat-VIP-C-14'], eventId: EVENT, userId: 'juan@test.local', totalAmount: 250 });
    insertError = null;
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('could not be saved');
  });

  test('payment is refused before charging when a seat is already reserved', async () => {
    const res = await post(createIntent, { amount: 500, seatIds: ['seat-VIP-C-10', 'seat-VIP-C-11'], eventId: EVENT });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain('SEAT ALREADY RESERVED');
  });

  test('payment requires the seats and event being paid for', async () => {
    expect((await post(createIntent, { amount: 500 })).status).toBe(400);
  });
});
