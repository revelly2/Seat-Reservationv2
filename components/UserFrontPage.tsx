'use client';

import React, { useState, useEffect } from 'react';
import { Event, Section, UserProfile } from '@/types/seat-reservation';
import { ARENA_LAYOUT, ARENA_SECTIONS } from '@/lib/mock-data';
import { RegistrationCrosses } from './RegistrationCrosses';
import {
  ArenaArchitecturalIsometric,
  TurnstileGateVectorIllustration,
  SeatSelectionHoldVector,
  ArenaAtmosphereFanVector,
} from './UserHomeVectorGraphics';
import {
  HumanScanningGate,
  HumanWalkingPhone,
  HumanSeatedSpectator,
  HumanCheeringFan,
  HumanScaleDimensionBox,
} from './ArchitecturalHumanVectors';

interface UserFrontPageProps {
  onSelectEvent: (event: Event) => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout?: () => void;
  sections?: Section[];
}

// Price groups of the MASTER SEAT PLAN blocks shown on the landing page.
const SEATING_GROUPS = [
  { tag: 'COURTSIDE', tagClass: 'bg-[#E8590C] text-[#FFFFFF]', title: 'VIP', blocks: ['VIP'],
    points: ['Center sideline, rows A–I', 'Premium courtside view'], location: 'SIDELINE // OPPOSITE BLK 2' },
  { tag: 'SIDELINE', tagClass: 'bg-[#161616] text-[#D7D5CF]', title: 'BLK 2', blocks: ['BLK2'],
    points: ['Center sideline facing VIP', 'Full-court view'], location: 'SIDELINE // CENTER' },
  { tag: 'CORNERS', tagClass: 'bg-[#3E9B4F] text-[#FFFFFF]', title: 'BLK 1 · 3 · 5 · 6', blocks: ['BLK1', 'BLK3', 'BLK5', 'BLK6'],
    points: ['Wraparound corner stands', 'Largest seating area'], location: 'CORNERS // ROWS A–I' },
  { tag: 'END STANDS', tagClass: 'bg-[#3F5FC8] text-[#FFFFFF]', title: 'BLK 4 · 7', blocks: ['BLK4', 'BLK7'],
    points: ['Behind the baskets', 'Lowest price'], location: 'COURT ENDS' },
];

