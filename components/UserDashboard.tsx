'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Seat, Section, Venue, Event, UserProfile } from '@/types/seat-reservation';
import { SeatingMap } from './SeatingMap';
import { CartSummary } from './CartSummary';
import { CheckoutModal } from './CheckoutModal';
import { UserFrontPage } from './UserFrontPage';
import { RegistrationCrosses } from './RegistrationCrosses';
import { TicketCard } from './TicketCard';
import { createClient } from '@/utils/supabase/client';
import { generateInitialSeats, UNIVERSITY_OF_ABRA_VENUE, MOCK_EVENTS } from '@/lib/mock-data';

export const UserDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'LANDING' | 'SEATING' | 'MY_RESERVATIONS'>('LANDING');
  const [venue] = useState<Venue>(UNIVERSITY_OF_ABRA_VENUE);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [filterSectionId, setFilterSectionId] = useState<string>('ALL');
  const [isHeld, setIsHeld] = useState<boolean>(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('CONNECTED');
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const hasHandledStripeSession = useRef<boolean>(false);

  const upsertReservation = useCallback((newRes: any) => {
    setUserReservations((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      const existing = map.get(newRes.id);
      map.set(newRes.id, {
        ...existing,
        ...newRes,
      });
      return Array.from(map.values());
    });
  }, []);

  const loadUserReservations = useCallback(async () => {
    try {
      const email = currentUser?.email;
      const url = email ? `/api/v1/reservations?userId=${encodeURIComponent(email)}` : '/api/v1/reservations';
      const res = await fetch(url);
      const data = await res.json();
      if (data.reservations && Array.isArray(data.reservations)) {
        const enriched = data.reservations.map((r: any) => {
          const ev = events.find((e) => e.id === r.eventId);
          return {
            ...r,
            eventName: ev?.title || r.eventName || 'University of Abra Arena Event',
          };
        });
        const map = new Map();
        enriched.forEach((r: any) => {
          if (r.id) map.set(r.id, r);
        });
        setUserReservations(Array.from(map.values()));
      }
    } catch (err) {
      console.error('Failed to load user reservations:', err);
    }
  }, [currentUser?.email, events]);

  // Load saved user session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sotero_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse stored user profile', err);
      }
    }
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('sotero_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sotero_user');
  };

  // Load unique events on mount
  useEffect(() => {
    async function loadEvents() {
      try {
        const evtRes = await fetch('/api/v1/events');
        const evtData = await evtRes.json();
        if (evtData.events && evtData.events.length > 0) {
          const seen = new Set<string>();
          const uniqueEvents: Event[] = [];
          for (const ev of evtData.events) {
            const key = (ev.title || '').trim().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              uniqueEvents.push(ev);
            }
          }
          setEvents(uniqueEvents);
          setSelectedEvent((prev) => {
            if (prev) {
              const match = uniqueEvents.find((e) => e.id === prev.id || e.title.toLowerCase() === prev.title.toLowerCase());
              if (match) return match;
            }
            return uniqueEvents[0];
          });
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    }

    loadEvents();
  }, []);

  // Fetch distinct seat occupancy specifically for the active event
  useEffect(() => {
    const eventId = selectedEvent?.id;
    if (!eventId) return;

    async function loadSeatsForEvent() {
      setSelectedSeatIds([]);
      try {
        const seatsRes = await fetch(`/api/v1/events/${eventId}/seats`);
        const seatsData = await seatsRes.json();
        if (seatsData.seats) {
          setSeats(seatsData.seats);
        } else {
          setSeats(generateInitialSeats());
        }
      } catch (err) {
        setSeats(generateInitialSeats());
      }
    }

    loadSeatsForEvent();
  }, [selectedEvent?.id]);

  // Supabase Realtime WebSocket listener
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('public:seats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          // Refresh seats for current event when reservations change
          if (selectedEvent?.id) {
            fetch(`/api/v1/events/${selectedEvent.id}/seats`)
              .then((r) => r.json())
              .then((d) => d.seats && setSeats(d.seats))
              .catch(console.error);
          }
          loadUserReservations();
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('CONNECTED');
        } else {
          setRealtimeStatus('DISCONNECTED');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedEvent?.id, loadUserReservations]);

  // Load user reservations on mount and whenever user or events change
  useEffect(() => {
    loadUserReservations();
  }, [loadUserReservations]);

  // Also refresh reservations when switching to MY_RESERVATIONS view
  useEffect(() => {
    if (currentView === 'MY_RESERVATIONS') {
      loadUserReservations();
    }
  }, [currentView, loadUserReservations]);

  const handleToggleSeat = (seat: Seat) => {
    if (seat.status === 'BOOKED') return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  const handleHoldSeats = async () => {
    if (selectedSeatIds.length === 0) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/seats/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatIds: selectedSeatIds,
          userId: currentUser ? currentUser.email : 'guest-user',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsHeld(true);
        setHoldExpiresAt(data.expiresAt);
        setSeats((prev) =>
          prev.map((s) =>
            selectedSeatIds.includes(s.id)
              ? { ...s, status: 'HELD', currentHolderId: currentUser?.email || 'guest-user' }
              : s
          )
        );
      } else {
        alert(data.error || 'Failed to hold seats');
      }
    } catch (err: any) {
      alert('Network error locking seats');
    } finally {
      setIsLoading(false);
    }
  };

  // Check for return from Stripe Hosted Checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const checkoutStatus = urlParams.get('checkout_status');

    if (sessionId && checkoutStatus === 'success' && !hasHandledStripeSession.current) {
      hasHandledStripeSession.current = true;
      const pendingRaw = localStorage.getItem('sotero_pending_checkout');
      const pendingData = pendingRaw ? JSON.parse(pendingRaw) : null;

      async function verifyStripeSession() {
        try {
          const res = await fetch(`/api/v1/payments/verify-session?session_id=${sessionId}`);
          const data = await res.json();
          if (data.success && data.paid) {
            const seatIdsToBook = pendingData?.seatIds || (data.metadata?.seatIds ? data.metadata.seatIds.split(',') : []);

            const resPost = await fetch('/api/v1/reservations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                seatIds: seatIdsToBook,
                totalAmount: data.amountTotal,
                userId: data.customerEmail || pendingData?.email || 'guest@abra.edu.ph',
                eventId: data.metadata?.eventId || pendingData?.eventId || 'evt-intra-2026',
                paymentStatus: 'PAID_STRIPE',
              }),
            });

            const resData = await resPost.json();
            if (resData.success && resData.reservation) {
              setSeats((prev) =>
                prev.map((s) =>
                  seatIdsToBook.includes(s.id) ? { ...s, status: 'BOOKED', currentHolderId: null } : s
                )
              );
              upsertReservation({
                ...resData.reservation,
                eventName: selectedEvent ? selectedEvent.title : 'University of Abra Arena Event',
                seats: pendingData?.seatsLabel || seatIdsToBook.join(', '),
              });
              loadUserReservations();
            }
          }
        } catch (err) {
          console.error('Error verifying Stripe session on return:', err);
        } finally {
          localStorage.removeItem('sotero_pending_checkout');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      verifyStripeSession();
    }
  }, [loadUserReservations, selectedEvent, upsertReservation]);

  const handleConfirmPayment = async (details: {
    name: string;
    email: string;
    paymentStatus?: string;
    stripePaymentIntentId?: string;
  }) => {
    const totalCalc = selectedSeats.reduce(
      (acc, s) =>
        acc +
        (s.sectionId === 'sec-vip'
          ? venue.layoutConfig.sections.find((sec) => sec.id === 'sec-vip')?.basePrice || 250
          : s.sectionId === 'sec-orchestra'
          ? venue.layoutConfig.sections.find((sec) => sec.id === 'sec-orchestra')?.basePrice || 150
          : venue.layoutConfig.sections.find((sec) => sec.id === 'sec-balcony')?.basePrice || 75),
      0
    );

    const res = await fetch('/api/v1/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatIds: selectedSeatIds,
        totalAmount: totalCalc,
        userId: details.email,
        eventId: selectedEvent ? selectedEvent.id : 'evt-intra-2026',
        paymentStatus: details.paymentStatus || 'PAID_STRIPE',
      }),
    });

    const data = await res.json();
    if (res.ok && data.reservation) {
      setSeats((prev) =>
        prev.map((s) =>
          selectedSeatIds.includes(s.id) ? { ...s, status: 'BOOKED', currentHolderId: null } : s
        )
      );

      upsertReservation({
        ...data.reservation,
        eventName: selectedEvent ? selectedEvent.title : 'University of Abra Arena Event',
        seats: selectedSeats.map((s) => `Row ${s.rowLabel} - Seat ${s.seatNumber}`).join(', '),
      });

      setSelectedSeatIds([]);
      loadUserReservations();
    }
  };

  const handleClearSelection = () => {
    setSelectedSeatIds([]);
    setIsHeld(false);
    setHoldExpiresAt(null);
  };

  const handleSelectEventFromLanding = (evt: Event) => {
    setSelectedEvent(evt);
    setCurrentView('SEATING');
  };

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const sections: Section[] = venue.layoutConfig.sections;

  const technicalIndexProjects = [
    ['K-01', 'VENUE LOCATION', 'UNIVERSITY OF ABRA ARENA'],
    ['K-02', 'ACCOUNT LIMIT', 'STRICTLY 1 ACCOUNT / USER'],
    ['K-03', 'PAYMENT MODE', 'STRIPE ONLINE PAYMENT GATEWAY'],
    ['K-04', 'REALTIME SYNC', 'SUPABASE WEBSOCKET ACTIVE'],
  ];

  return (
    <div className="min-h-screen bg-concrete-grid text-[#161616] flex flex-col justify-between">
      {/* Dedicated User Header */}
      <header className="border-b-3 border-[#161616] bg-[#D7D5CF] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono-spec">
        <div className="flex flex-wrap items-center gap-3 cursor-pointer" onClick={() => setCurrentView('LANDING')}>
          <span className="font-anton text-2xl tracking-widest uppercase text-[#161616]">
            SOTERO // ABRA ARENA
          </span>
          <span className="text-[10px] tracking-widest uppercase text-[#FFFFFF] bg-[#E8590C] px-2.5 py-1 font-bold border border-[#161616]">
            USER PORTAL
          </span>
        </div>

        {/* User Navigation Tabs & Portal Switcher Link */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-[#C8C5BD] border-2 border-[#161616] p-1 gap-1">
            <button
              onClick={() => setCurrentView('LANDING')}
              className={`px-3.5 py-1.5 text-xs font-bold uppercase transition-all ${
                currentView === 'LANDING'
                  ? 'bg-[#161616] text-[#D7D5CF]'
                  : 'text-[#161616] hover:bg-[#D7D5CF]'
              }`}
            >
              🏠 HOME
            </button>
            <button
              onClick={() => setCurrentView('SEATING')}
              className={`px-3.5 py-1.5 text-xs font-bold uppercase transition-all ${
                currentView === 'SEATING'
                  ? 'bg-[#161616] text-[#D7D5CF]'
                  : 'text-[#161616] hover:bg-[#D7D5CF]'
              }`}
            >
              🎟️ SEAT MAP
            </button>
            <button
              onClick={() => setCurrentView('MY_RESERVATIONS')}
              className={`px-3.5 py-1.5 text-xs font-bold uppercase transition-all ${
                currentView === 'MY_RESERVATIONS'
                  ? 'bg-[#161616] text-[#D7D5CF]'
                  : 'text-[#161616] hover:bg-[#D7D5CF]'
              }`}
            >
              📜 MY TICKETS ({userReservations.length})
            </button>
          </div>

          <a
            href="/admin"
            className="px-3 py-1.5 text-xs font-bold uppercase bg-[#E8590C] hover:bg-[#161616] text-[#FFFFFF] border-2 border-[#161616] transition-all"
          >
            🔑 ADMIN PORTAL →
          </a>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1">
        {currentView === 'LANDING' && (
          <UserFrontPage
            onSelectEvent={handleSelectEventFromLanding}
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'SEATING' && (
          <div className="space-y-6 font-mono-spec">
            {/* Event Header Banner */}
            <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete flex flex-col md:flex-row md:items-center justify-between gap-4">
              <RegistrationCrosses />

              <div>
                <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase mb-1">
                  LOCATION: UNIVERSITY OF ABRA ARENA // EVENT ALLOCATION
                </div>
                <h2 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
                  {selectedEvent?.title || 'UNIVERSITY OF ABRA ARENA EVENT'}
                </h2>
                <div className="text-xs text-[#555] font-bold mt-1 uppercase">
                  DATE: {selectedEvent?.eventDate ? new Date(selectedEvent.eventDate).toLocaleString() : 'UPCOMING'}
                </div>
              </div>

              {/* Event Switcher Dropdown */}
              <div className="flex items-center gap-2 bg-[#C8C5BD] p-2 border-2 border-[#161616]">
                <span className="text-xs font-bold text-[#555] uppercase">SWITCH EVENT:</span>
                <select
                  value={selectedEvent?.id || ''}
                  onChange={(e) => {
                    const found = events.find((evt) => evt.id === e.target.value);
                    if (found) {
                      setSelectedEvent(found);
                      setSelectedSeatIds([]);
                    }
                  }}
                  className="bg-[#D7D5CF] border border-[#161616] px-2 py-1 text-xs font-bold text-[#161616] focus:outline-none"
                >
                  {Array.from(
                    new Map(events.map((evt) => [(evt.title || '').trim().toLowerCase(), evt])).values()
                  ).map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="bg-[#D7D5CF] border-3 border-[#161616] p-4 shadow-concrete-sm flex flex-wrap items-center gap-3">
              <span className="text-xs text-[#555] font-bold uppercase tracking-wider pr-2">
                FILTER TIER:
              </span>
              <button
                onClick={() => setFilterSectionId('ALL')}
                className={`px-3 py-1.5 text-xs font-bold uppercase border-2 border-[#161616] transition-all ${
                  filterSectionId === 'ALL'
                    ? 'bg-[#E8590C] text-[#FFFFFF]'
                    : 'bg-[#C8C5BD] text-[#161616] hover:bg-[#FFFFFF]'
                }`}
              >
                ALL SECTIONS
              </button>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setFilterSectionId(sec.id)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase border-2 border-[#161616] transition-all ${
                    filterSectionId === sec.id
                      ? 'bg-[#E8590C] text-[#FFFFFF]'
                      : 'bg-[#C8C5BD] text-[#161616] hover:bg-[#FFFFFF]'
                  }`}
                >
                  {sec.name} (₱{sec.basePrice})
                </button>
              ))}
            </div>

            {/* Seating Map & Cart Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-4">
                <SeatingMap
                  seats={seats}
                  sections={sections}
                  selectedSeatIds={selectedSeatIds}
                  onToggleSeat={handleToggleSeat}
                  filterSectionId={filterSectionId}
                />

                {/* Legend */}
                <div className="bg-[#D7D5CF] border-3 border-[#161616] p-4 text-xs font-mono-spec font-bold text-[#161616] shadow-concrete-sm flex flex-wrap items-center justify-around gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-[#E8590C] border border-[#161616]"></span>
                    <span>VIP PATRON (₱250)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-[#3A3936] border border-[#161616]"></span>
                    <span>LOWER BOX (₱150)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-[#8F8D86] border border-[#161616]"></span>
                    <span>UPPER BLEACHERS (₱75)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-[#FFFFFF] border-2 border-[#161616]"></span>
                    <span>SELECTED</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-[#161616] border border-[#161616]"></span>
                    <span>BOOKED</span>
                  </div>
                </div>
              </div>

              <div>
                <CartSummary
                  selectedSeats={selectedSeats}
                  sections={sections}
                  onProceedCheckout={() => setIsCheckoutOpen(true)}
                  onClearSelection={handleClearSelection}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {currentView === 'MY_RESERVATIONS' && (
          <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete text-[#161616] space-y-6 font-mono-spec">
            <RegistrationCrosses />

            <div className="pb-4 border-b-2 border-[#161616]">
              <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase mb-1">
                USER ACCOUNT // DIGITAL TICKET DIRECTORY
              </div>
              <h2 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
                [ MY RESERVED ARENA TICKETS ]
              </h2>
            </div>

            {(() => {
              const uniqueReservations = Array.from(
                new Map(userReservations.map((r) => [r.id, r])).values()
              );
              return uniqueReservations.length === 0 ? (
                <div className="text-center py-16 text-[#555] text-xs uppercase tracking-wider">
                  No tickets reserved yet. Select an event and reserve seats on the map.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {uniqueReservations.map((res) => (
                    <TicketCard
                      key={res.id}
                      ticketId={res.id}
                      eventName={res.eventName}
                      seats={res.seats}
                      totalAmount={res.totalAmount}
                      paymentStatus={res.paymentStatus || 'PAID & CONFIRMED (STRIPE)'}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Footer Technical Index Strip */}
      <footer className="bg-[#D7D5CF] border-t-3 border-[#161616] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 font-mono-spec mt-8">
        {technicalIndexProjects.map(([idx, name, meta]) => (
          <div
            key={idx}
            className="p-4 border-b sm:border-b-0 sm:border-r border-[#161616]/30 last:border-r-0"
          >
            <div className="text-[10px] tracking-widest text-[#E8590C] font-bold">
              {idx}
            </div>
            <div className="font-anton text-sm tracking-wider text-[#161616] uppercase mt-1">
              {name}
            </div>
            <div className="text-[10px] tracking-widest text-[#555] mt-1 uppercase">
              {meta}
            </div>
          </div>
        ))}
      </footer>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        selectedSeats={selectedSeats}
        totalPrice={selectedSeats.reduce(
          (acc, s) =>
            acc +
            (s.sectionId === 'sec-vip'
              ? sections.find((sec) => sec.id === 'sec-vip')?.basePrice || 250
              : s.sectionId === 'sec-orchestra'
              ? sections.find((sec) => sec.id === 'sec-orchestra')?.basePrice || 150
              : sections.find((sec) => sec.id === 'sec-balcony')?.basePrice || 75),
          0
        )}
        onClose={() => {
          setIsCheckoutOpen(false);
          if (isHeld) {
            handleClearSelection();
          }
        }}
        onConfirmPayment={handleConfirmPayment}
        eventId={selectedEvent ? selectedEvent.id : 'evt-intra-2026'}
        eventTitle={selectedEvent ? selectedEvent.title : 'University of Abra Arena Championship'}
      />
    </div>
  );
};
