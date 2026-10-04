'use client';

import React, { useState, useEffect } from 'react';
import { Seat, Section, Venue, Event, UserProfile } from '@/types/seat-reservation';
import { SeatingMap } from './SeatingMap';
import { CartSummary } from './CartSummary';
import { CheckoutModal } from './CheckoutModal';
import { AdminVenueBuilder } from './AdminVenueBuilder';
import { AdminScanner } from './AdminScanner';
import { UserFrontPage } from './UserFrontPage';
import { RegistrationCrosses } from './RegistrationCrosses';
import { createClient } from '@/utils/supabase/client';
import { generateInitialSeats, UNIVERSITY_OF_ABRA_VENUE, MOCK_EVENTS } from '@/lib/mock-data';

export const LiveSeatsDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'LANDING' | 'SEATING' | 'ADMIN_VENUE' | 'ADMIN_EVENTS' | 'ADMIN_SCANNER'>('LANDING');
  const [venue, setVenue] = useState<Venue>(UNIVERSITY_OF_ABRA_VENUE);
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<Event>(MOCK_EVENTS[0]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // New Event Form State (Admin)
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [eventCreateMsg, setEventCreateMsg] = useState<string | null>(null);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [filterSectionId, setFilterSectionId] = useState<string>('ALL');
  const [isHeld, setIsHeld] = useState<boolean>(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('CONNECTED');

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
    if (!selectedEvent?.id) return;

    async function loadSeatsForEvent() {
      setSelectedSeatIds([]);
      try {
        const seatsRes = await fetch(`/api/v1/events/${selectedEvent.id}/seats`);
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
          if (selectedEvent?.id) {
            fetch(`/api/v1/events/${selectedEvent.id}/seats`)
              .then((r) => r.json())
              .then((d) => d.seats && setSeats(d.seats))
              .catch(console.error);
          }
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
  }, [selectedEvent?.id]);

  const handleToggleSeat = (seat: Seat) => {
    if (isHeld) return;

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

  const handleConfirmPayment = async (details: { name: string; email: string }) => {
    const res = await fetch('/api/v1/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatIds: selectedSeatIds,
        totalAmount: selectedSeats.reduce(
          (acc, s) =>
            acc +
            (s.sectionId === 'sec-vip'
              ? venue.layoutConfig.sections.find((sec) => sec.id === 'sec-vip')?.basePrice || 250
              : s.sectionId === 'sec-orchestra'
              ? venue.layoutConfig.sections.find((sec) => sec.id === 'sec-orchestra')?.basePrice || 150
              : venue.layoutConfig.sections.find((sec) => sec.id === 'sec-balcony')?.basePrice || 75),
          0
        ),
        userId: details.email,
        eventId: selectedEvent.id,
      }),
    });

    if (res.ok) {
      setSeats((prev) =>
        prev.map((s) =>
          selectedSeatIds.includes(s.id) ? { ...s, status: 'BOOKED', currentHolderId: null } : s
        )
      );
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventCreateMsg(null);

    try {
      const res = await fetch('/api/v1/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          title: newEventTitle,
          description: newEventDesc,
          eventDate: newEventDate || new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEvents(data.events);
        setEventCreateMsg('✓ NEW EVENT CREATED FOR UNIVERSITY OF ABRA ARENA!');
        setNewEventTitle('');
        setNewEventDesc('');
        setNewEventDate('');
      } else {
        setEventCreateMsg(`✖ ${data.error || 'Failed to create event'}`);
      }
    } catch (err) {
      setEventCreateMsg('✖ Network error creating event');
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
      {/* Navigation Header */}
      <header className="border-b-3 border-[#161616] bg-[#D7D5CF] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono-spec">
        <div className="flex flex-wrap items-center gap-3 cursor-pointer" onClick={() => setCurrentView('LANDING')}>
          <span className="font-anton text-2xl tracking-widest uppercase text-[#161616]">
            SOTERO // ABRA ARENA
          </span>
          <span className="text-[10px] tracking-widest uppercase text-[#FFFFFF] bg-[#E8590C] px-2.5 py-1 font-bold border border-[#161616]">
            CONCRETE POSTER
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#C8C5BD] border-2 border-[#161616] p-1 gap-1">
            <button
              onClick={() => setCurrentView('LANDING')}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                currentView === 'LANDING'
                  ? 'bg-[#161616] text-[#D7D5CF]'
                  : 'text-[#161616] hover:bg-[#D7D5CF]'
              }`}
            >
              🏠 HOME
            </button>
            <button
              onClick={() => setCurrentView('SEATING')}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                currentView === 'SEATING'
                  ? 'bg-[#161616] text-[#D7D5CF]'
                  : 'text-[#161616] hover:bg-[#D7D5CF]'
              }`}
            >
              🎟️ SEAT MAP
            </button>
            <button
              onClick={() => setCurrentView('ADMIN_SCANNER')}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                currentView === 'ADMIN_SCANNER'
                  ? 'bg-[#E8590C] text-[#FFFFFF]'
                  : 'text-[#161616] hover:bg-[#D7D5CF]'
              }`}
            >
              📷 GATE SCANNER
            </button>
            <button
              onClick={() => setCurrentView('ADMIN_EVENTS')}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                currentView === 'ADMIN_EVENTS'
                  ? 'bg-[#E8590C] text-[#FFFFFF]'
                  : 'text-[#161616] hover:bg-[#D7D5CF]'
              }`}
            >
              🗓️ CREATE EVENTS
            </button>
            <button
              onClick={() => setCurrentView('ADMIN_VENUE')}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                currentView === 'ADMIN_VENUE'
                  ? 'bg-[#E8590C] text-[#FFFFFF]'
                  : 'text-[#161616] hover:bg-[#D7D5CF]'
              }`}
            >
              ⚙️ VENUE BUILDER
            </button>
          </div>

          <span
            className={`px-2 py-1 text-[10px] font-bold tracking-widest uppercase border-2 border-[#161616] ${
              realtimeStatus === 'CONNECTED'
                ? 'bg-[#161616] text-[#E8590C]'
                : 'bg-[#E8590C] text-[#FFFFFF]'
            }`}
          >
            ● {realtimeStatus}
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1">
        {currentView === 'LANDING' && (
          <UserFrontPage
            onSelectEvent={handleSelectEventFromLanding}
            currentUser={currentUser}
            onLoginSuccess={(user) => setCurrentUser(user)}
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
                  {selectedEvent.title}
                </h2>
                <div className="text-xs text-[#555] font-bold mt-1 uppercase">
                  DATE: {new Date(selectedEvent.eventDate).toLocaleString()}
                </div>
              </div>

              {/* Event Switcher Selector */}
              <div className="flex items-center gap-2 bg-[#C8C5BD] p-2 border-2 border-[#161616]">
                <span className="text-xs font-bold text-[#555] uppercase">SWITCH EVENT:</span>
                <select
                  value={selectedEvent.id}
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

            {/* Seating Map & Cart Split */}
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

        {currentView === 'ADMIN_SCANNER' && <AdminScanner />}

        {currentView === 'ADMIN_VENUE' && (
          <AdminVenueBuilder
            venue={venue}
            onUpdateVenue={(updated) => setVenue(updated)}
          />
        )}

        {currentView === 'ADMIN_EVENTS' && (
          <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete text-[#161616] space-y-6 font-mono-spec">
            <RegistrationCrosses />

            <div className="pb-4 border-b-2 border-[#161616]">
              <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase mb-1">
                LOCATION: UNIVERSITY OF ABRA ARENA // MULTI-EVENT CREATION
              </div>
              <h2 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
                [ CREATE NEW ABRA ARENA EVENT ]
              </h2>
            </div>

            {eventCreateMsg && (
              <div className="p-3 bg-[#161616] text-[#E8590C] border-2 border-[#161616] text-xs font-bold">
                {eventCreateMsg}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                  EVENT TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University of Abra Intramurals 2026 Finals"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-[#C8C5BD] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                  EVENT DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the event hosted at the Abra Arena..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full bg-[#C8C5BD] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                  DATE & TIME
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full bg-[#C8C5BD] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#E8590C] hover:bg-[#161616] text-[#FFFFFF] font-anton text-base tracking-widest uppercase border-2 border-[#161616] shadow-concrete-sm transition-all"
              >
                PUBLISH ABRA ARENA EVENT →
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
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
      />
    </div>
  );
};