export const UserFrontPage: React.FC<UserFrontPageProps> = ({
  onSelectEvent,
  currentUser,
  onLoginSuccess,
  onLogout,
  sections = ARENA_SECTIONS,
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/v1/events');
        const data = await res.json();
        if (data.events) {
          const now = Date.now();
          const upcoming = data.events.filter((evt: Event) => {
            const isPast = new Date(evt.eventDate).getTime() < now;
            return !isPast && evt.status !== 'ARCHIVED' && evt.status !== 'CANCELLED' && evt.status !== 'COMPLETED';
          });
          setEvents(upcoming);
        }
      } catch (err) {
        console.error('Error loading events:', err);
      }
    }

    loadEvents();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!email || !password) {
      setAuthError('Email and Password are required.');
      return;
    }

    if (authMode === 'SIGNUP') {
      if (!fullName) {
        setAuthError('Full Name is required for registration.');
        return;
      }
      try {
        const res = await fetch('/api/v1/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName, studentId, password }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setAuthSuccess(data.message);
          onLoginSuccess(data.user);
          setTimeout(() => setIsAuthModalOpen(false), 1000);
        } else {
          setAuthError(data.error || 'Registration failed');
        }
      } catch (err: any) {
        setAuthError('Network error during registration');
      }
    } else {
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setAuthSuccess('Authentication successful! Logging in...');
          onLoginSuccess(data.user);
          setTimeout(() => setIsAuthModalOpen(false), 800);
        } else {
          setAuthError(data.error || 'Invalid email or password');
        }
      } catch (err: any) {
        setAuthError('Network error during login');
      }
    }
  };

  const scrollToEvents = () => {
    const el = document.getElementById('upcoming-events-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 font-mono-spec">
      {/* 1. Hero Landing Section with Arena Isometric Vector Diagram */}
      <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 md:p-10 shadow-concrete overflow-hidden">
        <RegistrationCrosses />

        {/* Top Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-[#161616]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8590C] animate-pulse" />
            <span className="text-[11px] text-[#E8590C] font-bold tracking-[0.25em] uppercase">
              OFFICIAL ARENA SEAT RESERVATION SYSTEM // UNIVERSITY OF ABRA
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 bg-[#161616] text-[#D7D5CF] border-2 border-[#161616] text-xs font-bold">
                  <span className="text-[#E8590C]">LOGGED IN:</span> {currentUser.fullName} ({currentUser.email})
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-3 py-2 bg-[#8B0000] hover:bg-[#FF0000] text-[#FFFFFF] font-anton text-xs tracking-widest uppercase border-2 border-[#161616] transition-all"
                  >
                    LOG OUT
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('LOGIN');
                  setAuthError(null);
                  setAuthSuccess(null);
                  setIsAuthModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#E8590C] hover:bg-[#161616] text-[#FFFFFF] font-anton text-xs md:text-sm tracking-widest uppercase border-2 border-[#161616] shadow-concrete-sm transition-all"
              >
                LOG IN / SIGN UP →
              </button>
            )}
          </div>
        </div>

        {/* Hero Split Layout: Typography Left, Architectural Isometric Vector Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-block px-2.5 py-1 bg-[#161616] text-[#D7D5CF] text-[10px] font-bold uppercase tracking-widest">
              [ CAMPUS FACILITY // CODE: UA-ARENA-01 ]
            </div>

            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl tracking-wider text-[#161616] uppercase leading-tight">
              RESERVE YOUR ARENA SEAT IN REAL TIME.
            </h1>

            <p className="font-archivo text-sm md:text-base text-[#161616] leading-relaxed max-w-xl">
              Experience championship varsity sports, commencement ceremonies, and cultural galas at the University of Abra Arena. Pick your exact seat across 8 blocks and 1,854 seats, from courtside VIP to the end stands, with instant contactless turnstile admission.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={scrollToEvents}
                className="px-6 py-3.5 bg-[#161616] hover:bg-[#E8590C] text-[#FFFFFF] font-anton text-sm md:text-base tracking-widest uppercase border-2 border-[#161616] shadow-concrete-sm transition-all flex items-center gap-2"
              >
                <span>VIEW ARENA EVENTS & TICKETS ↓</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-[#555] uppercase">
                <span className="w-2 h-2 rounded-full bg-[#2ECC40]" />
                <span>1,854 SEATS MONITORED // LIVE SUPABASE SYNC</span>
              </div>
            </div>

            {/* Spec Index Tags */}
            <div className="pt-4 border-t border-[#161616]/20 flex flex-wrap gap-4 text-[10px] font-bold uppercase text-[#555]">
              <span>SEATING: 8 BLOCKS</span>
              <span>•</span>
              <span>BARRIER SCAN: OPTICAL QR</span>
            </div>
          </div>

          {/* Right Vector Illustration Card: Isometric Arena Cutaway */}
          <div className="lg:col-span-6 bg-[#C8C5BD] border-3 border-[#161616] p-4 shadow-concrete relative group">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161616]/30 text-[9px] font-bold uppercase tracking-wider text-[#555]">
              <span>[ FIG-01: ARCHITECTURAL ISOMETRIC CUTAWAY ]</span>
              <span className="text-[#E8590C]">BANGUED, ABRA // LAT 17.5959° N</span>
            </div>

            {/* Isometric SVG Illustration */}
            <ArenaArchitecturalIsometric accentColor="#E8590C" />

            <div className="pt-2 mt-2 border-t border-[#161616]/30 flex justify-between items-center text-[8px] font-bold uppercase text-[#444]">
              <span>CONCOURSE LEVEL: ±0.00m</span>
              <span>VIP & COURTSIDE RING</span>
              <span>UPPER GRANDSTAND: +4.80m</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Three-Step Reservation Protocol with Modernist Vector Graphics */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#161616]">
          <div>
            <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase mb-0.5">
              SYSTEM ARCHITECTURE // SPECTATOR WORKFLOW
            </div>
            <h2 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
              [ HOW ARENA RESERVATION WORKS ]
            </h2>
          </div>
          <span className="text-xs text-[#555] font-bold uppercase">
            3-STEP CONTACTLESS PROTOCOL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Interactive Tier Selection */}
          <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete flex flex-col justify-between space-y-4">
            <RegistrationCrosses />
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-1 bg-[#161616] text-[#D7D5CF] text-[10px] font-bold uppercase">
                  STEP 01
                </span>
                <span className="text-[10px] text-[#E8590C] font-bold uppercase">SELECT COORDS</span>
              </div>

              <div className="bg-[#C8C5BD] border-2 border-[#161616] p-3 overflow-hidden">
                <SeatSelectionHoldVector accentColor="#E8590C" />
              </div>

              <h3 className="font-anton text-lg tracking-wider text-[#161616] uppercase">
                INTERACTIVE MAP SELECTION
              </h3>
              <p className="font-archivo text-xs text-[#555] leading-relaxed">
                Tap a block on the arena map, zoom in, and choose your exact seats across 8 blocks with real-time availability updates.
              </p>
            </div>
            <div className="pt-3 border-t border-[#161616]/30 text-[10px] font-bold text-[#161616] uppercase">
              • SECTION PRICING: ₱75 TO ₱250
            </div>
          </div>

          {/* Step 2: Pay to Reserve */}
          <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete flex flex-col justify-between space-y-4">
            <RegistrationCrosses />
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-1 bg-[#E8590C] text-[#FFFFFF] text-[10px] font-bold uppercase">
                  STEP 02
                </span>
                <span className="text-[10px] text-[#161616] font-bold uppercase">PAY TO RESERVE</span>
              </div>

              <div className="bg-[#C8C5BD] border-2 border-[#161616] p-3 flex items-center justify-center min-h-[140px]">
                <div className="text-center space-y-2">
                  <div className="inline-block p-3 bg-[#161616] border-2 border-[#161616]">
                    <div className="font-anton text-3xl text-[#2ECC40] tracking-widest">
                      PAID ✓
                    </div>
                  </div>
                  <div className="text-[9px] font-bold uppercase text-[#161616]">
                    STRIPE SECURE CHECKOUT
                  </div>
                  <div className="text-[8px] text-[#555] font-bold uppercase">
                    SEATS RESERVED ONCE PAYMENT CLEARS
                  </div>
                </div>
              </div>

              <h3 className="font-anton text-lg tracking-wider text-[#161616] uppercase">
                PAY &amp; RESERVE
              </h3>
              <p className="font-archivo text-xs text-[#555] leading-relaxed">
                Pay online with your card. Your seats are reserved the moment payment succeeds, and seats someone else has already reserved cannot be booked again.
              </p>
            </div>
            <div className="pt-3 border-t border-[#161616]/30 text-[10px] font-bold text-[#161616] uppercase">
              • STRIPE & ON-SITE PAYMENT READY
            </div>
          </div>

          {/* Step 3: Contactless Gate Admission */}
          <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete flex flex-col justify-between space-y-4">
            <RegistrationCrosses />
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-1 bg-[#2ECC40] text-[#161616] text-[10px] font-bold uppercase">
                  STEP 03
                </span>
                <span className="text-[10px] text-[#2ECC40] font-bold bg-[#161616] px-1.5 py-0.5 uppercase">
                  FAST PASS
                </span>
              </div>

              <div className="bg-[#C8C5BD] border-2 border-[#161616] p-3 overflow-hidden">
                <TurnstileGateVectorIllustration accentColor="#E8590C" />
              </div>

              <h3 className="font-anton text-lg tracking-wider text-[#161616] uppercase">
                OPTICAL TURNSTILE PASSAGE
              </h3>
              <p className="font-archivo text-xs text-[#555] leading-relaxed">
                Present your digital QR ticket pass directly from your phone at the Arena turnstile. The ESP32 optical scanner verifies credentials and unlatches the barrier.
              </p>
            </div>
            <div className="pt-3 border-t border-[#161616]/30 text-[10px] font-bold text-[#161616] uppercase">
              • HARDWARE PASSAGE: 0.8s CYCLE
            </div>
          </div>
        </div>
      </div>

      {/* 3. Seating Tiers Showcase with Minimalist Vector Spectators */}
      <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 md:p-8 shadow-concrete space-y-6">
        <RegistrationCrosses />
        <div className="pb-4 border-b-2 border-[#161616] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase mb-0.5">
              ARENA BOWL SPECIFICATION // SEATING MATRIX
            </div>
            <h2 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
              [ CHOOSE YOUR ARENA EXPERIENCE ]
            </h2>
          </div>
          <div className="text-xs font-bold text-[#555] uppercase">
            TOTAL SEATS: 1,854 // 8 BLOCKS
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {SEATING_GROUPS.map((group, gi) => {
            const idx = group.blocks.map((code) => ARENA_LAYOUT.blocks.findIndex((b) => b.code === code));
            const prices = idx.map((i) => sections[i]?.basePrice ?? ARENA_LAYOUT.blocks[i].defaultPrice);
            const seatCount = ARENA_LAYOUT.seats.filter((seat) => idx.includes(seat[0] as number)).length;
            const minPrice = Math.min(...prices);
            const Icon = [HumanSeatedSpectator, HumanWalkingPhone, HumanCheeringFan, HumanWalkingPhone][gi];
            return (
              <div key={group.title} className="bg-[#C8C5BD] border-2 border-[#161616] p-5 flex flex-col justify-between space-y-4 shadow-concrete-sm">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${group.tagClass}`}>
                        {group.tag}
                      </span>
                      <h3 className="font-anton text-xl text-[#161616] uppercase mt-1">
                        {group.title}
                      </h3>
                    </div>
                    <Icon size={54} color="#161616" accentColor="#E8590C" />
                  </div>

                  <div className="font-anton text-2xl text-[#161616]">
                    {prices.some((p) => p !== minPrice) ? 'FROM ' : ''}₱{minPrice.toFixed(2)}{' '}
                    <span className="font-mono text-xs font-bold text-[#555]">/ SEAT</span>
                  </div>

                  <ul className="text-xs space-y-2 text-[#333] font-bold">
                    <li className="flex items-center gap-2">
                      <span className="text-[#E8590C]">✓</span> {seatCount.toLocaleString()} Seats Total
                    </li>
                    {group.points.map((point) => (
                      <li key={point} className="flex items-center gap-2">
                        <span className="text-[#E8590C]">✓</span> {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-[#161616]/30 text-[10px] font-bold text-[#555] uppercase">
                  LOCATION: {group.location}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Upcoming Events Directory */}
      <div id="upcoming-events-section" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#161616]">
          <div>
            <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase mb-0.5">
              SCHEDULED FIXTURES // UNIVERSITY CALENDAR
            </div>
            <h2 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
              [ UPCOMING EVENTS AT ABRA ARENA ]
            </h2>
          </div>
          <span className="text-xs text-[#E8590C] font-bold tracking-widest uppercase bg-[#161616] px-2.5 py-1">
            ONLINE STRIPE & ON-SITE CASH ACCEPTED
          </span>
        </div>

        {events.length === 0 ? (
          <div className="p-12 bg-[#D7D5CF] border-3 border-[#161616] shadow-concrete text-center space-y-4">
            <div className="flex justify-center">
              <HumanWalkingPhone size={64} color="#161616" accentColor="#E8590C" />
            </div>
            <div className="font-anton text-xl text-[#161616] uppercase">
              [ NO PUBLISHED EVENTS FOUND IN DATABASE ]
            </div>
            <div className="text-xs text-[#555] font-bold uppercase tracking-wider max-w-md mx-auto">
              No events have been published to the database yet. New fixtures will appear here once published via the Arena Admin Console.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete flex flex-col justify-between group hover:border-[#E8590C] transition-all"
              >
                <RegistrationCrosses />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-[#161616] text-[#D7D5CF] text-[9px] font-bold uppercase">
                      UA-EVENT
                    </span>
                    <span className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
                      {new Date(evt.eventDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="font-anton text-2xl tracking-wider text-[#161616] uppercase leading-tight group-hover:text-[#E8590C] transition-colors">
                    {evt.title}
                  </h3>

                  <p className="font-archivo text-xs text-[#555] leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="p-2.5 bg-[#C8C5BD] border border-[#161616] text-[10px] font-bold text-[#161616] uppercase flex items-center justify-between">
                    <span>VENUE: ABRA ARENA BOWL</span>
                    <span className="text-[#E8590C]">STATUS: {evt.status}</span>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t-2 border-[#161616] space-y-3">
                  <button
                    onClick={() => onSelectEvent(evt)}
                    className="w-full py-3.5 bg-[#161616] hover:bg-[#E8590C] text-[#D7D5CF] hover:text-[#FFFFFF] font-anton text-sm tracking-widest uppercase border-2 border-[#161616] shadow-concrete-sm transition-all flex items-center justify-center gap-2"
                  >
                    <span>SELECT SEATS & RESERVE →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Modernist Architectural Human Dimension Reference Strip */}
      <HumanScaleDimensionBox
        label="ARENA AUDIENCE ENTOURAGE // SCALE 1:50"
        metric="1.78m ERGONOMIC CLEARANCE // 80 SEAT ARENA BOWL"
        heightMm={85}
      />

      {/* User Login & Signup Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-[#161616]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative bg-[#D7D5CF] border-3 border-[#161616] max-w-md w-full p-6 shadow-concrete-lg text-[#161616]">
            <RegistrationCrosses />

            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-[#161616] hover:text-[#E8590C] font-bold text-xl uppercase"
            >
              [✕]
            </button>

            <div className="text-[10px] text-[#E8590C] tracking-widest font-bold uppercase mb-1">
              STUDENTS, VISITORS & ADMINS
            </div>
            <h3 className="font-anton text-2xl tracking-wider uppercase mb-4 text-[#161616]">
              {authMode === 'LOGIN' ? 'LOG IN' : 'NEW ACCOUNT SIGNUP'}
            </h3>

            {authError && (
              <div className="p-3 bg-[#E8590C] text-[#FFFFFF] border-2 border-[#161616] text-xs font-bold mb-4">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-[#161616] text-[#E8590C] border-2 border-[#161616] text-xs font-bold mb-4">
                {authSuccess}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@abra.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#C8C5BD] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#C8C5BD] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>

              {authMode === 'SIGNUP' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                      FULL NAME
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Juan Dela Cruz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#C8C5BD] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                      STUDENT / VISITOR ID NUMBER
                    </label>
                    <input
                      type="text"
                      placeholder="2026-UA-0012"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full bg-[#C8C5BD] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                    />
                  </div>
                </>
              )}

              <div className="p-2 bg-[#C8C5BD] border border-[#161616] text-[10px] text-[#555] font-bold uppercase">
                POLICY: Strictly 1 account limit per user to prevent duplicate seat hoarding.
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#E8590C] hover:bg-[#161616] text-[#FFFFFF] font-anton text-base tracking-widest uppercase border-2 border-[#161616] shadow-concrete-sm transition-all"
              >
                {authMode === 'LOGIN' ? 'AUTHENTICATE & LOG IN →' : 'REGISTER SINGLE USER ACCOUNT →'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-[#161616]/30 text-center">
              {authMode === 'LOGIN' ? (
                <button
                  onClick={() => setAuthMode('SIGNUP')}
                  className="text-xs text-[#161616] hover:text-[#E8590C] font-bold uppercase"
                >
                  Need an account? Register (1 Account Per User Limit)
                </button>
              ) : (
                <button
                  onClick={() => setAuthMode('LOGIN')}
                  className="text-xs text-[#161616] hover:text-[#E8590C] font-bold uppercase"
                >
                  Already have an account? Log In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
