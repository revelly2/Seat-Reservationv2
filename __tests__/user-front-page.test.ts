import React from 'react';
import { UserFrontPage } from '@/components/UserFrontPage';
import {
  ArenaArchitecturalIsometric,
  TurnstileGateVectorIllustration,
  SeatSelectionHoldVector,
  ArenaAtmosphereFanVector,
} from '@/components/UserHomeVectorGraphics';

describe('User Home Page & Modernist Vector Graphics', () => {
  test('User home vector illustrations export valid React components', () => {
    expect(ArenaArchitecturalIsometric).toBeDefined();
    expect(TurnstileGateVectorIllustration).toBeDefined();
    expect(SeatSelectionHoldVector).toBeDefined();
    expect(ArenaAtmosphereFanVector).toBeDefined();
  });

  test('UserFrontPage exports a valid React component', () => {
    expect(UserFrontPage).toBeDefined();
    expect(typeof UserFrontPage).toBe('function');
  });
});
