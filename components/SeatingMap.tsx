'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Seat, Section } from '@/types/seat-reservation';
import { ARENA_LAYOUT } from '@/lib/mock-data';
import { RegistrationCrosses } from './RegistrationCrosses';

interface SeatingMapProps {
  seats: Seat[];
  sections: Section[];
  selectedSeatIds: string[];
  onToggleSeat: (seat: Seat) => void;
  // 'ALL' shows the whole arena; a section id zooms into that block.
  filterSectionId?: string;
  onSelectBlock?: (sectionId: string) => void;
}

type Box = { x: number; y: number; w: number; h: number };

const blockColor = (sections: Section[], sectionId: string) =>
  ARENA_LAYOUT.blocks[sections.findIndex((s) => s.id === sectionId)]?.color || '#8F8D86';

export const SeatingMap: React.FC<SeatingMapProps> = ({
  seats,
  sections,
  selectedSeatIds,
  onToggleSeat,
  filterSectionId = 'ALL',
  onSelectBlock,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const activeBlock = filterSectionId !== 'ALL' ? filterSectionId : null;
  const selected = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);

  // Per-block bounds, centroid and availability for the overview labels and zoom target.
  const blocks = useMemo(() => {
    return sections.map((sec) => {
      const own = seats.filter((s) => s.sectionId === sec.id && s.x !== undefined);
      const xs = own.map((s) => s.x as number);
      const ys = own.map((s) => s.y as number);
      const box: Box = own.length
        ? { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
        : { x: 0, y: 0, w: 0, h: 0 };
      return {
        section: sec,
        box,
        cx: xs.reduce((a, b) => a + b, 0) / (xs.length || 1),
        cy: ys.reduce((a, b) => a + b, 0) / (ys.length || 1),
        available: own.filter((s) => s.status === 'AVAILABLE').length,
      };
    });
  }, [seats, sections]);

  const base: Box = useMemo(() => {
    const b = activeBlock ? blocks.find((x) => x.section.id === activeBlock)?.box : null;
    if (!b) return { x: 0, y: 0, w: ARENA_LAYOUT.width, h: ARENA_LAYOUT.height };
    const pad = 16;
    return { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 };
  }, [activeBlock, blocks]);

  // On narrow screens, open a block zoomed in so seats (~8.5 plan units apart) are at least ~18px apart for tapping.
  useEffect(() => {
    const width = svgRef.current?.clientWidth;
    if (!activeBlock || !width) return;
    setPan({ x: 0, y: 0 });
    setZoom(Math.min(4, Math.max(1, 18 / (8.5 * (width / base.w)))));
  }, [activeBlock, base.w]);

  const view: Box = {
    w: base.w / zoom,
    h: base.h / zoom,
    x: base.x + (base.w - base.w / zoom) / 2 - pan.x,
    y: base.y + (base.h - base.h / zoom) / 2 - pan.y,
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const selectBlock = (id: string) => {
    resetView();
    onSelectBlock?.(id);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || zoom === 1 || !svgRef.current) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    const scale = view.w / svgRef.current.clientWidth; // screen px -> plan units
    setPan((p) => ({ x: p.x + dx * scale, y: p.y + dy * scale }));
    drag.current = { x: e.clientX, y: e.clientY, moved: true };
  };
  const endDrag = () => {
    setTimeout(() => (drag.current = null), 0);
  };
  const wasDrag = () => !!drag.current?.moved;

  const seatFill = (seat: Seat) => {
    if (selected.has(seat.id)) return '#FFFFFF';
    if (seat.status === 'BOOKED') return '#161616';
    if (seat.status === 'HELD') return '#E8590C';
    if (seat.status === 'MAINTENANCE') return '#A5A39B';
    return blockColor(sections, seat.sectionId);
  };

  // Row letter next to seat 1 of each row in the active block, pushed outward along the row.
  const rowLabels = useMemo(() => {
    if (!activeBlock) return [];
    const own = seats.filter((s) => s.sectionId === activeBlock);
    return Array.from(new Set(own.map((s) => s.rowLabel))).flatMap((row) => {
      const inRow = own.filter((s) => s.rowLabel === row).sort((a, b) => a.seatNumber - b.seatNumber);
      const [first, second] = inRow;
      if (!first || first.x === undefined || first.y === undefined) return [];
      const dx = second ? first.x - (second.x as number) : -1;
      const dy = second ? first.y - (second.y as number) : 0;
      const len = Math.hypot(dx, dy) || 1;
      return [{ row, x: first.x + (dx / len) * 8, y: first.y + (dy / len) * 8 }];
    });
  }, [activeBlock, seats]);

  const activeInfo = blocks.find((b) => b.section.id === activeBlock);
  const hoveredSection = hoveredSeat && sections.find((s) => s.id === hoveredSeat.sectionId);

  return (
    <div className="relative w-full bg-[#C8C5BD] border-3 border-[#161616] shadow-concrete flex flex-col select-none overflow-hidden">
      <RegistrationCrosses />

      {/* Plan Header Bar */}
      <div className="w-full bg-[#161616] text-[#D7D5CF] py-3 px-6 flex flex-wrap items-center justify-between gap-2 z-10 border-b-3 border-[#161616] font-mono-spec">
        <div className="text-[11px] tracking-widest uppercase text-[#E8590C] font-bold">
          {activeInfo ? 'BLOCK VIEW // SELECT SEATS' : 'ARENA OVERVIEW // TAP A BLOCK'}
        </div>
        <div className="font-anton text-lg tracking-widest text-[#D7D5CF] uppercase">
          {activeInfo
            ? `${activeInfo.section.name} // ₱${activeInfo.section.basePrice} PER SEAT`
            : 'COURT // SECOND FLOOR PLAN'}
        </div>
        {activeInfo ? (
          <button
            onClick={() => selectBlock('ALL')}
            className="text-[11px] tracking-widest uppercase font-bold px-3 py-1 bg-[#E8590C] text-[#FFFFFF] hover:bg-[#D7D5CF] hover:text-[#161616] transition-colors"
          >
            ← ALL BLOCKS
          </button>
        ) : (
          <div className="text-[11px] tracking-widest uppercase text-[#D7D5CF] font-bold">
            {seats.filter((s) => s.status === 'AVAILABLE').length} / {seats.length} OPEN
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div className="relative h-[480px] bg-concrete-grid overflow-hidden">
        <svg
          ref={svgRef}
          className={`w-full h-full ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ touchAction: zoom > 1 ? 'none' : 'pan-y' }}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          role="img"
          aria-label={activeInfo ? `${activeInfo.section.name} seat map` : 'Arena seat map'}
        >
          {/* Court */}
          <rect
            x={ARENA_LAYOUT.court.x}
            y={ARENA_LAYOUT.court.y}
            width={ARENA_LAYOUT.court.w}
            height={ARENA_LAYOUT.court.h}
            fill="#D7D5CF"
            stroke="#161616"
            strokeWidth={1.5}
          />
          <line
            x1={ARENA_LAYOUT.court.x + ARENA_LAYOUT.court.w / 2}
            x2={ARENA_LAYOUT.court.x + ARENA_LAYOUT.court.w / 2}
            y1={ARENA_LAYOUT.court.y}
            y2={ARENA_LAYOUT.court.y + ARENA_LAYOUT.court.h}
            stroke="#161616"
            strokeWidth={1}
          />
          <circle
            cx={ARENA_LAYOUT.court.x + ARENA_LAYOUT.court.w / 2}
            cy={ARENA_LAYOUT.court.y + ARENA_LAYOUT.court.h / 2}
            r={28}
            fill="none"
            stroke="#161616"
            strokeWidth={1}
          />
          <text
            x={ARENA_LAYOUT.court.x + ARENA_LAYOUT.court.w / 2}
            y={ARENA_LAYOUT.court.y + ARENA_LAYOUT.court.h / 2 + 60}
            fontSize={14}
            textAnchor="middle"
            fontFamily="Anton, sans-serif"
            fill="#55534E"
            letterSpacing={2}
          >
            COURT
          </text>

          {blocks.map(({ section }) => {
            const isActive = section.id === activeBlock;
            const own = seats.filter((s) => s.sectionId === section.id);
            return (
              <g
                key={section.id}
                opacity={activeBlock && !isActive ? 0.25 : 1}
                className={activeBlock ? '' : 'cursor-pointer'}
                onClick={() => {
                  if (!activeBlock && !wasDrag()) selectBlock(section.id);
                }}
              >
                {own.map((seat) => {
                  const isSel = selected.has(seat.id);
                  const canPick = isActive && (seat.status === 'AVAILABLE' || isSel);
                  return (
                    <g
                      key={seat.id}
                      className={canPick ? 'cursor-pointer' : ''}
                      onClick={(e) => {
                        if (!isActive) return;
                        e.stopPropagation();
                        if (canPick && !wasDrag()) onToggleSeat(seat);
                      }}
                      onMouseEnter={() => isActive && setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
                    >
                      <circle
                        cx={seat.x}
                        cy={seat.y}
                        r={isActive ? 3.7 : 2.7}
                        fill={seatFill(seat)}
                        stroke="#161616"
                        strokeWidth={isSel ? 1.4 : 0.5}
                      >
                        <title>{`${section.name} · Row ${seat.rowLabel} · Seat ${seat.seatNumber} · ${seat.status}`}</title>
                      </circle>
                      {isActive && (
                        <text
                          x={seat.x}
                          y={(seat.y as number) + 1.05}
                          fontSize={2.9}
                          textAnchor="middle"
                          fontFamily="IBM Plex Mono, monospace"
                          fontWeight={700}
                          fill={isSel || seat.status === 'AVAILABLE' ? '#161616' : '#FFFFFF'}
                          pointerEvents="none"
                        >
                          {seat.seatNumber}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Row letters (block view) */}
          {rowLabels.map((l) => (
            <text
              key={l.row}
              x={l.x}
              y={l.y + 1.6}
              fontSize={5}
              textAnchor="middle"
              fontFamily="IBM Plex Mono, monospace"
              fontWeight={700}
              fill="#E8590C"
              pointerEvents="none"
            >
              {l.row}
            </text>
          ))}

          {/* Block labels (overview) */}
          {!activeBlock &&
            blocks.map(({ section, cx, cy, available }) => (
              <g key={`lbl-${section.id}`} pointerEvents="none">
                <rect x={cx - 46} y={cy - 20} width={92} height={40} fill="#161616" opacity={0.88} />
                <text x={cx} y={cy - 2} fontSize={16} textAnchor="middle" fontFamily="Anton, sans-serif" fill="#FFFFFF" letterSpacing={1}>
                  {section.name}
                </text>
                <text x={cx} y={cy + 13} fontSize={10} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontWeight={700} fill="#E8590C">
                  ₱{section.basePrice} · {available} LEFT
                </text>
              </g>
            ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredSeat && (
          <div className="hidden sm:block absolute top-4 left-4 bg-[#161616] text-[#D7D5CF] border-2 border-[#161616] p-3 text-xs shadow-concrete z-20 pointer-events-none font-mono-spec">
            <div className="font-anton text-sm text-[#E8590C] tracking-widest uppercase mb-1">
              {hoveredSection?.name} // ROW {hoveredSeat.rowLabel} - SEAT {hoveredSeat.seatNumber}
            </div>
            <div>PRICE: <span className="font-bold text-[#D7D5CF]">₱{hoveredSection?.basePrice}</span></div>
            <div>STATUS: <span className="font-bold text-[#E8590C] uppercase">{hoveredSeat.status}</span></div>
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-[#D7D5CF] border-2 border-[#161616] p-1.5 shadow-concrete z-10 font-mono-spec">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.4, 4))}
          className="w-8 h-8 flex items-center justify-center bg-[#161616] text-[#D7D5CF] hover:bg-[#E8590C] font-bold text-base transition-colors"
          title="Zoom In"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => (zoom / 1.4 <= 1.01 ? resetView() : setZoom(zoom / 1.4))}
          className="w-8 h-8 flex items-center justify-center bg-[#161616] text-[#D7D5CF] hover:bg-[#E8590C] font-bold text-base transition-colors"
          title="Zoom Out"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="px-3 h-8 bg-[#161616] text-[#D7D5CF] hover:bg-[#E8590C] text-[11px] font-bold uppercase transition-colors"
        >
          RESET
        </button>
      </div>
    </div>
  );
};
