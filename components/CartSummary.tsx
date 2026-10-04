'use client';

import React from 'react';
import { Seat, Section } from '@/types/seat-reservation';
import { RegistrationCrosses } from './RegistrationCrosses';

interface CartSummaryProps {
  selectedSeats: Seat[];
  sections: Section[];
  isHeld?: boolean;
  holdExpiresAt?: string | null;
  onHoldSeats?: () => void;
  onProceedCheckout: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  selectedSeats,
  sections,
  onProceedCheckout,
  onClearSelection,
  isLoading = false,
}) => {
  const getSeatPrice = (seat: Seat) => {
    const sec = sections.find((s) => s.id === seat.sectionId);
    return sec ? sec.basePrice : 100;
  };

  const totalPrice = selectedSeats.reduce((acc, seat) => acc + getSeatPrice(seat), 0);

  return (
    <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete flex flex-col justify-between h-full font-mono-spec">
      <RegistrationCrosses />

      <div>
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#161616]">
          <h2 className="font-anton text-xl tracking-wider text-[#161616] uppercase">
            [01 / MANIFEST SUMMARY]
          </h2>
          {selectedSeats.length > 0 && (
            <button
              onClick={onClearSelection}
              className="text-xs text-[#E8590C] hover:underline font-bold uppercase"
            >
              CLEAR ALL [✕]
            </button>
          )}
        </div>

        {/* Selected Seats Table Rows */}
        <div className="mt-4 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
          {selectedSeats.length === 0 ? (
            <div className="text-center py-12 text-[#555] text-xs font-mono uppercase tracking-wider">
              No seats allocated. Click seating map tiles to select.
            </div>
          ) : (
            selectedSeats.map((seat) => {
              const price = getSeatPrice(seat);
              return (
                <div
                  key={seat.id}
                  className="flex items-center justify-between p-3 bg-[#C8C5BD] border-2 border-[#161616]"
                >
                  <div>
                    <div className="font-bold text-[#161616] text-xs uppercase">
                      ROW {seat.rowLabel} — SEAT {seat.seatNumber}
                    </div>
                    <div className="text-[10px] text-[#555] uppercase">
                      {seat.sectionId}
                    </div>
                  </div>
                  <div className="font-anton text-base text-[#161616]">
                    ₱{price.toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pricing Breakdown & Action Button (Timer Removed) */}
      <div className="pt-6 border-t-2 border-[#161616]">
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-xs text-[#555] font-bold uppercase tracking-wider">
            TOTAL AMOUNT:
          </span>
          <span className="font-anton text-3xl text-[#161616]">
            ₱{totalPrice.toFixed(2)}
          </span>
        </div>

        <button
          onClick={onProceedCheckout}
          disabled={selectedSeats.length === 0 || isLoading}
          className="w-full py-3.5 bg-[#E8590C] hover:bg-[#161616] disabled:opacity-40 disabled:bg-[#161616] text-[#FFFFFF] font-anton text-lg tracking-widest uppercase transition-all shadow-concrete-sm border-2 border-[#161616] active:translate-x-1 active:translate-y-1"
        >
          {isLoading
            ? 'PROCESSING...'
            : selectedSeats.length === 0
            ? 'SELECT SEATS TO CHECKOUT'
            : `PROCEED TO CHECKOUT (${selectedSeats.length} SEAT${selectedSeats.length > 1 ? 'S' : ''}) →`}
        </button>
      </div>
    </div>
  );
};
