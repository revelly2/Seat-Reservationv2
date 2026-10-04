'use client';

import React, { useState, useEffect } from 'react';
import { Venue, Event } from '@/types/seat-reservation';
import { AdminVenueBuilder } from './AdminVenueBuilder';
import { AdminScanner } from './AdminScanner';
import { RegistrationCrosses } from './RegistrationCrosses';
import { UNIVERSITY_OF_ABRA_VENUE, MOCK_EVENTS } from '@/lib/mock-data';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SCANNER' | 'EVENTS' | 'VENUE' | 'AUDIT'>('SCANNER');
  const [venue, setVenue] = useState<Venue>(UNIVERSITY_OF_ABRA_VENUE);
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [allReservations, setAllReservations] = useState<any[]>([]);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [eventCreateMsg, setEventCreateMsg] = useState<string | null>(null);

  // Edit & Delete Event State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState<string>('UPCOMING');
  const [eventActionMsg, setEventActionMsg] = useState<string | null>(null);

  const refreshEvents = async () => {
    try {
      const evtRes = await fetch('/api/v1/events');
      const evtData = await evtRes.json();
      if (evtData.events && evtData.events.length > 0) {
        setEvents(evtData.events);
      }
    } catch (err) {
      console.error('Error refreshing events:', err);
    }
  };

  useEffect(() => {
    async function loadAdminData() {
      try {
        await refreshEvents();
      } catch (err) {
        console.error(err);
      }

      try {
        const resRes = await fetch('/api/v1/reservations');
        const resData = await resRes.json();
        if (resData.reservations) {
          setAllReservations(resData.reservations);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadAdminData();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventCreateMsg(null);
    setEventActionMsg(null);

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
        await refreshEvents();
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

  const startEditing = (evt: Event) => {
    setEditingEventId(evt.id);
    setEditTitle(evt.title);
    setEditDesc(evt.description);
    try {
      const d = new Date(evt.eventDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setEditDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    } catch {
      setEditDate('');
    }
    setEditStatus(evt.status || 'UPCOMING');
    setEventActionMsg(null);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventId) return;
    setEventActionMsg(null);

    try {
      const res = await fetch(`/api/v1/events/${editingEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          eventDate: editDate ? new Date(editDate).toISOString() : undefined,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEventActionMsg('✓ EVENT UPDATED SUCCESSFULLY!');
        setEditingEventId(null);
        await refreshEvents();
      } else {
        setEventActionMsg(`✖ ${data.error || 'Failed to update event'}`);
      }
    } catch (err) {
      setEventActionMsg('✖ Network error updating event');
    }
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete event "${title}"?`)) {
      return;
    }
    setEventActionMsg(null);

    try {
      const res = await fetch(`/api/v1/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'ADMIN',
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        setEventActionMsg('✓ EVENT DELETED SUCCESSFULLY!');
        if (editingEventId === eventId) {
          setEditingEventId(null);
        }
      } else {
        setEventActionMsg(`✖ ${data.error || 'Failed to delete event'}`);
      }
    } catch (err) {
      setEventActionMsg('✖ Network error deleting event');
    }
  };

  const technicalIndexProjects = [
    ['A-01', 'ADMIN ROLE', 'AUTHORIZED HIGH PRIVILEGE'],
    ['A-02', 'ARENA LOCATION', 'UNIVERSITY OF ABRA ARENA'],
    ['A-03', 'GATE VERIFICATION', 'REALTIME QR TICKET SCANNER'],
    ['A-04', 'PAYMENT AUDIT', 'ON-SITE CALCULATOR ACTIVE'],
  ];

  return (
    <div className="min-h-screen bg-concrete-grid text-[#161616] flex flex-col justify-between">
      {/* Dedicated Admin Header */}
      <header className="border-b-3 border-[#161616] bg-[#161616] text-[#D7D5CF] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono-spec">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-anton text-2xl tracking-widest uppercase text-[#D7D5CF]">
            SOTERO // ABRA ARENA ADMIN
          </span>
          <span className="text-[10px] tracking-widest uppercase text-[#FFFFFF] bg-[#E8590C] px-2.5 py-1 font-bold border border-[#FFFFFF]">
            🔑 ADMIN PRIVILEGES
          </span>
        </div>

        {/* Admin Navigation Tabs & Back to User Portal */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-[#2A2926] border-2 border-[#D7D5CF] p-1 gap-1">
            <button
              onClick={() => setActiveTab('SCANNER')}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                activeTab === 'SCANNER'
                  ? 'bg-[#E8590C] text-[#FFFFFF]'
                  : 'text-[#D7D5CF] hover:bg-[#3A3936]'
              }`}
            >
              📷 GATE SCANNER
            </button>
            <button
              onClick={() => setActiveTab('EVENTS')}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                activeTab === 'EVENTS'
                  ? 'bg-[#E8590C] text-[#FFFFFF]'
                  : 'text-[#D7D5CF] hover:bg-[#3A3936]'
              }`}
            >
              🗓️ EVENT MGMT
            </button>
            <button
              onClick={() => setActiveTab('VENUE')}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                activeTab === 'VENUE'
                  ? 'bg-[#E8590C] text-[#FFFFFF]'
                  : 'text-[#D7D5CF] hover:bg-[#3A3936]'
              }`}
            >
              ⚙️ VENUE BUILDER
            </button>
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                activeTab === 'AUDIT'
                  ? 'bg-[#E8590C] text-[#FFFFFF]'
                  : 'text-[#D7D5CF] hover:bg-[#3A3936]'
              }`}
            >
              📊 AUDIT LOGS ({allReservations.length})
            </button>
          </div>

          <a
            href="/"
            className="px-3 py-1.5 text-xs font-bold uppercase bg-[#D7D5CF] hover:bg-[#E8590C] text-[#161616] hover:text-[#FFFFFF] border-2 border-[#D7D5CF] transition-all"
          >
            ← USER PORTAL
          </a>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1">
        {activeTab === 'SCANNER' && <AdminScanner />}

        {activeTab === 'VENUE' && (
          <AdminVenueBuilder
            venue={venue}
            onUpdateVenue={(updated) => setVenue(updated)}
          />
        )}

        {activeTab === 'EVENTS' && (
          <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete text-[#161616] space-y-6 font-mono-spec">
            <RegistrationCrosses />

            <div className="pb-4 border-b-2 border-[#161616] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase mb-1">
                  LOCATION: UNIVERSITY OF ABRA ARENA // MULTI-EVENT MANAGEMENT
                </div>
                <h2 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
                  [ ABRA ARENA EVENTS DIRECTORY ]
                </h2>
              </div>
            </div>

            {eventCreateMsg && (
              <div className="p-3 bg-[#161616] text-[#E8590C] border-2 border-[#161616] text-xs font-bold">
                {eventCreateMsg}
              </div>
            )}

            {eventActionMsg && (
              <div className="p-3 bg-[#161616] text-[#E8590C] border-2 border-[#161616] text-xs font-bold">
                {eventActionMsg}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Event Creation Form */}
              <div className="lg:col-span-1 bg-[#C8C5BD] p-5 border-2 border-[#161616] space-y-4">
                <h3 className="font-anton text-lg tracking-wider text-[#161616] uppercase">
                  PUBLISH NEW EVENT
                </h3>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                      EVENT TITLE
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. University Intramurals Finals"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="w-full bg-[#D7D5CF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                      DESCRIPTION
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Event details..."
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                      className="w-full bg-[#D7D5CF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
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
                      className="w-full bg-[#D7D5CF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#E8590C] hover:bg-[#161616] text-[#FFFFFF] font-anton text-sm tracking-widest uppercase border-2 border-[#161616] shadow-concrete-sm transition-all"
                  >
                    PUBLISH EVENT →
                  </button>
                </form>
              </div>

              {/* Active Events List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-anton text-lg tracking-wider text-[#161616] uppercase">
                  PUBLISHED ARENA EVENTS ({events.length})
                </h3>

                <div className="space-y-3">
                  {events.length === 0 ? (
                    <div className="p-6 bg-[#C8C5BD] border-2 border-[#161616] text-center text-xs font-bold uppercase text-[#555]">
                      No events currently registered in database.
                    </div>
                  ) : (
                    events.map((evt) => {
                      const isEditing = editingEventId === evt.id;

                      if (isEditing) {
                        return (
                          <div
                            key={evt.id}
                            className="p-5 bg-[#D7D5CF] border-2 border-[#E8590C] shadow-concrete-sm space-y-4"
                          >
                            <div className="flex justify-between items-center border-b border-[#161616] pb-2">
                              <span className="font-anton text-sm tracking-wider uppercase text-[#E8590C]">
                                EDITING EVENT: {evt.id}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingEventId(null)}
                                className="text-xs font-bold uppercase text-[#161616] hover:text-[#E8590C]"
                              >
                                ✕ CANCEL
                              </button>
                            </div>

                            <form onSubmit={handleUpdateEvent} className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-[#161616] mb-1">
                                  EVENT TITLE
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full bg-[#FFFFFF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase text-[#161616] mb-1">
                                  DESCRIPTION
                                </label>
                                <textarea
                                  rows={2}
                                  required
                                  value={editDesc}
                                  onChange={(e) => setEditDesc(e.target.value)}
                                  className="w-full bg-[#FFFFFF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-[#161616] mb-1">
                                    DATE & TIME
                                  </label>
                                  <input
                                    type="datetime-local"
                                    required
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="w-full bg-[#FFFFFF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-[#161616] mb-1">
                                    STATUS
                                  </label>
                                  <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="w-full bg-[#FFFFFF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none"
                                  >
                                    <option value="UPCOMING">UPCOMING</option>
                                    <option value="ONGOING">ONGOING</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-[#E8590C] hover:bg-[#161616] text-[#FFFFFF] font-anton text-xs tracking-widest uppercase border-2 border-[#161616] transition-all"
                                >
                                  SAVE CHANGES ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingEventId(null)}
                                  className="px-4 py-2 bg-[#161616] hover:bg-[#555] text-[#D7D5CF] font-anton text-xs tracking-widest uppercase border-2 border-[#161616] transition-all"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </form>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={evt.id}
                          className="p-4 bg-[#C8C5BD] border-2 border-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
                              ID: {evt.id} // DATE: {new Date(evt.eventDate).toLocaleString()}
                            </div>
                            <div className="font-anton text-base text-[#161616] uppercase">
                              {evt.title}
                            </div>
                            <div className="text-xs text-[#555] font-bold">
                              {evt.description}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="px-2.5 py-1 bg-[#161616] text-[#D7D5CF] text-[10px] font-bold uppercase border border-[#161616]">
                              {evt.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditing(evt)}
                              className="px-3 py-1 bg-[#161616] hover:bg-[#E8590C] text-[#FFFFFF] text-xs font-bold uppercase border-2 border-[#161616] transition-all"
                            >
                              ✏️ EDIT
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(evt.id, evt.title)}
                              className="px-3 py-1 bg-[#8B0000] hover:bg-[#FF0000] text-[#FFFFFF] text-xs font-bold uppercase border-2 border-[#161616] transition-all"
                            >
                              🗑️ DELETE
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'AUDIT' && (
          <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete text-[#161616] space-y-6 font-mono-spec">
            <RegistrationCrosses />

            <div className="pb-4 border-b-2 border-[#161616] flex justify-between items-center">
              <div>
                <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase mb-1">
                  AUDIT LOGS // ON-SITE PAYMENTS & GATE VERIFICATION
                </div>
                <h2 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
                  [ ALL RESERVATIONS AUDIT ]
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#161616] text-[#D7D5CF] uppercase text-[10px] tracking-widest">
                    <th className="p-3 border border-[#161616]">TICKET REF</th>
                    <th className="p-3 border border-[#161616]">USER EMAIL</th>
                    <th className="p-3 border border-[#161616]">SEATS</th>
                    <th className="p-3 border border-[#161616]">ON-SITE FEE</th>
                    <th className="p-3 border border-[#161616]">PAYMENT STATUS</th>
                    <th className="p-3 border border-[#161616]">ENTRY STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {allReservations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#555] font-bold uppercase">
                        No reservation records in audit database yet.
                      </td>
                    </tr>
                  ) : (
                    allReservations.map((res) => (
                      <tr key={res.id} className="bg-[#C8C5BD] border-b border-[#161616]">
                        <td className="p-3 border border-[#161616] font-bold text-[#E8590C]">{res.id}</td>
                        <td className="p-3 border border-[#161616] font-bold">{res.userId}</td>
                        <td className="p-3 border border-[#161616] font-bold">{res.seatIds?.join(', ')}</td>
                        <td className="p-3 border border-[#161616] font-anton text-sm">${res.totalAmount?.toFixed(2)}</td>
                        <td className="p-3 border border-[#161616]">
                          <span className="px-2 py-0.5 bg-[#161616] text-[#E8590C] font-bold text-[10px]">
                            {res.paymentStatus || 'UNPAID'}
                          </span>
                        </td>
                        <td className="p-3 border border-[#161616]">
                          <span className="px-2 py-0.5 bg-[#E8590C] text-[#FFFFFF] font-bold text-[10px]">
                            {res.checkInStatus || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#161616] text-[#D7D5CF] border-t-3 border-[#161616] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 font-mono-spec mt-8">
        {technicalIndexProjects.map(([idx, name, meta]) => (
          <div
            key={idx}
            className="p-4 border-b sm:border-b-0 sm:border-r border-[#D7D5CF]/20 last:border-r-0"
          >
            <div className="text-[10px] tracking-widest text-[#E8590C] font-bold">
              {idx}
            </div>
            <div className="font-anton text-sm tracking-wider text-[#D7D5CF] uppercase mt-1">
              {name}
            </div>
            <div className="text-[10px] tracking-widest text-[#888] mt-1 uppercase">
              {meta}
            </div>
          </div>
        ))}
      </footer>
    </div>
  );
};
