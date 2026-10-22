import React from 'react';
import { AdminAnalyticsDashboard, blockBreakdown } from '@/components/AdminAnalyticsDashboard';
import {
  HumanWalkingPhone,
  HumanScanningGate,
  HumanSeatedSpectator,
  HumanCheeringFan,
  HumanOperatorSupervisor,
  ArchitecturalConcourseBand,
} from '@/components/ArchitecturalHumanVectors';
import { UNIVERSITY_OF_ABRA_VENUE } from '@/lib/mock-data';

describe('Admin Analytics Dashboard & Architectural Human Vectors', () => {
  test('Architectural minimalist human vectors export valid React components', () => {
    expect(HumanWalkingPhone).toBeDefined();
    expect(HumanScanningGate).toBeDefined();
    expect(HumanSeatedSpectator).toBeDefined();
    expect(HumanCheeringFan).toBeDefined();
    expect(HumanOperatorSupervisor).toBeDefined();
    expect(ArchitecturalConcourseBand).toBeDefined();
  });

  test('AdminAnalyticsDashboard exports a valid React component', () => {
    expect(AdminAnalyticsDashboard).toBeDefined();
    expect(typeof AdminAnalyticsDashboard).toBe('function');
  });

  test('blockBreakdown counts booked seats per arena block and ignores old grid seats', () => {
    const sections = UNIVERSITY_OF_ABRA_VENUE.layoutConfig.sections;
    const rows = blockBreakdown(
      [{ seatIds: ['seat-VIP-C-10', 'seat-VIP-C-11', 'seat-BLK4-I-16', 'seat-D-3'] }, {}],
      sections
    );
    const byCode = Object.fromEntries(rows.map((r) => [r.code, r]));

    expect(rows).toHaveLength(8);
    expect(byCode.VIP).toMatchObject({ booked: 2, capacity: 175, price: 250, revenue: 500, occupancy: 1 });
    expect(byCode.BLK4).toMatchObject({ booked: 1, capacity: 112, revenue: 75 });
    expect(rows.reduce((n, r) => n + r.booked, 0)).toBe(3);
    expect(rows.reduce((n, r) => n + r.capacity, 0)).toBe(1854);
  });
});
