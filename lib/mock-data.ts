import { Venue, Event, Seat, Section } from '@/types/seat-reservation';
import ARENA_LAYOUT from './arena-layout.json';

export { ARENA_LAYOUT };

// One pricing section per block of the MASTER SEAT PLAN; ids match the rows seeded in Supabase `sections`.
export const ARENA_SECTIONS: Section[] = ARENA_LAYOUT.blocks.map((b, i) => ({
  id: `5ec7a000-0000-4000-a000-${String(i + 1).padStart(12, '0')}`,
  name: b.name,
  basePrice: b.defaultPrice,
}));

export const UNIVERSITY_OF_ABRA_VENUE: Venue = {
  id: '11111111-1111-4111-a111-111111111111',
  name: 'University of Abra Arena',
  totalCapacity: ARENA_LAYOUT.seats.length,
  layoutConfig: {
    rows: 9, // rows A–I
    columns: ARENA_LAYOUT.blocks.length,
    sections: ARENA_SECTIONS,
  },
  createdAt: new Date('2026-01-01'),
};

export const MOCK_EVENTS: Event[] = [];

export function generateInitialSeats(): Seat[] {
  return ARENA_LAYOUT.seats.map(([blockIdx, row, num, x, y]) => ({
    id: `seat-${ARENA_LAYOUT.blocks[blockIdx as number].code}-${row}-${num}`,
    venueId: UNIVERSITY_OF_ABRA_VENUE.id,
    sectionId: ARENA_SECTIONS[blockIdx as number].id,
    rowLabel: row as string,
    seatNumber: num as number,
    status: 'AVAILABLE',
    currentHolderId: null,
    holdExpiresAt: null,
    x: x as number,
    y: y as number,
  }));
}

const BLOCK_CODES = ARENA_LAYOUT.blocks.map((b) => b.code);

// Arena seats encode as 00000000-0000-4000-c000-0000BBRRNNNN (block, row, number); legacy grid seats used the b000 form.
export function seatToUUID(seatId: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(seatId)) {
    return seatId;
  }
  const arena = seatId.match(/^seat-([A-Z0-9]+)-([A-Z])-(\d+)$/);
  if (arena && BLOCK_CODES.includes(arena[1])) {
    const block = String(BLOCK_CODES.indexOf(arena[1]) + 1).padStart(2, '0');
    const row = String(arena[2].charCodeAt(0) - 64).padStart(2, '0');
    return `00000000-0000-4000-c000-0000${block}${row}${arena[3].padStart(4, '0')}`;
  }
  const match = seatId.match(/^seat-([A-Za-z])-(\d+)$/);
  if (match) {
    const rowChar = match[1].toUpperCase();
    const seatNum = parseInt(match[2], 10);
    const rowCode = (rowChar.charCodeAt(0) - 64).toString().padStart(2, '0');
    const seatCode = seatNum.toString().padStart(2, '0');
    return `00000000-0000-4000-b000-00000000${rowCode}${seatCode}`;
  }
  return '00000000-0000-4000-b000-000000000101';
}

export function uuidToSeat(uuid: string): string {
  if (uuid && uuid.startsWith('00000000-0000-4000-c000-0000')) {
    const tail = uuid.slice(28);
    const block = BLOCK_CODES[parseInt(tail.slice(0, 2), 10) - 1];
    const row = String.fromCharCode(64 + parseInt(tail.slice(2, 4), 10));
    return `seat-${block}-${row}-${parseInt(tail.slice(4), 10)}`;
  }
  if (uuid && uuid.startsWith('00000000-0000-4000-b000-00000000')) {
    const rowCode = parseInt(uuid.slice(32, 34), 10);
    const seatNum = parseInt(uuid.slice(34, 36), 10);
    const rowChar = String.fromCharCode(64 + rowCode);
    return `seat-${rowChar}-${seatNum}`;
  }
  return uuid;
}
