import { NextRequest } from 'next/server';

// In-memory stand-in for the Supabase query builder used by the scan route.
const db: { reservations: any[]; events: any[]; user_profiles: any[] } = { reservations: [], events: [], user_profiles: [] };
let failUpdate = false;

jest.mock('@/lib/supabase-admin', () => ({
  emailToUUID: jest.requireActual('@/lib/supabase-admin').emailToUUID,
  supabaseAdmin: {
    from: (table: keyof typeof db) => {
      const filters: Array<(r: any) => boolean> = [];
      let patch: any = null;
      const rows = () => db[table].filter((r) => filters.every((f) => f(r)));
      const q: any = {
        select: () => q,
        update: (p: any) => { patch = p; return q; },
        eq: (k: string, v: any) => { filters.push((r) => r[k] === v); return q; },
        neq: (k: string, v: any) => { filters.push((r) => r[k] !== v); return q; },
        maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
        then: (resolve: any) => {
          if (!patch) return resolve({ data: rows(), error: null });
          if (failUpdate) return resolve({ data: null, error: { message: 'update rejected' } });
          const hit = rows();
          hit.forEach((r) => Object.assign(r, patch));
          return resolve({ data: hit.map((r) => ({ id: r.id })), error: null });
        },
      };
      return q;
    },
  },
}));

import { POST as scan } from '@/app/api/v1/admin/scan/route';
import { emailToUUID } from '@/lib/supabase-admin';

const ID = '73300b21-804d-48aa-b727-f62b8949a44b';
const scanReq = (qrCodeData: string, role = 'ADMIN') =>
  new NextRequest('http://localhost:3000/api/v1/admin/scan', {
    method: 'POST',
    headers: { 'x-user-role': role, 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrCodeData }),
  });

beforeEach(() => {
  failUpdate = false;
  db.reservations = [{ id: ID, user_id: emailToUUID('juan@test.local'), event_id: 'e1', seat_ids: ['00000000-0000-4000-b000-000000000403'], total_amount: '300.00', status: 'CONFIRMED', payment_status: 'PAID_STRIPE', check_in_status: 'PENDING', scanned_at: null }];
  db.events = [{ id: 'e1', title: 'Cheer Dance 2026' }];
  db.user_profiles = [{ id: 'u1', full_name: 'Juan Dela Cruz', email: 'juan@test.local' }];
});

describe('POST /api/v1/admin/scan', () => {
  test('rejects non-admin callers', async () => {
    expect((await scan(scanReq(`sotero://ticket/${ID}`, 'USER'))).status).toBe(403);
  });

  test('grants a valid ticket once and saves the check-in without touching Stripe payment status', async () => {
    const res = await scan(scanReq(`sotero://ticket/${ID}`));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ticket).toMatchObject({ userName: 'Juan Dela Cruz', eventName: 'Cheer Dance 2026', seatLabels: ['D-3'], totalAmount: 300, paymentStatus: 'PAID_STRIPE' });
    expect(db.reservations[0]).toMatchObject({ check_in_status: 'CHECKED_IN', payment_status: 'PAID_STRIPE' });
  });

  test('rejects the same ticket on a second scan', async () => {
    await scan(scanReq(ID));
    const res = await scan(scanReq(ID));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain('DUPLICATE');
  });

  test('rejects an unknown reservation UUID', async () => {
    const res = await scan(scanReq('sotero://ticket/00000000-0000-4000-a000-00000000dead'));
    expect(res.status).toBe(404);
  });

  test('rejects malformed QR content', async () => {
    expect((await scan(scanReq('THIS-IS-NOT-A-TICKET'))).status).toBe(400);
  });

  test('rejects cancelled reservations', async () => {
    db.reservations[0].status = 'CANCELLED';
    expect((await scan(scanReq(ID))).status).toBe(409);
  });

  test('keeps the gate closed when the check-in cannot be saved', async () => {
    failUpdate = true;
    const res = await scan(scanReq(ID));
    expect(res.status).toBe(500);
    expect((await res.json()).success).toBeUndefined();
  });

  test('marks unpaid on-site tickets as PAID_ON_SITE', async () => {
    db.reservations[0].payment_status = 'UNPAID';
    const data = await (await scan(scanReq(ID))).json();
    expect(data.ticket.paymentStatus).toBe('PAID_ON_SITE');
  });
});
