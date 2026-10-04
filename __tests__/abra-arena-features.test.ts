import { GET as getEvents, POST as createEvent } from '@/app/api/v1/events/route';
import { POST as registerUser } from '@/app/api/v1/auth/signup/route';
import { POST as scanTicket } from '@/app/api/v1/admin/scan/route';
import { NextRequest } from 'next/server';

describe('University of Abra Arena: Multi-Event, Single Account Auth & On-Site Gate Scanner', () => {
  test('GET /api/v1/events returns University of Abra Arena multi-events list', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/events');
    const res = await getEvents(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.venue.name).toBe('University of Abra Arena');
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeGreaterThan(0);
  });

  test('POST /api/v1/events creates a new event for University of Abra Arena under ADMIN role', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'x-user-role': 'ADMIN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Abra University Cheer Dance Competition 2026',
        description: 'Vibrant inter-college dance showdown at Abra Arena.',
        eventDate: '2026-11-20T17:00:00.000Z',
      }),
    });

    const res = await createEvent(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.event.title).toContain('Cheer Dance Competition');
  });

  test('POST /api/v1/auth/signup enforces 1 account limit per user', async () => {
    const uniqueEmail = `test.student.${Date.now()}@abra.edu.ph`;

    // First signup succeeds
    const req1 = new NextRequest('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: uniqueEmail,
        fullName: 'Maria Santos',
        studentId: '2026-UA-9999',
      }),
    });

    const res1 = await registerUser(req1);
    const data1 = await res1.json();
    expect(res1.status).toBe(200);
    expect(data1.success).toBe(true);

    // Second signup with same email fails (Account limit 1 per user)
    const req2 = new NextRequest('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: uniqueEmail,
        fullName: 'Maria Santos Duplicate Attempt',
      }),
    });

    const res2 = await registerUser(req2);
    const data2 = await res2.json();
    expect(res2.status).toBe(409);
    expect(data2.error).toContain('REGISTRATION DENIED');
  });

  test('POST /api/v1/admin/scan computes on-site payment & authorizes gate entry', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/admin/scan', {
      method: 'POST',
      headers: {
        'x-user-role': 'ADMIN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId: 'res-sample-100',
      }),
    });

    const res = await scanTicket(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(['PAID_STRIPE', 'PAID_ON_SITE']).toContain(data.ticket.paymentStatus);
    expect(data.ticket.checkInStatus).toBe('CHECKED_IN');
    expect(typeof data.ticket.totalAmount).toBe('number');
  });
});
