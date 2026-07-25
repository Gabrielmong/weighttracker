import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MeasurementsTable } from './MeasurementsTable';

describe('MeasurementsTable', () => {
  it('renders one row per measurement with its date and values, marking the baseline', () => {
    render(
      <MeasurementsTable
        measurements={[
          {
            id: 'm1', recordedAt: '2026-01-01T00:00:00.000Z', weightKg: 90, bmi: 28, bodyFatPct: 25,
            subcutaneousFatPct: 18, visceralFatRating: 10, skeletalMusclePct: 32, muscleMassKg: 28,
            proteinPct: null, bmr: null, metabolicAge: null, isBaseline: true,
          },
          {
            id: 'm2', recordedAt: '2026-02-01T00:00:00.000Z', weightKg: 85, bmi: 26, bodyFatPct: 20,
            subcutaneousFatPct: 16, visceralFatRating: 8, skeletalMusclePct: 34, muscleMassKg: 29,
            proteinPct: 18, bmr: 1600, metabolicAge: 28, isBaseline: false,
          },
        ]}
      />
    );

    expect(screen.getByText('2026-01-01')).toBeInTheDocument();
    expect(screen.getByText('2026-02-01')).toBeInTheDocument();
    expect(screen.getByText('Línea Base')).toBeInTheDocument();
    expect(screen.getAllByText('90.0')).toHaveLength(1);
    expect(screen.getAllByText('85.0')).toHaveLength(1);
  });

  it('shows a friendly message when there are no measurements yet', () => {
    render(<MeasurementsTable measurements={[]} />);
    expect(screen.getByText(/no hay mediciones registradas/i)).toBeInTheDocument();
  });
});
