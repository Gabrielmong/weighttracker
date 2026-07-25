'use client';

import { LineChart } from '@mui/x-charts/LineChart';
import { Paper, Typography } from '@mui/material';

export interface PersonTimeline {
  userId: string;
  displayName: string;
  points: Array<{ recordedAt: string; value: number }>;
}

/**
 * Shared multi-person "line per person over time" chart. Builds one shared
 * date axis from the union of everyone's recorded dates and uses
 * connectNulls so a person's line skips days they didn't measure and
 * connects to their next real point, without fabricating data.
 */
export function MultiPersonTimelineChart({
  title,
  people,
  emptyMessage,
}: {
  title: string;
  people: PersonTimeline[];
  emptyMessage: string;
}) {
  const peopleWithData = people.filter((person) => person.points.length > 0);
  if (peopleWithData.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Paper>
    );
  }

  const allDates = Array.from(
    new Set(peopleWithData.flatMap((person) => person.points.map((point) => point.recordedAt.slice(0, 10))))
  ).sort();

  const dataset = allDates.map((date) => {
    const row: Record<string, string | number | null> = { date };
    for (const person of peopleWithData) {
      const match = person.points.find((p) => p.recordedAt.slice(0, 10) === date);
      row[person.userId] = match ? match.value : null;
    }
    return row;
  });

  const series = peopleWithData.map((person) => ({
    dataKey: person.userId,
    label: person.displayName,
    connectNulls: true,
  }));

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <LineChart
        dataset={dataset}
        xAxis={[{ dataKey: 'date', scaleType: 'point', label: 'Date' }]}
        series={series}
        height={350}
      />
    </Paper>
  );
}
