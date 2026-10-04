'use client';

import React, { useState } from 'react';
import { Section, Venue } from '@/types/seat-reservation';
import { RegistrationCrosses } from './RegistrationCrosses';

interface AdminVenueBuilderProps {
  venue: Venue;
  onUpdateVenue: (updated: Venue) => void;
}

export const AdminVenueBuilder: React.FC<AdminVenueBuilderProps> = ({
  venue,
  onUpdateVenue,
}) => {
  const [role, setRole] = useState<'ADMIN' | 'USER'>('ADMIN');
  const [venueName, setVenueName] = useState(venue.name);
  const [rows, setRows] = useState(venue.layoutConfig.rows);
  const [cols, setCols] = useState(venue.layoutConfig.columns);
  const [sections, setSections] = useState<Section[]>(venue.layoutConfig.sections);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handlePriceChange = (sectionId: string, newPrice: number) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, basePrice: newPrice } : s))
    );
  };

  const handleSaveLayout = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch('/api/v1/admin/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role,
        },
        body: JSON.stringify({
          name: venueName,
          rows,
          columns: cols,
          sections,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus('✓ VENUE SPECIFICATIONS UPDATED SUCCESSFULLY');
        onUpdateVenue(data.venue);
      } else {
        setSaveStatus(`✖ ${data.error || 'FAILED TO UPDATE SPECIFICATIONS'}`);
      }
    } catch (err: any) {
      setSaveStatus('✖ NETWORK ERROR UPDATING SPECIFICATIONS');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete text-[#161616] space-y-6 font-mono-spec">
      <RegistrationCrosses />

      {/* RBAC Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b-2 border-[#161616] gap-4">
        <div>
          <div className="text-[10px] text-[#E8590C] tracking-[0.25em] font-bold uppercase mb-1">
            SPECIFICATION // DATASHEET EDITOR
          </div>
          <h2 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
            [02 / CONSOLE & PRICING SPEC]
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-[#C8C5BD] p-1.5 border-2 border-[#161616]">
          <span className="text-[11px] font-bold text-[#555] uppercase pr-2">ROLE:</span>
          <button
            onClick={() => setRole('ADMIN')}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
              role === 'ADMIN'
                ? 'bg-[#E8590C] text-[#FFFFFF] border-2 border-[#161616]'
                : 'bg-transparent text-[#161616] hover:bg-[#D7D5CF]'
            }`}
          >
            🔑 ADMIN
          </button>
          <button
            onClick={() => setRole('USER')}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
              role === 'USER'
                ? 'bg-[#161616] text-[#D7D5CF] border-2 border-[#161616]'
                : 'bg-transparent text-[#161616] hover:bg-[#D7D5CF]'
            }`}
          >
            👤 USER
          </button>
        </div>
      </div>

      {saveStatus && (
        <div
          className={`p-3 text-xs font-bold border-2 border-[#161616] ${
            saveStatus.startsWith('✓')
              ? 'bg-[#161616] text-[#E8590C]'
              : 'bg-[#E8590C] text-[#FFFFFF]'
          }`}
        >
          {saveStatus}
        </div>
      )}

      {/* Grid Settings & Capacity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#C8C5BD] p-5 border-2 border-[#161616] space-y-4">
          <h3 className="font-anton text-base tracking-wider uppercase text-[#161616]">
            VENUE IDENTITY
          </h3>
          <div>
            <label className="block text-xs font-bold text-[#555] uppercase mb-1">NAME</label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className="w-full bg-[#D7D5CF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#555] uppercase mb-1">ROWS</label>
              <input
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                className="w-full bg-[#D7D5CF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#555] uppercase mb-1">COLS</label>
              <input
                type="number"
                min="1"
                max="20"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                className="w-full bg-[#D7D5CF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
              />
            </div>
          </div>
        </div>

        {/* Section Tier Pricing Builder */}
        <div className="md:col-span-2 bg-[#C8C5BD] p-5 border-2 border-[#161616] space-y-4">
          <h3 className="font-anton text-base tracking-wider uppercase text-[#161616]">
            PRICING TIER OVERRIDES
          </h3>
          <div className="space-y-3">
            {sections.map((sec) => (
              <div
                key={sec.id}
                className="flex items-center justify-between p-3 bg-[#D7D5CF] border-2 border-[#161616]"
              >
                <div>
                  <div className="font-bold text-[#161616] text-xs uppercase">{sec.name}</div>
                  <div className="text-[10px] text-[#555]">ID: {sec.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#161616] font-bold text-xs">₱</span>
                  <input
                    type="number"
                    step="5"
                    value={sec.basePrice}
                    onChange={(e) => handlePriceChange(sec.id, parseFloat(e.target.value) || 0)}
                    className="w-24 bg-[#FFFFFF] border-2 border-[#161616] px-3 py-1 text-xs font-anton text-[#161616] focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={handleSaveLayout}
          disabled={isSaving}
          className="px-6 py-3 bg-[#E8590C] hover:bg-[#161616] text-[#FFFFFF] font-anton text-base tracking-widest uppercase border-2 border-[#161616] shadow-concrete-sm transition-all"
        >
          {isSaving ? 'SAVING SPECIFICATIONS...' : 'SAVE VENUE SPECIFICATIONS'}
        </button>
      </div>
    </div>
  );
};
