import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardTable } from './LeaderboardTable';

describe('LeaderboardTable', () => {
  it('renders rows ranked and shows the correct score type', () => {
    render(
      <LeaderboardTable
        rows={[
          { userId: '1', displayName: 'Alice', rank: 1, rawScore: 30, finalScore: 33 },
          { userId: '2', displayName: 'Bob', rank: 2, rawScore: 20, finalScore: 20 },
        ]}
        scoreType="FINAL"
        isPerMetric={false}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('33.00')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows the unhandicapped metric %% change column in per-metric mode', () => {
    render(
      <LeaderboardTable
        rows={[{ userId: '1', displayName: 'Alice', rank: 1, rawScore: 12.5, finalScore: 12.5, metricPctChange: 12.5 }]}
        scoreType="FINAL"
        isPerMetric
      />
    );
    expect(screen.getByText('12.50%')).toBeInTheDocument();
  });
});
