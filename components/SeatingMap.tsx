'use client';

import React, { useState } from 'react';
import { Seat, Section } from '@/types/seat-reservation';
import { RegistrationCrosses } from './RegistrationCrosses';

interface SeatingMapProps {
  seats: Seat[];
  sections: Section[];
  selectedSeatIds: string[];
  onToggleSeat: (seat: Seat) => void;
  filterSectionId?: string;
}

export const SeatingMap: React.FC<SeatingMapProps> = ({
  seats,
  sections,
  selectedSeatIds,
  onToggleSeat,
  filterSectionId,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const getSeatFill = (seat: Seat) => {
    const isSelected = selectedSeatIds.includes(seat.id);
    if (isSelected) return '#FFFFFF';
    if (seat.status === 'BOOKED') return '#161616';
    if (seat.status === 'HELD') return '#E8590C';
    if (seat.status === 'MAINTENANCE') return '#A5A39B';

    if (seat.sectionId === 'sec-vip') return '#E8590C';
    if (seat.sectionId === 'sec-orchestra') return '#3A3936';
    return '#8F8D86';
  };

  const getSeatTextColor = (seat: Seat) => {
    const isSelected = selectedSeatIds.includes(seat.id);
    if (isSelected) return '#161616';
    return '#FFFFFF';
  };

  const rows = Array.from(new Set(seats.map((s) => s.rowLabel))).sort();

  return (
    <div className="relative w-full bg-[#C8C5BD] border-3 border-[#161616] shadow-concrete flex flex-col select-none overflow-hidden">
      <RegistrationCrosses />

      {/* Distinct Plan Header Bar */}
      <div className="w-full bg-[#161616] text-[#D7D5CF] py-3 px-6 flex flex-wrap items-center justify-between gap-2 z-10 border-b-3 border-[#161616] font-mono-spec">
        <div className="text-[11px] tracking-widest uppercase text-[#E8590C] font-bold">
          SPECIFICATION // PLAN VIEW
        </div>
        <div className="font-anton text-lg tracking-widest text-[#D7D5CF] uppercase">
          STAGE // PODIUM
        </div>
        <div className="text-[11px] tracking-widest uppercase text-[#D7D5CF] font-bold">
          SCALE 1:50
        </div>
      </div>

      {/* Map Interactive Canvas */}
      <div
        className="relative h-[480px] cursor-grab active:cursor-grabbing bg-concrete-grid overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="w-full h-full" viewBox="0 0 900 440">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Stage Arch */}
            <path
              d="M 140 30 Q 450 4 760 30"
              fill="none"
              stroke="#161616"
              strokeWidth="3"
              strokeDasharray="6 6"
            />

            {/* Grid Seats */}
            {rows.map((rowLabel, rIdx) => {
              const rowSeats = seats
                .filter((s) => s.rowLabel === rowLabel)
                .sort((a, b) => a.seatNumber - b.seatNumber);

              const yPos = 64 + rIdx * 46;

              return (
                <g key={rowLabel}>
                  {/* Left & Right Row Labels */}
                  <text
                    x={60}
                    y={yPos + 20}
                    fill="#161616"
                    fontSize="13"
                    fontFamily="IBM Plex Mono, monospace"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    [{rowLabel}]
                  </text>
                  <text
                    x={840}
                    y={yPos + 20}
                    fill="#161616"
                    fontSize="13"
                    fontFamily="IBM Plex Mono, monospace"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    [{rowLabel}]
                  </text>

                  {rowSeats.map((seat) => {
                    const isFilteredOut =
                      filterSectionId && filterSectionId !== 'ALL' && seat.sectionId !== filterSectionId;
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isAvailable = seat.status === 'AVAILABLE';
                    const xPos = 110 + (seat.seatNumber - 1) * 74;

                    return (
                      <g
                        key={seat.id}
                        transform={`translate(${xPos}, ${yPos})`}
                        className={`transition-opacity duration-150 ${
                          isFilteredOut ? 'opacity-20' : 'opacity-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAvailable || isSelected) {
                            onToggleSeat(seat);
                          }
                        }}
                        onMouseEnter={() => setHoveredSeat(seat)}
                        onMouseLeave={() => setHoveredSeat(null)}
                      >
                        {/* Shadow Box for Selected Seats */}
                        {isSelected && (
                          <rect
                            x="3"
                            y="3"
                            width="34"
                            height="30"
                            fill="#161616"
                          />
                        )}
                        {/* Seat Block */}
                        <rect
                          x="0"
                          y="0"
                          width="34"
                          height="30"
                          fill={getSeatFill(seat)}
                          stroke="#161616"
                          strokeWidth={isSelected ? '3' : '2'}
                          className={`cursor-pointer ${
                            isAvailable ? 'hover:-translate-y-0.5' : ''
                          }`}
                        />
                        {/* Seat Number */}
                        <text
                          x="17"
                          y="19"
                          fill={getSeatTextColor(seat)}
                          fontSize="12"
                          fontFamily="IBM Plex Mono, monospace"
                          fontWeight="700"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          {seat.seatNumber}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Tooltip */}
        {hoveredSeat && (
          <div className="absolute top-4 left-4 bg-[#161616] text-[#D7D5CF] border-2 border-[#161616] p-3 text-xs shadow-concrete z-20 pointer-events-none font-mono-spec">
            <div className="font-anton text-sm text-[#E8590C] tracking-widest uppercase mb-1">
              SEAT // {hoveredSeat.rowLabel}-{hoveredSeat.seatNumber}
            </div>
            <div>SECTION: <span className="font-bold text-[#D7D5CF]">{hoveredSeat.sectionId}</span></div>
            <div>STATUS: <span className="font-bold text-[#E8590C] uppercase">{hoveredSeat.status}</span></div>
          </div>
        )}
      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-[#D7D5CF] border-2 border-[#161616] p-1.5 shadow-concrete z-10 font-mono-spec">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2.0))}
          className="w-8 h-8 flex items-center justify-center bg-[#161616] text-[#D7D5CF] hover:bg-[#E8590C] font-bold text-base transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
          className="w-8 h-8 flex items-center justify-center bg-[#161616] text-[#D7D5CF] hover:bg-[#E8590C] font-bold text-base transition-colors"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="px-3 h-8 bg-[#161616] text-[#D7D5CF] hover:bg-[#E8590C] text-[11px] font-bold uppercase transition-colors"
        >
          RESET
        </button>
      </div>
    </div>
  );
};
