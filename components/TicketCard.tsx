'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface TicketCardProps {
  ticketId: string;
  eventName: string;
  seats: string;
  totalAmount: number | string;
  paymentStatus?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticketId,
  eventName,
  seats,
  totalAmount,
  paymentStatus = 'PAID & CONFIRMED (STRIPE)',
}) => {
  const qrData = `sotero://ticket/${ticketId}`;

  return (
    <div className="p-5 bg-[#C8C5BD] border-2 border-[#161616] space-y-4 font-mono-spec relative shadow-concrete-sm">
      {/* Top Header Row */}
      <div className="flex justify-between items-baseline flex-wrap gap-2">
        <span className="text-[10px] text-[#E8590C] font-bold tracking-widest uppercase">
          TICKET REF: {ticketId}
        </span>
        <span className="px-2 py-0.5 text-[9px] bg-[#161616] text-[#E8590C] font-bold uppercase border border-[#161616]">
          {paymentStatus}
        </span>
      </div>

      {/* Event & Seats */}
      <div>
        <div className="font-anton text-lg text-[#161616] uppercase tracking-wide">
          {eventName}
        </div>
        <div className="text-xs text-[#555] font-bold uppercase mt-1">
          SEATS: {seats}
        </div>
      </div>

      {/* Amount Display */}
      <div className="flex justify-between items-center pt-3 border-t border-[#161616]/30 flex-wrap gap-2">
        <div>
          <span className="text-[10px] font-bold text-[#555] uppercase block">TOTAL AMOUNT PAID:</span>
          <span className="font-anton text-xl text-[#161616]">
            ₱{typeof totalAmount === 'number' ? totalAmount.toFixed(2) : parseFloat(totalAmount).toFixed(2)}
          </span>
        </div>

        {/* Permanent Confirmed Badge */}
        <div className="px-2.5 py-1 text-[10px] bg-[#161616] text-[#2ECC40] font-bold uppercase tracking-widest border border-[#161616] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2ECC40]" />
          <span>PERMANENT BOOKING</span>
        </div>
      </div>

      {/* Real 2D QR Code Container */}
      <div className="p-4 bg-[#D7D5CF] border-2 border-[#161616] flex flex-col items-center justify-center text-center space-y-2">
        <div className="p-2 bg-[#FFFFFF] border-2 border-[#161616] inline-block shadow-sm">
          <QRCodeSVG
            value={qrData}
            size={130}
            bgColor="#FFFFFF"
            fgColor="#161616"
            level="H"
            includeMargin={false}
          />
        </div>
        <div className="text-[9px] font-bold text-[#161616] tracking-[0.2em] uppercase pt-1">
          {qrData}
        </div>
        <div className="text-[8px] text-[#555] tracking-widest uppercase">
          SCAN AT ABRA ARENA TURNSTILE FOR AUTOMATIC GATE ENTRANCE
        </div>
      </div>
    </div>
  );
};
