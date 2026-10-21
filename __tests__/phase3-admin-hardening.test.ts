import { NextRequest } from 'next/server';

// In-memory Supabase stand-in so these tests never write to the real venues/sections tables.
const db: Record<string, any[]> = { venues: [], sections: [], seats: [] };
jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    rpc: async () => ({ data: null, error: { message: 'rpc unavailable in tests' } }),
    from: (table: string) => {
      const filters: Array<(r: any) => boolean> = [];
      let patch: any = null;
      const rows = () => (db[table] || []).filter((r) => filters.every((f) => f(r)));
      const q: any = {
        select: () => q,
        update: (p: any) => { patch = p; return q; },
        eq: (k: string, v: any) => { filters.push((r) => r[k] === v); return q; },
        in: (k: string, v: any[]) => { filters.push((r) => v.includes(r[k])); return q; },
        maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
        then: (resolve: any) => {
          const hit = rows();
          if (patch) hit.forEach((r) => Object.assign(r, patch));
          return resolve({ data: hit, error: null });
        },
      };
      return q;
    },
  },
}));

import { GET as getVenue, POST as updateVenueAdmin } from '@/app/api/v1/admin/venues/route';
import { POST as holdSeats } from '@/app/api/v1/seats/hold/route';
import { ARENA_SECTIONS, UNIVERSITY_OF_ABRA_VENUE } from '@/lib/mock-data';

beforeEach(() => {
  db.venues = [{ id: UNIVERSITY_OF_ABRA_VENUE.id, name: 'University of Abra Arena' }];
  db.sections = ARENA_SECTIONS.map((s) => ({ id: s.id, venue_id: UNIVERSITY_OF_ABRA_VENUE.id, base_price: s.basePrice }));
});

const adminPost = (body: object) =>
  new NextRequest('http://localhost:3000/api/v1/admin/venues', {
    method: 'POST',
    headers: { 'x-user-role': 'ADMIN', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('Phase 3: Admin Suite, RBAC & High-Concurrency Flash Sale Hardening', () => {
  test('POST /api/v1/admin/venues denies access without ADMIN role (RBAC Enforcement)', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/admin/venues', {
      method: 'POST',
      headers: {
        'x-user-role': 'USER',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Unauthorized Attempt',
        sections: [],
      }),
    });

    const res = await updateVenueAdmin(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain('Forbidden');
  });

  test('POST /api/v1/admin/venues saves per-block prices that GET then returns', async () => {
    const vip = ARENA_SECTIONS.find((s) => s.name === 'VIP')!;
    const res = await updateVenueAdmin(adminPost({ name: 'University of Abra Arena', sections: [{ ...vip, basePrice: 300 }] }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    const saved = (await (await getVenue()).json()).venue.layoutConfig.sections;
    expect(saved).toHaveLength(8);
    expect(saved.find((s: any) => s.id === vip.id).basePrice).toBe(300);
    expect(saved.find((s: any) => s.name === 'BLK 2').basePrice).toBe(150);
  });

  test('POST /api/v1/admin/venues rejects unknown blocks and negative prices', async () => {
    const unknown = await updateVenueAdmin(adminPost({ name: 'X', sections: [{ id: 'sec-vip', name: 'VIP', basePrice: 10 }] }));
    expect(unknown.status).toBe(400);
    const negative = await updateVenueAdmin(adminPost({ name: 'X', sections: [{ ...ARENA_SECTIONS[0], basePrice: -5 }] }));
    expect(negative.status).toBe(400);
    expect(db.sections[0].base_price).toBe(ARENA_SECTIONS[0].basePrice);
  });

  test('Simulated Flash Sale: 50 concurrent hold requests for the same target seat guarantee atomic lock', async () => {
    const targetSeatId = 'seat-VIP-D-5';
    const concurrentRequests = 50;

    // Dispatch 50 concurrent hold requests
    const promises = Array.from({ length: concurrentRequests }).map((_, index) => {
      const req = new NextRequest('http://localhost:3000/api/v1/seats/hold', {
        method: 'POST',
        body: JSON.stringify({
          seatIds: [targetSeatId],
          userId: `flash-user-${index}`,
        }),
      });
      return holdSeats(req).then((res) => res.json());
    });

    const results = await Promise.all(promises);

    const successfulHolds = results.filter((r) => r.success === true);
    const rejectedHolds = results.filter((r) => r.error !== undefined);

    // Exactly 1 user must acquire the lock under high concurrency
    expect(successfulHolds.length).toBe(1);
    expect(rejectedHolds.length).toBe(concurrentRequests - 1);
  });
});
