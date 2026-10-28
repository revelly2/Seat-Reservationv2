-- Each booking is its own ticket. The one-active-reservation-per-user-per-event rule forced later
-- bookings to be merged into an earlier ticket (even one already checked in at the gate), so drop it.
-- Double booking of a seat is still refused by the API's seat-taken check.
DROP INDEX IF EXISTS idx_unique_user_active_event_res;
