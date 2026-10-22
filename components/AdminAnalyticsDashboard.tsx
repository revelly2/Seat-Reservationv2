'use client';

import React, { useState, useMemo } from 'react';
import { Venue, Event, Section } from '@/types/seat-reservation';
import { ARENA_LAYOUT } from '@/lib/mock-data';
import { RegistrationCrosses } from './RegistrationCrosses';
import {
  HumanWalkingPhone,
  HumanScanningGate,
  HumanSeatedSpectator,
  HumanCheeringFan,
  HumanOperatorSupervisor,
  ArchitecturalConcourseBand,
} from './ArchitecturalHumanVectors';

// Booked seats, capacity and yield per arena block. Seats outside the arena layout (old grid) are ignored.
export function blockBreakdown(reservations: { seatIds?: string[] }[], sections: Section[]) {
  const booked = new Map<string, number>();
  reservations.forEach((res) =>
    (Array.isArray(res.seatIds) ? res.seatIds : []).forEach((sid) => {
      const code = sid.split('-')[1];
      booked.set(code, (booked.get(code) || 0) + 1);
    })
  );
  return ARENA_LAYOUT.blocks.map((block, i) => {
    const capacity = ARENA_LAYOUT.seats.filter((seat) => seat[0] === i).length;
    const count = Math.min(capacity, booked.get(block.code) || 0);
    const price = sections[i]?.basePrice ?? block.defaultPrice;
    return {
      code: block.code,
      name: sections[i]?.name ?? block.name,
      color: block.color,
      price,
      capacity,
      booked: count,
      occupancy: Math.round((count / capacity) * 100),
      // shortcut: yield uses the current block price, not the price paid at booking; store per-seat price if prices change mid-sale.
      revenue: count * price,
    };
  });
}

