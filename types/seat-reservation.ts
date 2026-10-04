export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED' | 'MAINTENANCE';

export interface Section {
  id: string;
  name: string;
  basePrice: number;
}

export interface VenueLayout {
  rows: number;
  columns: number;
  sections: Section[];
}

export interface Venue {
  id: string;
  name: string;
  totalCapacity: number;
  layoutConfig: VenueLayout;
  createdAt: Date;
}

export interface Event {
  id: string;
  venueId: string;
  title: string;
  description: string;
  eventDate: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  studentId?: string;
  role: 'USER' | 'ADMIN';
}

export interface Seat {
  id: string;
  venueId: string;
  sectionId: string;
  rowLabel: string;
  seatNumber: number;
  status: SeatStatus;
  currentHolderId?: string | null;
  holdExpiresAt?: Date | null;
}

export interface Reservation {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  eventId: string;
  eventName?: string;
  seatIds: string[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  paymentStatus: 'UNPAID' | 'PAID_ON_SITE' | 'PAID_STRIPE';
  checkInStatus: 'PENDING' | 'CHECKED_IN';
  scannedAt?: string | null;
  createdAt: Date;
  expiresAt: Date;
}
