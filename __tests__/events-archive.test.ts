import { NextRequest } from 'next/server';

// In-memory Supabase stand-in that records writes, so these tests never touch the real events table.
let events: any[] = [];
const calls: { op: string; args: any[] }[] = [];
jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: () => {
      let op = 'select';
      let patch: any = null;
      const filters: Array<(r: any) => boolean> = [];
      const q: any = {
        select: () => q,
        order: () => q,
        upsert: async () => ({ error: null }),
        update: (p: any) => { op = 'update'; patch = p; return q; },
        delete: () => { op = 'delete'; return q; },
        in: (k: string, v: any[]) => { calls.push({ op: `${op}.in`, args: [k, v] }); filters.push((r) => v.includes(r[k])); return q; },
        eq: (k: string, v: any) => { filters.push((r) => r[k] === v); return q; },
        lt: (k: string, v: any) => { calls.push({ op: `${op}.lt`, args: [k, v] }); filters.push((r) => r[k] < v); return q; },
        then: (resolve: any) => {
          const hit = events.filter((r) => filters.every((f) => f(r)));
          if (op === 'update') hit.forEach((r) => Object.assign(r, patch));
          if (op === 'delete') events = events.filter((r) => !hit.includes(r));
          return resolve({ data: op === 'select' && !filters.length ? events : hit, error: null });
        },
      };
      return q;
    },
  },
}));

import { GET, DELETE } from '@/app/api/v1/events/route';

const ev = (id: string, event_date: string, status: string) => ({ id, title: id, event_date, status, venue_id: 'v' });

beforeEach(() => {
  // 2026-11-21 17:00 in Manila (UTC+8)
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }).setSystemTime(new Date('2026-11-21T09:00:00Z'));
  calls.length = 0;
  events = [
    ev('yesterday-upcoming', '2026-11-20T10:00:00.000Z', 'UPCOMING'),
    ev('today-ongoing', '2026-11-21T08:00:00.000Z', 'ONGOING'),
    ev('today-started-upcoming', '2026-11-21T08:30:00.000Z', 'UPCOMING'),
    ev('today-1am-manila', '2026-11-20T17:00:00.000Z', 'UPCOMING'), // still Nov 20 in UTC, Nov 21 at the venue
    ev('old-completed', '2026-11-19T10:00:00.000Z', 'COMPLETED'),
    ev('next-week', '2026-11-28T10:00:00.000Z', 'UPCOMING'),
  ];
});
afterEach(() => jest.useRealTimers());

const status = (id: string) => events.find((e) => e.id === id)?.status;

describe('GET /api/v1/events archiving', () => {
  test('ignores autoPurge and never deletes events', async () => {
    await GET(new NextRequest('http://localhost/api/v1/events?autoPurge=true'));
    expect(calls.some((c) => c.op.startsWith('delete'))).toBe(false);
    expect(events).toHaveLength(6);
  });

  test('archives only UPCOMING events whose day has ended at the venue', async () => {
    const res = await GET(new NextRequest('http://localhost/api/v1/events'));
    const listed = (await res.json()).events.map((e: any) => e.id);

    expect(status('yesterday-upcoming')).toBe('ARCHIVED');
    expect(status('today-ongoing')).toBe('ONGOING');
    expect(status('today-started-upcoming')).toBe('UPCOMING');
    expect(status('today-1am-manila')).toBe('UPCOMING');
    expect(status('old-completed')).toBe('COMPLETED');
    expect(listed.sort()).toEqual(['next-week', 'today-1am-manila', 'today-ongoing', 'today-started-upcoming']);
  });
});

describe('DELETE /api/v1/events purge', () => {
  test('deletes only events from before today at the venue', async () => {
    const req = new NextRequest('http://localhost/api/v1/events?action=purge-outdated', { method: 'DELETE', headers: { 'x-user-role': 'ADMIN' } });
    const data = await (await DELETE(req)).json();

    expect(data.deletedCount).toBe(2);
    expect(events.map((e) => e.id).sort()).toEqual(['next-week', 'today-1am-manila', 'today-ongoing', 'today-started-upcoming']);
  });
});
