import { Venue, Event, Seat } from '@/types/seat-reservation';

export const UNIVERSITY_OF_ABRA_VENUE: Venue = {
  id: '11111111-1111-4111-a111-111111111111',
  name: 'University of Abra Arena',
  totalCapacity: 80,
  layoutConfig: {
    rows: 8,
    columns: 10,
    sections: [
      { id: 'sec-vip', name: 'VIP Patron Row', basePrice: 250.00 },
      { id: 'sec-orchestra', name: 'Lower Box Center', basePrice: 150.00 },
      { id: 'sec-balcony', name: 'Upper Bleachers', basePrice: 75.00 },
    ],
  },
  createdAt: new Date('2026-01-01'),
};

export const MOCK_EVENTS: Event[] = [];

export function generateInitialSeats(): Seat[] {
  const seats: Seat[] = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  rows.forEach((row, rIdx) => {
    let sectionId = 'sec-balcony';

    if (rIdx < 2) {
      sectionId = 'sec-vip';
    } else if (rIdx < 5) {
      sectionId = 'sec-orchestra';
    }

    for (let c = 1; c <= 10; c++) {
      let status: Seat['status'] = 'AVAILABLE';
      let currentHolderId: string | null = null;
      let holdExpiresAt: Date | null = null;

      seats.push({
        id: `seat-${row}-${c}`,
        venueId: UNIVERSITY_OF_ABRA_VENUE.id,
        sectionId,
        rowLabel: row,
        seatNumber: c,
        status,
        currentHolderId,
        holdExpiresAt,
      });
    }
  });

  return seats;
}

export function seatToUUID(seatId: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(seatId)) {
    return seatId;
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
  if (uuid && uuid.startsWith('00000000-0000-4000-b000-00000000')) {
    const rowCode = parseInt(uuid.slice(32, 34), 10);
    const seatNum = parseInt(uuid.slice(34, 36), 10);
    const rowChar = String.fromCharCode(64 + rowCode);
    return `seat-${rowChar}-${seatNum}`;
  }
  return uuid;
}
