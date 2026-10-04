-- Phase 4: University of Abra Arena Multi-Event & On-Site Scanner Migration

-- 1. Events Table (Single Venue: University of Abra Arena)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'UPCOMING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Update Reservations Table for On-Site Payment & Scanner
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN IF NOT EXISTS check_in_status TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scanned_by UUID;

-- 3. Constraint: Limit 1 active reservation per user per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_active_event_res 
  ON reservations(user_id, event_id) 
  WHERE status IN ('PENDING', 'CONFIRMED');

-- 4. RPC function to verify and scan QR ticket at Abra Arena entrance
CREATE OR REPLACE FUNCTION scan_ticket_on_site(
  p_reservation_id UUID,
  p_scanned_by UUID
)
RETURNS TABLE (
  reservation_id UUID,
  user_id UUID,
  event_id UUID,
  seat_count INT,
  total_amount NUMERIC(10, 2),
  payment_status TEXT,
  check_in_status TEXT,
  scanned_at TIMESTAMPTZ,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_res RECORD;
BEGIN
  -- Lock reservation row
  SELECT * INTO v_res
  FROM reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid Ticket: Reservation ID not found.';
  END IF;

  IF v_res.check_in_status = 'CHECKED_IN' THEN
    RAISE EXCEPTION 'Duplicate Entry: Ticket already scanned on %', v_res.scanned_at;
  END IF;

  -- Update reservation to PAID_ON_SITE and CHECKED_IN
  UPDATE reservations
  SET
    payment_status = 'PAID_ON_SITE',
    check_in_status = 'CHECKED_IN',
    status = 'CONFIRMED',
    scanned_at = NOW(),
    scanned_by = p_scanned_by
  WHERE id = p_reservation_id;

  RETURN QUERY
  SELECT 
    v_res.id,
    v_res.user_id,
    v_res.event_id,
    array_length(v_res.seat_ids, 1),
    v_res.total_amount,
    'PAID_ON_SITE'::TEXT,
    'CHECKED_IN'::TEXT,
    NOW(),
    'SUCCESS: Ticket verified, on-site payment computed, entry granted.'::TEXT;
END;
$$;
