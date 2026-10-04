'use client';

import React, { useState, useEffect } from 'react';
import { Seat, UserProfile } from '@/types/seat-reservation';
import { RegistrationCrosses } from './RegistrationCrosses';
import { QRCodeSVG } from 'qrcode.react';

interface CheckoutModalProps {
  isOpen: boolean;
  selectedSeats: Seat[];
  totalPrice: number;
  onClose: () => void;
  onConfirmPayment: (details: {
    name: string;
    email: string;
    paymentStatus?: string;
    stripePaymentIntentId?: string;
  }) => Promise<any>;
  eventId?: string;
  eventTitle?: string;
  currentUser?: UserProfile | null;
  onViewTickets?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  selectedSeats,
  totalPrice,
  onClose,
  onConfirmPayment,
  eventId = '00000000-0000-4000-a000-000000000001',
  eventTitle = 'University of Abra Arena Championship',
  currentUser,
  onViewTickets,
}) => {
  const [name, setName] = useState(currentUser?.fullName || 'Guest User');
  const [email, setEmail] = useState(currentUser?.email || 'guest@abra.edu.ph');
  const [paymentMode, setPaymentMode] = useState<'STRIPE_CARD' | 'STRIPE_CHECKOUT'>('STRIPE_CARD');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12 / 28');
  const [cardCvc, setCardCvc] = useState('123');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [ticketReceipt, setTicketReceipt] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName) setName(currentUser.fullName);
      if (currentUser.email) setEmail(currentUser.email);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setStripeError(null);

    try {
      if (paymentMode === 'STRIPE_CHECKOUT') {
        // Create Stripe Hosted Checkout Session
        const checkoutRes = await fetch('/api/v1/payments/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalPrice,
            seatIds: selectedSeats.map((s) => s.id),
            seatsLabel: selectedSeats.map((s) => `${s.rowLabel}-${s.seatNumber}`).join(', '),
            userEmail: email,
            eventId,
            eventTitle,
          }),
        });

        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok || !checkoutData.success || !checkoutData.url) {
          throw new Error(checkoutData.error || 'Failed to initialize Stripe Hosted Checkout.');
        }

        // Save pending booking details to localStorage so upon return we can finalize
        localStorage.setItem(
          'sotero_pending_checkout',
          JSON.stringify({
            seatIds: selectedSeats.map((s) => s.id),
            seatsLabel: selectedSeats.map((s) => `${s.rowLabel}-${s.seatNumber}`).join(', '),
            totalPrice,
            email,
            name,
            eventId,
          })
        );

        // Redirect to official Stripe Checkout page
        window.location.href = checkoutData.url;
        return;
      }

      let stripeIntentData: any = null;

      if (paymentMode === 'STRIPE_CARD') {
        // Call backend Stripe API to create & confirm PaymentIntent immediately
        const stripeRes = await fetch('/api/v1/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalPrice,
            seatIds: selectedSeats.map((s) => s.id),
            userEmail: email,
            eventId,
            paymentMethodId: 'pm_card_visa', // Attaches verified Visa test card
            confirmImmediately: true, // Guarantees status: 'succeeded' in Stripe Dashboard
          }),
        });

        const resData = await stripeRes.json();
        if (!stripeRes.ok || !resData.success) {
          throw new Error(resData.error || 'Stripe payment authorization failed.');
        }
        stripeIntentData = resData;
      }

      const paymentStatus = 'PAID_STRIPE';

      const confirmedRes = await onConfirmPayment({
        name,
        email,
        paymentStatus,
        stripePaymentIntentId: stripeIntentData?.paymentIntentId,
      });

      const finalTicketId = confirmedRes?.id || (stripeIntentData
        ? `TKT-STRIPE-${stripeIntentData.paymentIntentId.slice(-6).toUpperCase()}`
        : `TKT-${Math.floor(100000 + Math.random() * 900000)}`);

      setTicketReceipt({
        ticketId: finalTicketId,
        seats: selectedSeats.map((s) => `${s.rowLabel}-${s.seatNumber}`).join(', '),
        amount: totalPrice,
        holder: name,
        paymentMode,
        stripePaymentIntentId: stripeIntentData?.paymentIntentId || null,
        stripeStatus: stripeIntentData?.status || 'PAID',
        date: new Date().toLocaleString(),
      });
    } catch (err: any) {
      console.error('Checkout error:', err);
      setStripeError(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#161616]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-mono-spec">
      <div className="relative bg-[#D7D5CF] border-3 border-[#161616] max-w-lg w-full p-6 shadow-concrete-lg text-[#161616] max-h-[92vh] overflow-y-auto">
        <RegistrationCrosses />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#161616] hover:text-[#E8590C] font-bold text-xl uppercase"
        >
          [✕]
        </button>

        {!ticketReceipt ? (
          <div>
            <div className="text-[10px] text-[#E8590C] tracking-[0.25em] font-bold uppercase mb-1">
              SPECIFICATION // STRIPE PAYMENT GATEWAY
            </div>
            <h3 className="font-anton text-2xl tracking-wider uppercase mb-4 text-[#161616]">
              CHECKOUT & SEAT ALLOCATION
            </h3>

            {stripeError && (
              <div className="p-3 bg-[#E8590C] text-[#FFFFFF] text-xs font-bold border-2 border-[#161616] mb-4">
                [STRIPE ERROR]: {stripeError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                  FULL NAME
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#C8C5BD] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                  EMAIL ADDRESS (FOR STRIPE RECEIPT)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#C8C5BD] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>

              {/* Payment Gateway Selector */}
              <div>
                <label className="block text-xs font-bold text-[#161616] uppercase mb-1">
                  SELECT STRIPE PAYMENT METHOD
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('STRIPE_CARD')}
                    className={`p-3 text-[11px] font-bold uppercase border-2 border-[#161616] text-left transition-all ${
                      paymentMode === 'STRIPE_CARD'
                        ? 'bg-[#161616] text-[#E8590C]'
                        : 'bg-[#C8C5BD] text-[#161616] hover:bg-[#D7D5CF]'
                    }`}
                  >
                    <div className="font-anton text-sm mb-0.5">💳 STRIPE DIRECT CARD</div>
                    <div className="text-[9px] opacity-80">Instant Verification (Visa •••• 4242)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('STRIPE_CHECKOUT')}
                    className={`p-3 text-[11px] font-bold uppercase border-2 border-[#161616] text-left transition-all ${
                      paymentMode === 'STRIPE_CHECKOUT'
                        ? 'bg-[#161616] text-[#E8590C]'
                        : 'bg-[#C8C5BD] text-[#161616] hover:bg-[#D7D5CF]'
                    }`}
                  >
                    <div className="font-anton text-sm mb-0.5">🌐 STRIPE HOSTED CHECKOUT</div>
                    <div className="text-[9px] opacity-80">Stripe Portal, GrabPay & GCash</div>
                  </button>
                </div>
              </div>

              {paymentMode === 'STRIPE_CARD' && (
                <div className="p-3 bg-[#C8C5BD] border-2 border-[#161616] space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#E8590C] uppercase tracking-wider">
                    <span>⚡ STRIPE DIRECT PAYMENT (VISA •••• 4242)</span>
                    <span className="bg-[#161616] text-[#2ECC40] px-1.5 py-0.5 text-[9px]">READY</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#555] uppercase mb-0.5">
                      CARD NUMBER (STRIPE TEST VISA)
                    </label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 •••• •••• 4242"
                      className="w-full bg-[#D7D5CF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#555] uppercase mb-0.5">
                        EXPIRY
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / YY"
                        className="w-full bg-[#D7D5CF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#555] uppercase mb-0.5">
                        CVC
                      </label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        className="w-full bg-[#D7D5CF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
                      />
                    </div>
                  </div>
                  <div className="text-[9px] text-[#555] uppercase font-bold pt-1">
                    ✓ Attached payment method will confirm and transition to <span className="text-[#161616] underline font-extrabold">SUCCEEDED</span> on Stripe Dashboard.
                  </div>
                </div>
              )}

              {paymentMode === 'STRIPE_CHECKOUT' && (
                <div className="p-3 bg-[#C8C5BD] border-2 border-[#161616] space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#E8590C] uppercase tracking-wider">
                    <span>🌐 STRIPE HOSTED CHECKOUT</span>
                    <span className="bg-[#161616] text-[#3498db] px-1.5 py-0.5 text-[9px]">OFFICIAL PAGE</span>
                  </div>
                  <p className="text-xs text-[#161616] leading-relaxed">
                    You will be redirected to Stripe's secure hosted payment page. It supports credit/debit cards and enabled Philippines payment methods (e.g. GrabPay). Once paid, you will be automatically returned to Sotero.
                  </p>
                </div>
              )}

              <div className="p-3 bg-[#C8C5BD] border-2 border-[#161616] flex justify-between items-baseline my-4">
                <span className="text-xs font-bold uppercase text-[#555]">TOTAL CHARGE:</span>
                <span className="font-anton text-2xl text-[#161616]">₱{totalPrice.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#E8590C] hover:bg-[#161616] text-[#FFFFFF] font-anton text-lg tracking-widest uppercase border-2 border-[#161616] shadow-concrete-sm transition-all"
              >
                {isProcessing
                  ? 'COMMUNICATING WITH STRIPE...'
                  : paymentMode === 'STRIPE_CARD'
                  ? `AUTHORIZE & CHARGE ₱${totalPrice.toFixed(2)} VIA STRIPE →`
                  : 'PROCEED TO STRIPE CHECKOUT PAGE →'}
              </button>
            </form>
          </div>
        ) : (
          <div className="py-2 space-y-4 text-center">
            <div className="w-12 h-12 bg-[#161616] text-[#2ECC40] border-2 border-[#161616] flex items-center justify-center mx-auto font-anton text-2xl">
              ✓
            </div>

            <h3 className="font-anton text-2xl tracking-wider uppercase text-[#161616]">
              BOOKING CONFIRMED & CHARGED
            </h3>
            <div className="text-[10px] text-[#555] tracking-widest uppercase">
              TECHNICAL RECEIPT // ISSUED BY SOTERO ARCHITECTURE
            </div>

            {ticketReceipt.stripePaymentIntentId && (
              <div className="p-2.5 bg-[#161616] text-[#FFFFFF] text-left border-2 border-[#161616] text-[11px] space-y-1">
                <div className="flex justify-between items-center text-[#2ECC40] font-bold">
                  <span>✓ STRIPE PAYMENT SUCCEEDED</span>
                  <span className="text-[9px] bg-[#2ECC40] text-[#161616] px-1 font-mono uppercase font-bold">PAID</span>
                </div>
                <div className="text-gray-300 font-mono text-[10px] truncate">
                  INTENT: {ticketReceipt.stripePaymentIntentId}
                </div>
                <div className="text-gray-400 text-[9px]">
                  Method: Visa •••• 4242 | Verified on Stripe Test Gateway
                </div>
              </div>
            )}

            <div className="bg-[#C8C5BD] p-4 border-2 border-[#161616] text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#555]">TICKET REF:</span>
                <span className="font-bold text-[#E8590C]">{ticketReceipt.ticketId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">SEATS:</span>
                <span className="font-bold text-[#161616]">{ticketReceipt.seats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">HOLDER:</span>
                <span className="font-bold text-[#161616]">{ticketReceipt.holder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">TOTAL AMOUNT:</span>
                <span className="font-anton text-base text-[#161616]">₱{ticketReceipt.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">STATUS:</span>
                <span className="font-bold text-[#2ECC40]">
                  {ticketReceipt.stripeStatus === 'succeeded' ? 'PAID & CONFIRMED' : 'RESERVED'}
                </span>
              </div>
            </div>

            {/* Real 2D QR Code */}
            <div className="p-4 bg-[#D7D5CF] border-2 border-[#161616] flex flex-col items-center justify-center text-center space-y-2">
              <div className="px-2 py-0.5 text-[9px] bg-[#161616] text-[#2ECC40] font-bold uppercase tracking-widest border border-[#161616]">
                ✓ VERIFIED ENTRY PASS FOR UNIVERSITY OF ABRA ARENA
              </div>
              <div className="p-2 bg-[#FFFFFF] border-2 border-[#161616] inline-block shadow-sm">
                <QRCodeSVG
                  value={`sotero://ticket/${ticketReceipt.ticketId}`}
                  size={140}
                  bgColor="#FFFFFF"
                  fgColor="#161616"
                  level="H"
                />
              </div>
              <div className="text-[9px] font-bold text-[#161616] tracking-[0.2em] uppercase pt-1">
                sotero://ticket/{ticketReceipt.ticketId}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  onClose();
                  if (onViewTickets) onViewTickets();
                }}
                className="flex-1 py-3 bg-[#E8590C] text-[#FFFFFF] hover:bg-[#161616] font-anton text-sm tracking-widest uppercase border-2 border-[#161616] transition-colors"
              >
                VIEW IN MY TICKETS →
              </button>
              <button
                onClick={onClose}
                className="py-3 px-5 bg-[#161616] text-[#D7D5CF] hover:bg-[#333] font-anton text-sm tracking-widest uppercase border-2 border-[#161616] transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
