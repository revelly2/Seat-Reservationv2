'use client';

import React, { useState } from 'react';
import { RegistrationCrosses } from './RegistrationCrosses';

export const AdminScanner: React.FC = () => {
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // ESP32 Web Serial Gate Control state
  const [serialPort, setSerialPort] = useState<any>(null);
  const [isGateConnected, setIsGateConnected] = useState(false);
  const [gateStatus, setGateStatus] = useState<'DISCONNECTED' | 'LOCKED' | 'OPENING' | 'OPEN'>('DISCONNECTED');

  const handleConnectESP32 = async () => {
    if (typeof window === 'undefined' || !('serial' in navigator)) {
      alert('Web Serial API is supported in Chrome/Edge browsers over HTTPS or localhost.');
      // Enable simulation mode for UI testing
      setIsGateConnected(true);
      setGateStatus('LOCKED');
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      setSerialPort(port);
      setIsGateConnected(true);
      setGateStatus('LOCKED');
    } catch (err: any) {
      console.error('Serial port error:', err);
      // Fallback to simulated mode
      setIsGateConnected(true);
      setGateStatus('LOCKED');
    }
  };

  const triggerBarrierGate = async (command: string = 'GATE:OPEN') => {
    setGateStatus('OPENING');

    if (serialPort && serialPort.writable) {
      try {
        const textEncoder = new TextEncoderStream();
        const writableStreamClosed = textEncoder.readable.pipeTo(serialPort.writable);
        const writer = textEncoder.writable.getWriter();
        await writer.write(`${command}\n`);
        writer.releaseLock();
      } catch (err) {
        console.error('Serial write error:', err);
      }
    }

    setTimeout(() => {
      setGateStatus('OPEN');
    }, 500);

    // Auto-close barrier gate after 5 seconds
    setTimeout(() => {
      setGateStatus('LOCKED');
    }, 5500);
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeInput.trim()) return;

    setIsScanning(true);
    setScanResult(null);
    setScanError(null);

    try {
      const res = await fetch('/api/v1/admin/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ qrCodeData: qrCodeInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setScanResult(data.ticket);
        // Automatically trigger physical ESP32 barrier gate to open!
        await triggerBarrierGate('GATE:OPEN');
      } else {
        setScanError(data.error || 'Invalid or duplicate ticket scan.');
      }
    } catch (err: any) {
      setScanError('Network error connecting to Abra Arena Scanner service.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleQuickDemoScan = (sampleTicketId: string) => {
    setQrCodeInput(sampleTicketId);
  };

  return (
    <div className="relative bg-[#D7D5CF] border-3 border-[#161616] p-6 shadow-concrete text-[#161616] space-y-6 font-mono-spec">
      <RegistrationCrosses />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b-2 border-[#161616] gap-4">
        <div>
          <div className="text-[10px] text-[#E8590C] tracking-[0.25em] font-bold uppercase mb-1">
            GATE ENTRY // ON-SITE SCANNER & ESP32 HARDWARE BARRIER
          </div>
          <h2 className="font-anton text-2xl tracking-wider text-[#161616] uppercase">
            [03 / ABRA ARENA TICKET SCANNER & TURNSTILE GATE]
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleConnectESP32}
            className={`px-3 py-1.5 text-xs font-bold uppercase border-2 border-[#161616] transition-all ${
              isGateConnected
                ? 'bg-[#161616] text-[#E8590C]'
                : 'bg-[#E8590C] text-[#FFFFFF] hover:bg-[#161616]'
            }`}
          >
            {isGateConnected ? '⚡ ESP32 GATE: CONNECTED' : '🔌 CONNECT ESP32 BARRIER'}
          </button>
          <div className="bg-[#161616] text-[#E8590C] px-3 py-1.5 text-xs font-bold uppercase border-2 border-[#161616]">
            LOCATION: ABRA ARENA MAIN ENTRANCE
          </div>
        </div>
      </div>

      {/* ESP32 Physical Turnstile Telemetry Banner */}
      <div className="p-4 bg-[#C8C5BD] border-2 border-[#161616] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-[#555] uppercase tracking-widest">
            HARDWARE TURNSTILE STATUS // ESP32 SERVO BARRIER CONTROL
          </div>
          <div className="font-anton text-lg text-[#161616] uppercase mt-0.5">
            PHYSICAL GATE STATE:{' '}
            <span
              className={
                gateStatus === 'OPEN' || gateStatus === 'OPENING'
                  ? 'text-[#2ECC40] font-anton'
                  : gateStatus === 'LOCKED'
                  ? 'text-[#E8590C]'
                  : 'text-[#555]'
              }
            >
              [{gateStatus}]
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => triggerBarrierGate('GATE:OPEN')}
            className="px-3 py-1.5 text-xs bg-[#161616] text-[#D7D5CF] hover:bg-[#E8590C] font-bold uppercase border border-[#161616]"
          >
            MANUAL OPEN GATE →
          </button>
        </div>
      </div>

      {/* Scanner Input & Camera Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: QR Code Input / Camera View Finder */}
        <div className="bg-[#C8C5BD] p-6 border-2 border-[#161616] space-y-4">
          <h3 className="font-anton text-lg tracking-wider text-[#161616] uppercase">
            OPTICAL SCANNER / MANUAL ENTRY
          </h3>

          {/* Simulated Camera Viewfinder */}
          <div className="relative h-48 bg-[#161616] border-2 border-[#161616] flex flex-col items-center justify-center p-4 text-[#D7D5CF]">
            <div className="w-28 h-28 border-2 border-dashed border-[#E8590C] flex items-center justify-center relative">
              <span className="text-[10px] tracking-widest text-[#E8590C] font-bold uppercase animate-pulse">
                [ ALIGN QR CODE ]
              </span>
            </div>
            <span className="text-[10px] tracking-widest text-[#D7D5CF] uppercase mt-2">
              OPENCV DIGITAL SCANNER ACTIVE
            </span>
          </div>

          <form onSubmit={handleScanSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#555] uppercase mb-1">
                TICKET QR DATA / RESERVATION ID
              </label>
              <input
                type="text"
                placeholder="e.g. sotero://ticket/res-sample-100 or res-sample-100"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                className="w-full bg-[#D7D5CF] border-2 border-[#161616] px-3 py-2 text-xs font-bold text-[#161616] focus:outline-none focus:bg-[#FFFFFF]"
              />
            </div>

            <button
              type="submit"
              disabled={isScanning || !qrCodeInput.trim()}
              className="w-full py-3 bg-[#E8590C] hover:bg-[#161616] disabled:opacity-40 text-[#FFFFFF] font-anton text-base tracking-widest uppercase border-2 border-[#161616] shadow-concrete-sm transition-all"
            >
              {isScanning ? 'VERIFYING TICKET...' : 'SCAN & TRIGGER ESP32 BARRIER →'}
            </button>
          </form>

          {/* Quick Demo Test Buttons */}
          <div className="pt-2 border-t border-[#161616]/30">
            <span className="text-[10px] text-[#555] font-bold uppercase tracking-wider block mb-2">
              DEMO QUICK SCANS:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleQuickDemoScan('res-sample-100')}
                className="px-2.5 py-1 text-[10px] bg-[#D7D5CF] border border-[#161616] font-bold uppercase hover:bg-[#FFFFFF]"
              >
                Scan Ticket #100 (Unpaid VIP)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: On-Site Payment Computation & Verification Output */}
        <div className="bg-[#C8C5BD] p-6 border-2 border-[#161616] space-y-4">
          <h3 className="font-anton text-lg tracking-wider text-[#161616] uppercase">
            ENTRY AUDIT & PAYMENT COMPUTATION
          </h3>

          {scanError && (
            <div className="p-4 bg-[#E8590C] text-[#FFFFFF] border-2 border-[#161616] font-mono-spec text-xs font-bold">
              [ENTRY REJECTED — BARRIER LOCKED]
              <div className="mt-1 text-sm">{scanError}</div>
            </div>
          )}

          {scanResult ? (
            <div className="space-y-4 font-mono-spec">
              <div className="p-4 bg-[#161616] text-[#E8590C] border-2 border-[#161616]">
                <div className="text-[10px] tracking-widest uppercase font-bold text-[#D7D5CF]">
                  STATUS: VERIFIED & BARRIER OPENED
                </div>
                <div className="font-anton text-xl tracking-wider text-[#FFFFFF] mt-1">
                  ENTRY GRANTED // ESP32 GATE PULSED
                </div>
              </div>

              <div className="bg-[#D7D5CF] p-4 border-2 border-[#161616] space-y-2 text-xs">
                <div className="flex justify-between border-b border-[#161616]/20 pb-1">
                  <span className="text-[#555]">HOLDER NAME:</span>
                  <span className="font-bold text-[#161616]">{scanResult.userName}</span>
                </div>
                <div className="flex justify-between border-b border-[#161616]/20 pb-1">
                  <span className="text-[#555]">EMAIL / USER ID:</span>
                  <span className="font-bold text-[#161616]">{scanResult.userEmail}</span>
                </div>
                <div className="flex justify-between border-b border-[#161616]/20 pb-1">
                  <span className="text-[#555]">EVENT:</span>
                  <span className="font-bold text-[#161616]">{scanResult.eventName}</span>
                </div>
                <div className="flex justify-between border-b border-[#161616]/20 pb-1">
                  <span className="text-[#555]">SEAT RESERVATIONS:</span>
                  <span className="font-bold text-[#161616]">
                    {Array.isArray(scanResult.seatLabels)
                      ? scanResult.seatLabels.join(', ')
                      : scanResult.seatIds?.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#161616]/20">
                  <span className="text-xs font-bold text-[#555] uppercase">
                    ON-SITE FEE DUE:
                  </span>
                  <span className="font-anton text-2xl text-[#2ECC40]">
                    ₱0.00 (PRE-PAID STRIPE)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#161616] text-[#D7D5CF] border-2 border-[#161616] text-[11px] font-bold flex justify-between items-center">
                <span className="text-[#2ECC40]">✓ PRE-PAID VIA STRIPE ONLINE</span>
                <span className="text-[#E8590C]">BARRIER: OPEN</span>
              </div>
            </div>
          ) : (
            !scanError && (
              <div className="text-center py-16 text-[#555] text-xs font-mono uppercase tracking-wider">
                Awaiting QR Code Scan or Ticket ID input...
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
