'use client';

import React, { useState, useEffect } from 'react';
import { Event, UserProfile } from '@/types/seat-reservation';
import { RegistrationCrosses } from './RegistrationCrosses';

interface UserFrontPageProps {
  onSelectEvent: (event: Event) => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout?: () => void;
}

export const UserFrontPage: React.FC<UserFrontPageProps> = ({
  onSelectEvent,
  currentUser,
  onLoginSuccess,
  onLogout,
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
          setEvents(data.events);
        }
      } catch (err) {
        console.error(err);
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

  return (
    <div className="space-y-10 font-mono-spec">
      {/* University of Abra Arena Hero Landing Banner */}
      <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-8 md:p-12 shadow-concrete overflow-hidden">
        <RegistrationCrosses />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b-2 border-[#161616]">
          <div>
            <div className="text-xs text-[#E8590C] font-bold tracking-[0.25em] uppercase mb-1">
              OFFICIAL EVENT RESERVATION PORTAL
            </div>
            <h1 className="font-anton text-4xl md:text-6xl tracking-wider text-[#161616] uppercase">
              UNIVERSITY OF ABRA ARENA
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="p-3 bg-[#161616] text-[#D7D5CF] border-2 border-[#161616] text-xs">
                  <span className="text-[#E8590C] font-bold">LOGGED IN:</span> {currentUser.fullName} ({currentUser.email})
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-3 py-3 bg-[#8B0000] hover:bg-[#FF0000] text-[#FFFFFF] font-anton text-xs tracking-widest uppercase border-2 border-[#161616] transition-all"
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
                className="px-5 py-3 bg-[#E8590C] hover:bg-[#161616] text-[#FFFFFF] font-anton text-sm tracking-widest uppercase border-2 border-[#161616] shadow-concrete-sm transition-all"
              >
                STUDENT & VISITOR LOGIN // SIGNUP →
              </button>
            )}
          </div>
        </div>

        <p className="font-archivo text-base text-[#161616] max-w-3xl leading-relaxed">
          Welcome to the official seat reservation portal for the University of Abra Arena. Browse upcoming varsity games, cultural galas, and commencement exercises. Choose your seats and pay upon entry at the Arena gate scanner.
        </p>
      </div>

      {/* Upcoming Events Directory */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#161616]">
          <h2 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
            [ UPCOMING EVENTS AT ABRA ARENA ]
          </h2>
          <span className="text-xs text-[#E8590C] font-bold tracking-widest uppercase">
            PAYMENT GATEWAY: STRIPE ONLINE PAYMENT (CARD / GRABPAY)
          </span>
        </div>

        {events.length === 0 ? (
          <div className="p-12 bg-[#D7D5CF] border-3 border-[#161616] shadow-concrete text-center space-y-3">
            <div className="font-anton text-xl text-[#161616] uppercase">
              [ NO PUBLISHED EVENTS FOUND IN DATABASE ]
            </div>
            <div className="text-xs text-[#555] font-bold uppercase tracking-wider">
              No events have been published to the Supabase database yet. Use the Admin Console to publish new arena events.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete flex flex-col justify-between"
              >
                <RegistrationCrosses />

                <div>
                  <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase mb-1">
                    DATE: {new Date(evt.eventDate).toLocaleDateString()}
                  </div>
                  <h3 className="font-anton text-xl tracking-wider text-[#161616] uppercase mb-3">
                    {evt.title}
                  </h3>
                  <p className="font-archivo text-xs text-[#555] leading-relaxed mb-6">
                    {evt.description}
                  </p>
                </div>

                <div className="pt-4 border-t-2 border-[#161616] space-y-3">
                  <div className="text-[10px] text-[#161616] font-bold uppercase">
                    VENUE: UNIVERSITY OF ABRA ARENA
                  </div>
                  <button
                    onClick={() => onSelectEvent(evt)}
                    className="w-full py-3 bg-[#161616] hover:bg-[#E8590C] text-[#D7D5CF] hover:text-[#FFFFFF] font-anton text-sm tracking-widest uppercase border-2 border-[#161616] shadow-concrete-sm transition-all"
                  >
                    SELECT SEATS & RESERVE →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              USER ACCOUNT DIRECTORY
            </div>
            <h3 className="font-anton text-2xl tracking-wider uppercase mb-4 text-[#161616]">
              {authMode === 'LOGIN' ? 'USER LOGIN' : 'NEW ACCOUNT SIGNUP'}
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
