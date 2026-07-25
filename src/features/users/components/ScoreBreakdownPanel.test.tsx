import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel';

describe('ScoreBreakdownPanel', () => {
  it('lists each metric contribution and the final score', () => {
    render(
      <ScoreBreakdownPanel
        breakdown={{
          rawScore: 30,
          ageGenderMultiplier: 1.1,
          conditionMultipliers: [1.05],
          finalScore: 34.65,
          metricChanges: [{ metricKey: 'BODY_FAT_PCT', pctChange: 20 }],
        }}
      />
    );
    expect(screen.getByText('BODY_FAT_PCT')).toBeInTheDocument();
    expect(screen.getByText(/34.65/)).toBeInTheDocument();
  });
});
