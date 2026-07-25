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
          metricChanges: [{ metricKey: 'BODY_FAT_PCT', pctChange: 20, weight: 1.5, contribution: 30 }],
        }}
      />
    );
    expect(screen.getByText('% Grasa Corporal')).toBeInTheDocument();
    expect(screen.getAllByText(/34.65/).length).toBeGreaterThan(0);
  });

  it('shows the full formula with real numbers substituted in', () => {
    render(
      <ScoreBreakdownPanel
        breakdown={{
          rawScore: 30,
          ageGenderMultiplier: 1.1,
          conditionMultipliers: [1.05],
          finalScore: 34.65,
          metricChanges: [{ metricKey: 'BODY_FAT_PCT', pctChange: 20, weight: 1.5, contribution: 30 }],
        }}
      />
    );
    expect(screen.getByText(/Cómo se calcula esto/i)).toBeInTheDocument();
    expect(screen.getByText(/% Grasa Corporal: \+20\.00% × 1\.50 = \+30\.00/)).toBeInTheDocument();
    expect(screen.getByText(/= 30\.00 × 1\.10 × 1\.05/)).toBeInTheDocument();
  });
});
