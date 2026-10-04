import { POST as updateVenueAdmin } from '@/app/api/v1/admin/venues/route';
import { POST as holdSeats } from '@/app/api/v1/seats/hold/route';
import { NextRequest } from 'next/server';

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

  test('POST /api/v1/admin/venues allows layout & pricing update with ADMIN role', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/admin/venues', {
      method: 'POST',
      headers: {
        'x-user-role': 'ADMIN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Grand Metropolitan Arena (Updated)',
        rows: 10,
        columns: 12,
        sections: [
          { id: 'sec-vip', name: 'VIP Front Row', basePrice: 300.00 },
          { id: 'sec-orchestra', name: 'Orchestra Center', basePrice: 180.00 },
          { id: 'sec-balcony', name: 'Balcony Tier', basePrice: 90.00 },
        ],
      }),
    });

    const res = await updateVenueAdmin(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.venue.name).toBe('Grand Metropolitan Arena (Updated)');
    expect(data.venue.layoutConfig.sections[0].basePrice).toBe(300.00);
  });

  test('Simulated Flash Sale: 50 concurrent hold requests for the same target seat guarantee atomic lock', async () => {
    const targetSeatId = 'seat-D-5';
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
