'use client';

import { ReactNode } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Paper, Typography, Stack } from '@mui/material';

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
  headerContent,
}: {
  title: string;
  people: PersonTimeline[];
  emptyMessage: string;
  /** Rendered inline with the title (e.g. a field selector), right-aligned. */
  headerContent?: ReactNode;
}) {
  const header = (
    <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant="h6">{title}</Typography>
      {headerContent}
    </Stack>
  );

  const peopleWithData = people.filter((person) => person.points.length > 0);
  if (peopleWithData.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        {header}
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
      {header}
      <LineChart
        dataset={dataset}
        xAxis={[{ dataKey: 'date', scaleType: 'point', label: 'Fecha' }]}
        series={series}
        height={350}
      />
    </Paper>
  );
}
