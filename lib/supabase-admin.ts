import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjadkrmaksbbjcxvikqk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_4MPA3lZQJt_Umh5LfIlrdw_9flfROw6';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Seat UUIDs (seatToUUID form) from `seatUuids` that a CONFIRMED or PENDING reservation of the event already holds.
export async function findTakenSeats(eventId: string, seatUuids: string[]): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('seat_ids')
    .eq('event_id', eventId)
    .in('status', ['CONFIRMED', 'PENDING']);
  if (error) throw new Error(`Seat availability check failed: ${error.message}`);
  const taken = new Set((data || []).flatMap((r: { seat_ids: string[] | null }) => r.seat_ids || []));
  return seatUuids.filter((s) => taken.has(s));
}

// Reservations store user_id as a deterministic UUID derived from the account email.
export function emailToUUID(email: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(email)) {
    return email;
  }
  const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}
