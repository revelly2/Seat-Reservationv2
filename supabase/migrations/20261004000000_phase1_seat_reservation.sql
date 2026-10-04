-- Phase 1: Seat Reservation System Schema & Atomic Concurrency Engine

CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'HELD', 'BOOKED', 'MAINTENANCE');
CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED');

-- Venues Table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  total_capacity INT NOT NULL DEFAULT 0,
  layout_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sections Table
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- Seats Table
CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  row_label TEXT NOT NULL,
  seat_number INT NOT NULL,
  status seat_status NOT NULL DEFAULT 'AVAILABLE',
  current_holder_id UUID,
  hold_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_venue_row_seat UNIQUE (venue_id, row_label, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);
CREATE INDEX IF NOT EXISTS idx_seats_venue ON seats(venue_id);
CREATE INDEX IF NOT EXISTS idx_seats_hold_expires ON seats(hold_expires_at);

-- Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  seat_ids UUID[] NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status reservation_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Atomic Hold RPC Function with Row Locking to Prevent Double-Booking
CREATE OR REPLACE FUNCTION hold_seats(
  p_seat_ids UUID[],
  p_user_id UUID,
  p_ttl_minutes INT DEFAULT 10
)
RETURNS TABLE (
  seat_id UUID,
  status seat_status,
  current_holder_id UUID,
  hold_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
  v_new_expiry TIMESTAMPTZ := NOW() + (p_ttl_minutes || ' minutes')::INTERVAL;
BEGIN
  -- Lock candidate seat rows for update to prevent concurrent race conditions
  PERFORM 1
  FROM seats s
  WHERE s.id = ANY(p_seat_ids)
  FOR UPDATE;

  -- Verify all requested seats exist and are available (or have expired holds)
  SELECT COUNT(*)
  INTO v_count
  FROM seats s
  WHERE s.id = ANY(p_seat_ids)
    AND (
      s.status = 'AVAILABLE'
      OR (s.status = 'HELD' AND s.hold_expires_at < NOW())
    );

  IF v_count < array_length(p_seat_ids, 1) THEN
    RAISE EXCEPTION 'One or more requested seats are not available or currently locked by another user.';
  END IF;

  -- Atomic update of locked seats
  RETURN QUERY
  UPDATE seats s
  SET
    status = 'HELD'::seat_status,
    current_holder_id = p_user_id,
    hold_expires_at = v_new_expiry
  WHERE s.id = ANY(p_seat_ids)
  RETURNING s.id, s.status, s.current_holder_id, s.hold_expires_at;
END;
$$;
