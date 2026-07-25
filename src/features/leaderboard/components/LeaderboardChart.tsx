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
      title={isPerMetric ? '% de Mejora en el Tiempo' : 'Puntaje en el Tiempo'}
      people={people}
      emptyMessage="Nadie ha registrado una medición de seguimiento todavía."
    />
  );
}