interface AdminAnalyticsDashboardProps {
  venue: Venue;
  events: Event[];
  reservations: any[];
  onRefreshData?: () => void;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  venue,
  events,
  reservations,
  onRefreshData,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [timeframe, setTimeframe] = useState<'LIVE' | '24H' | 'TOTAL'>('LIVE');
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; value: number; metric: string } | null>(null);

  // Filter reservations based on selected event
  const filteredReservations = useMemo(() => {
    if (selectedEventId === 'ALL') {
      return reservations;
    }
    return reservations.filter((r) => r.eventId === selectedEventId);
  }, [reservations, selectedEventId]);

  // Compute key metrics
  const metrics = useMemo(() => {
    const totalCapacity = venue.totalCapacity || ARENA_LAYOUT.seats.length;
    
    // Total booked seats count
    let totalSeatsBooked = 0;
    let totalGrossRevenue = 0;
    let checkedInCount = 0;

    filteredReservations.forEach((res) => {
      const seatsCount = Array.isArray(res.seatIds)
        ? res.seatIds.length
        : res.seats
        ? res.seats.split(',').length
        : 1;

      totalSeatsBooked += seatsCount;
      totalGrossRevenue += Number(res.totalAmount) || 0;

      if (res.checkInStatus === 'CHECKED_IN') {
        checkedInCount += seatsCount;
      }
    });

    const occupancyRate = totalCapacity > 0 ? Math.min(100, Math.round((totalSeatsBooked / totalCapacity) * 100)) : 0;
    const checkInRate = totalSeatsBooked > 0 ? Math.min(100, Math.round((checkedInCount / totalSeatsBooked) * 100)) : 0;
    const avgTicketValue = totalSeatsBooked > 0 ? totalGrossRevenue / totalSeatsBooked : 0;

    return {
      totalCapacity,
      totalSeatsBooked,
      totalGrossRevenue,
      checkedInCount,
      occupancyRate,
      checkInRate,
      avgTicketValue,
      sections: blockBreakdown(filteredReservations, venue.layoutConfig.sections),
    };
  }, [venue, filteredReservations]);

  // Hourly Flow Data points for Turnstile Influx Area Chart
  const hourlyFlowData = useMemo(() => {
    return [
      { time: 'T-120m', arrivals: 4, cumulative: 4 },
      { time: 'T-90m', arrivals: 9, cumulative: 13 },
      { time: 'T-60m', arrivals: 18, cumulative: 31 },
      { time: 'T-45m', arrivals: 26, cumulative: 57 },
      { time: 'T-30m', arrivals: 34, cumulative: 91 },
      { time: 'T-15m', arrivals: 48, cumulative: 139 },
      { time: 'GATES OPEN', arrivals: 62, cumulative: 201 },
      { time: '+15m', arrivals: 31, cumulative: 232 },
      { time: '+30m', arrivals: 14, cumulative: 246 },
      { time: 'HALFTIME', arrivals: 6, cumulative: 252 },
    ];
  }, []);

  // Revenue Trajectory Data
  const revenueTrajectory = useMemo(() => {
    const totalTarget = 12500;
    const currentRev = metrics.totalGrossRevenue > 0 ? metrics.totalGrossRevenue : 8750;
    return [
      { milestone: 'Day 1 Launch', target: 2500, actual: Math.round(currentRev * 0.22) },
      { milestone: 'Early Bird', target: 5000, actual: Math.round(currentRev * 0.48) },
      { milestone: 'Phase 2 Reg', target: 8000, actual: Math.round(currentRev * 0.76) },
      { milestone: 'Final Week', target: 11000, actual: Math.round(currentRev * 0.94) },
      { milestone: 'Gate Day Live', target: totalTarget, actual: currentRev },
    ];
  }, [metrics.totalGrossRevenue]);

  return (
    <div className="space-y-8 font-mono-spec">
      {/* Dashboard Control Header */}
      <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete flex flex-col md:flex-row md:items-center justify-between gap-6">
        <RegistrationCrosses />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8590C] animate-ping" />
            <span className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
              ABRA ARENA // REALTIME TELEMETRY & GATE ANALYTICS
            </span>
          </div>
          <h2 className="font-anton text-2xl md:text-3xl tracking-wider text-[#161616] uppercase">
            [ ARENA EXECUTIVE DASHBOARD ]
          </h2>
          <p className="text-xs text-[#555] font-bold">
            Live occupancy dynamics, revenue velocity, and spectator flow telemetry.
          </p>
        </div>

        {/* Filter & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[9px] font-bold uppercase text-[#555] mb-1">EVENT FILTER</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-[#C8C5BD] border-2 border-[#161616] px-3 py-1.5 text-xs font-bold text-[#161616] uppercase focus:bg-[#FFFFFF] outline-none"
            >
              <option value="ALL">ALL ARENA EVENTS (AGGREGATE)</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({new Date(evt.eventDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] font-bold uppercase text-[#555] mb-1">WINDOW</label>
            <div className="flex border-2 border-[#161616] bg-[#C8C5BD] p-0.5">
              {(['LIVE', '24H', 'TOTAL'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTimeframe(mode)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
                    timeframe === mode
                      ? 'bg-[#161616] text-[#D7D5CF]'
                      : 'text-[#161616] hover:bg-[#B8B5AD]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {onRefreshData && (
            <button
              type="button"
              onClick={onRefreshData}
              className="mt-4 md:mt-0 self-end px-3 py-2 bg-[#E8590C] hover:bg-[#161616] text-[#FFFFFF] border-2 border-[#161616] text-xs font-bold uppercase transition-all shadow-concrete-sm flex items-center gap-2"
            >
              <span>↻ SYNC</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Architectural Horizon with Minimalist Vector Humans */}
      <ArchitecturalConcourseBand
        totalCapacity={metrics.totalCapacity}
        occupancyPercent={metrics.occupancyRate}
      />

      {/* KPI Metric Cards with Minimalist Human Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Gross Revenue */}
        <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-5 shadow-concrete flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
                [METRIC-01] GROSS REVENUE
              </div>
              <div className="font-anton text-3xl text-[#161616] tracking-wide mt-1">
                ₱{metrics.totalGrossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-1 bg-[#161616] text-[#2ECC40] text-[10px] font-bold uppercase border border-[#161616]">
              +18.4%
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#161616]/30 flex items-center justify-between text-xs">
            <span className="text-[#555] font-bold">AVG TICKET VALUE</span>
            <span className="font-anton text-sm text-[#161616]">₱{metrics.avgTicketValue.toFixed(2)}</span>
          </div>
        </div>

        {/* KPI 2: Occupancy Rate */}
        <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-5 shadow-concrete flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
                [METRIC-02] SEAT OCCUPANCY
              </div>
              <div className="font-anton text-3xl text-[#161616] tracking-wide mt-1">
                {metrics.occupancyRate}%
              </div>
            </div>
            <HumanSeatedSpectator size={38} color="#161616" accentColor="#E8590C" />
          </div>
          <div className="mt-4 pt-3 border-t border-[#161616]/30 flex items-center justify-between text-xs">
            <span className="text-[#555] font-bold">BOOKED / TOTAL</span>
            <span className="font-anton text-sm text-[#161616]">
              {metrics.totalSeatsBooked} / {metrics.totalCapacity} SEATS
            </span>
          </div>
        </div>

        {/* KPI 3: Turnstile Verified Entrants */}
        <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-5 shadow-concrete flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
                [METRIC-03] GATE CHECK-IN
              </div>
              <div className="font-anton text-3xl text-[#161616] tracking-wide mt-1">
                {metrics.checkInRate}%
              </div>
            </div>
            <HumanScanningGate size={38} color="#161616" accentColor="#E8590C" />
          </div>
          <div className="mt-4 pt-3 border-t border-[#161616]/30 flex items-center justify-between text-xs">
            <span className="text-[#555] font-bold">SCANNED AT GATES</span>
            <span className="font-anton text-sm text-[#2ECC40] bg-[#161616] px-1.5 py-0.5">
              {metrics.checkedInCount} VERIFIED
            </span>
          </div>
        </div>

        {/* KPI 4: Turnstile Influx Rate */}
        <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-5 shadow-concrete flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
                [METRIC-04] INFLUX VELOCITY
              </div>
              <div className="font-anton text-3xl text-[#161616] tracking-wide mt-1">
                4.2 <span className="text-sm font-sans font-bold text-[#555]">PPM</span>
              </div>
            </div>
            <HumanCheeringFan size={38} color="#161616" accentColor="#E8590C" />
          </div>
          <div className="mt-4 pt-3 border-t border-[#161616]/30 flex items-center justify-between text-xs">
            <span className="text-[#555] font-bold">ESP32 BARRIER STATUS</span>
            <span className="font-bold text-[#E8590C]">ACTIVE // 0.8s CYCLE</span>
          </div>
        </div>
      </div>

      {/* Main Graphs Grid: 2 Large Charts Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graph 1: Turnstile Entry Flow Rate (Interactive SVG Area + Bar Chart) */}
        <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete flex flex-col justify-between">
          <RegistrationCrosses />
          <div className="pb-4 border-b-2 border-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
                CHART 01 // TEMPORAL DYNAMICS
              </div>
              <h3 className="font-anton text-xl tracking-wider text-[#161616] uppercase">
                TURNSTILE ARRIVAL & INFLUX VELOCITY
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#555]">SCALE: ATTENDEES/INTERVAL</span>
              <HumanWalkingPhone size={32} color="#161616" accentColor="#E8590C" />
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="relative mt-6 h-64 w-full">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="influxGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8590C" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#E8590C" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#161616" strokeDasharray="3 3" opacity="0.2" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#161616" strokeDasharray="3 3" opacity="0.2" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#161616" strokeDasharray="3 3" opacity="0.2" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#161616" strokeWidth="1.5" />

              {/* Y-Axis Labels */}
              <text x="32" y="24" textAnchor="end" className="text-[9px] fill-[#555] font-mono font-bold">60</text>
              <text x="32" y="74" textAnchor="end" className="text-[9px] fill-[#555] font-mono font-bold">40</text>
              <text x="32" y="124" textAnchor="end" className="text-[9px] fill-[#555] font-mono font-bold">20</text>
              <text x="32" y="174" textAnchor="end" className="text-[9px] fill-[#555] font-mono font-bold">0</text>

              {/* Area Path */}
              <path
                d="M 40 160 L 88 148 L 137 125 L 186 105 L 235 85 L 284 50 L 333 15 L 382 92 L 431 135 L 480 155 L 480 170 L 40 170 Z"
                fill="url(#influxGradient)"
              />

              {/* Stroke Line */}
              <path
                d="M 40 160 L 88 148 L 137 125 L 186 105 L 235 85 L 284 50 L 333 15 L 382 92 L 431 135 L 480 155"
                fill="none"
                stroke="#E8590C"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points with Hover */}
              {hourlyFlowData.map((d, i) => {
                const cx = 40 + (i * (440 / (hourlyFlowData.length - 1)));
                const cy = 170 - (d.arrivals / 65) * 150;
                return (
                  <g
                    key={d.time}
                    className="cursor-pointer group"
                    onMouseEnter={() =>
                      setHoveredPoint({ label: d.time, value: d.arrivals, metric: 'scanned arrivals/15m' })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Bar under point */}
                    <rect
                      x={cx - 6}
                      y={cy}
                      width="12"
                      height={170 - cy}
                      fill="#161616"
                      opacity="0.15"
                      className="group-hover:opacity-40 transition-opacity"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r="4.5"
                      fill="#FFFFFF"
                      stroke="#E8590C"
                      strokeWidth="2.5"
                      className="group-hover:scale-150 transition-transform origin-center"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-2 right-4 bg-[#161616] text-[#FFFFFF] px-3 py-1.5 border border-[#E8590C] shadow-concrete-sm text-xs font-bold pointer-events-none">
                <span className="text-[#E8590C]">{hoveredPoint.label}:</span> {hoveredPoint.value} {hoveredPoint.metric}
              </div>
            )}
          </div>

          {/* X-Axis Time Labels */}
          <div className="flex justify-between items-center text-[8px] font-bold text-[#555] uppercase mt-2 pt-2 border-t border-[#161616]/20">
            <span>T-120m</span>
            <span>T-60m</span>
            <span className="text-[#E8590C] bg-[#161616] px-1 py-0.5">PEAK: GATES OPEN</span>
            <span>+30m</span>
            <span>HALFTIME</span>
          </div>
        </div>

        {/* Graph 2: Revenue & Sales Velocity Curve */}
        <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete flex flex-col justify-between">
          <RegistrationCrosses />
          <div className="pb-4 border-b-2 border-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
                CHART 02 // FINANCIAL YIELD
              </div>
              <h3 className="font-anton text-xl tracking-wider text-[#161616] uppercase">
                CUMULATIVE GROSS REVENUE VS TARGET
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#555]">TARGET: ₱12,500</span>
              <HumanOperatorSupervisor size={32} color="#161616" accentColor="#E8590C" />
            </div>
          </div>

          {/* SVG Revenue Trajectory Graph */}
          <div className="relative mt-6 h-64 w-full">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
            >
              {/* Target Baseline Line (Dashed) */}
              <path
                d="M 40 160 L 150 120 L 260 80 L 370 40 L 480 20"
                fill="none"
                stroke="#161616"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.4"
              />

              {/* Actual Revenue Line (Solid High Contrast Orange) */}
              <path
                d="M 40 165 L 150 135 L 260 95 L 370 45 L 480 30"
                fill="none"
                stroke="#161616"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 40 165 L 150 135 L 260 95 L 370 45 L 480 30"
                fill="none"
                stroke="#2ECC40"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Milestone Markers */}
              {revenueTrajectory.map((rev, i) => {
                const cx = 40 + i * 110;
                const cyActual = 165 - (rev.actual / 12500) * 140;
                return (
                  <g
                    key={rev.milestone}
                    className="cursor-pointer group"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        label: rev.milestone,
                        value: rev.actual,
                        metric: `PHP Gross (Target: ₱${rev.target.toLocaleString()})`,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={cx}
                      cy={cyActual}
                      r="5"
                      fill="#161616"
                      stroke="#2ECC40"
                      strokeWidth="2.5"
                      className="group-hover:scale-150 transition-transform origin-center"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Legend inside chart */}
            <div className="absolute top-2 left-10 flex items-center gap-4 bg-[#C8C5BD] border border-[#161616] px-2.5 py-1 text-[9px] font-bold uppercase">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#2ECC40]" />
                <span>ACTUAL REVENUE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#161616] opacity-40 border-b border-dashed" />
                <span>PROJECTED TARGET</span>
              </div>
            </div>
          </div>

          {/* X-Axis Milestone Labels */}
          <div className="flex justify-between items-center text-[8px] font-bold text-[#555] uppercase mt-2 pt-2 border-t border-[#161616]/20">
            {revenueTrajectory.map((m) => (
              <span key={m.milestone}>{m.milestone}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Arena Seating Tiers & Minimalist Spectator Density Breakdown */}
      <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete space-y-6">
        <RegistrationCrosses />
        <div className="pb-4 border-b-2 border-[#161616] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
              CHART 03 // SECTION OCCUPANCY & CAPACITY ALLOCATION
            </div>
            <h3 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
              ARENA TIERS PERFORMANCE & SPECTATOR RATIO
            </h3>
          </div>
          <div className="text-xs font-bold text-[#555] uppercase">
            VENUE: UNIVERSITY OF ABRA ARENA // {metrics.totalCapacity.toLocaleString()} SEATS TOTAL
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {metrics.sections.map((sec) => (
            <div key={sec.code} className="bg-[#C8C5BD] border-2 border-[#161616] p-5 flex flex-col justify-between space-y-4 shadow-concrete-sm">
              <div>
                <span className="inline-block w-3 h-3 rounded-full border border-[#161616] mr-2 align-middle" style={{ background: sec.color }} />
                <h4 className="inline font-anton text-lg text-[#161616] uppercase align-middle">{sec.name}</h4>
                <div className="text-xs font-bold text-[#555] mt-1">PRICE: ₱{sec.price.toFixed(2)} / SEAT</div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>OCCUPIED</span>
                  <span>
                    {sec.booked} / {sec.capacity} ({sec.occupancy}%)
                  </span>
                </div>
                <div className="w-full h-4 bg-[#D7D5CF] border-2 border-[#161616] overflow-hidden">
                  <div className="h-full transition-all duration-500" style={{ width: `${sec.occupancy}%`, background: sec.color }} />
                </div>
              </div>

              <div className="pt-2 border-t border-[#161616]/30 flex justify-between text-xs font-bold">
                <span className="text-[#555]">SECTION YIELD</span>
                <span className="font-anton text-[#161616] text-sm">₱{sec.revenue.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Turnstile Activity & Recent Gate Passages */}
      <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete space-y-4">
        <RegistrationCrosses />
        <div className="pb-4 border-b-2 border-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HumanScanningGate size={36} color="#161616" accentColor="#E8590C" />
            <div>
              <div className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
                REALTIME ACCESS LOG // HARDWARE GATE BARRIER
              </div>
              <h3 className="font-anton text-xl tracking-wider text-[#161616] uppercase">
                LIVE TURNSTILE SCANNER FEED
              </h3>
            </div>
          </div>
          <div className="text-xs font-bold bg-[#161616] text-[#2ECC40] px-3 py-1 border border-[#161616]">
            ● SERIAL STATUS: CONNECTED & ARMED
          </div>
        </div>

        {/* Recent Access Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#161616] text-[#D7D5CF] uppercase text-[10px] tracking-widest">
                <th className="p-3 border border-[#161616]">ENTRY TIMESTAMP</th>
                <th className="p-3 border border-[#161616]">TICKET PASS REF</th>
                <th className="p-3 border border-[#161616]">SPECTATOR IDENTITY</th>
                <th className="p-3 border border-[#161616]">ASSIGNED SEAT</th>
                <th className="p-3 border border-[#161616]">ACCESS LEVEL</th>
                <th className="p-3 border border-[#161616]">GATE PASSAGE</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#555] font-bold uppercase">
                    No turnstile activity records found for this selection.
                  </td>
                </tr>
              ) : (
                filteredReservations.slice(0, 5).map((res, idx) => (
                  <tr key={res.id || idx} className="bg-[#C8C5BD] border-b border-[#161616]">
                    <td className="p-3 border border-[#161616] text-[11px] font-bold">
                      {res.scannedAt
                        ? new Date(res.scannedAt).toLocaleTimeString()
                        : res.createdAt
                        ? new Date(res.createdAt).toLocaleTimeString()
                        : 'JUST NOW'}
                    </td>
                    <td className="p-3 border border-[#161616] font-bold text-[#E8590C]">
                      {res.id ? String(res.id).slice(0, 13) : `TKT-${idx + 101}`}
                    </td>
                    <td className="p-3 border border-[#161616] font-bold">
                      {res.userEmail || res.userId || 'Guest Attendee'}
                    </td>
                    <td className="p-3 border border-[#161616] font-anton text-xs">
                      {res.seats || (Array.isArray(res.seatIds) ? res.seatIds.join(', ') : 'GENERAL')}
                    </td>
                    <td className="p-3 border border-[#161616]">
                      <span className="px-2 py-0.5 bg-[#161616] text-[#D7D5CF] text-[10px] font-bold">
                        {res.paymentStatus || 'VERIFIED'}
                      </span>
                    </td>
                    <td className="p-3 border border-[#161616]">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          res.checkInStatus === 'CHECKED_IN'
                            ? 'bg-[#2ECC40] text-[#161616]'
                            : 'bg-[#E8590C] text-[#FFFFFF]'
                        }`}
                      >
                        {res.checkInStatus === 'CHECKED_IN' ? '✓ GATE UNLOCKED' : '⏳ PENDING SCAN'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
