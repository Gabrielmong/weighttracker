'use client';

import { MultiPersonTimelineChart } from './MultiPersonTimelineChart';
import { LeaderboardRowData } from './LeaderboardTable';

export function LeaderboardChart({
  rows,
  isPerMetric,
}: {
  rows: LeaderboardRowData[];
  isPerMetric: boolean;
}) {
  const people = rows.map((row) => ({
    userId: row.userId,
    displayName: row.displayName,
    points: row.timeline.map((point) => ({ recordedAt: point.recordedAt, value: point.value })),
  }));

  return (
    <MultiPersonTimelineChart
      title={isPerMetric ? '% Improvement Over Time' : 'Score Over Time'}
      people={people}
      emptyMessage="No one has recorded a follow-up measurement yet."
    />
  );
}
