import { ARENA_LAYOUT, ARENA_SECTIONS, generateInitialSeats, seatToUUID, uuidToSeat } from '@/lib/mock-data';

describe('MASTER SEAT PLAN arena layout', () => {
  const seats = generateInitialSeats();

  test('has every seat from the plan with unique ids', () => {
    expect(seats).toHaveLength(1854);
    expect(new Set(seats.map((s) => s.id)).size).toBe(1854);
  });

  test('block seat counts match the drawing', () => {
    const count = (name: string) => seats.filter((s) => s.sectionId === ARENA_SECTIONS.find((x) => x.name === name)!.id).length;
    expect([count('BLK 1'), count('BLK 2'), count('BLK 3'), count('BLK 4'), count('BLK 5'), count('BLK 6'), count('BLK 7'), count('VIP')])
      .toEqual([294, 180, 365, 112, 363, 295, 70, 175]);
  });

  test('every seat has a position inside the plan', () => {
    for (const s of seats) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(ARENA_LAYOUT.width);
      expect(s.y).toBeGreaterThan(0);
      expect(s.y).toBeLessThan(ARENA_LAYOUT.height);
    }
  });

  test('seat ids round-trip through the reservation UUID encoding', () => {
    const uuids = new Set<string>();
    for (const s of seats) {
      const uuid = seatToUUID(s.id);
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-c[0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(uuidToSeat(uuid)).toBe(s.id);
      uuids.add(uuid);
    }
    expect(uuids.size).toBe(seats.length);
  });

  test('legacy grid reservations still decode but match no arena seat', () => {
    const legacy = uuidToSeat(seatToUUID('seat-D-4'));
    expect(legacy).toBe('seat-D-4');
    expect(seats.some((s) => s.id === legacy)).toBe(false);
  });
});
