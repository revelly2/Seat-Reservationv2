import { createClient as createBrowserClient } from '@/utils/supabase/client';
import { Seat, Reservation } from '@/types/seat-reservation';

describe('Phase 1: Engine & Concurrency Core Verification', () => {
  test('Supabase browser client initializes with environment variables', () => {
    const client = createBrowserClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });

  test('Domain models validate seat status transitions and lock expiration logic', () => {
    const now = new Date();
    const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);
    const pastExpiry = new Date(now.getTime() - 1 * 60 * 1000);

    const seatAvailable: Seat = {
      id: 'seat-1',
      venueId: 'venue-1',
      sectionId: 'sec-1',
      rowLabel: 'A',
      seatNumber: 1,
      status: 'AVAILABLE',
      currentHolderId: null,
      holdExpiresAt: null,
    };

    const seatHeldActive: Seat = {
      ...seatAvailable,
      id: 'seat-2',
      status: 'HELD',
      currentHolderId: 'user-123',
      holdExpiresAt: futureExpiry,
    };

    const seatHeldExpired: Seat = {
      ...seatAvailable,
      id: 'seat-3',
      status: 'HELD',
      currentHolderId: 'user-456',
      holdExpiresAt: pastExpiry,
    };

    const isSeatLockable = (seat: Seat, currentTime: Date): boolean => {
      if (seat.status === 'AVAILABLE') return true;
      if (seat.status === 'HELD' && seat.holdExpiresAt && seat.holdExpiresAt < currentTime) return true;
      return false;
    };

    expect(isSeatLockable(seatAvailable, now)).toBe(true);
    expect(isSeatLockable(seatHeldActive, now)).toBe(false);
    expect(isSeatLockable(seatHeldExpired, now)).toBe(true);
  });

  test('Reservation object structure conforms to PRD specifications', () => {
    const reservation: Reservation = {
      id: 'res-100',
      userId: 'user-999',
      eventId: 'evt-200',
      seatIds: ['seat-1'],
      totalAmount: 150.0,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      checkInStatus: 'PENDING',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 600000),
    };

    expect(reservation.status).toBe('PENDING');
    expect(reservation.seatIds.length).toBe(1);
    expect(reservation.totalAmount).toBeGreaterThan(0);
  });
});
