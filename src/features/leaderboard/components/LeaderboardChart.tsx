'use client';

import { LineChart } from '@mui/x-charts/LineChart';
import { Paper, Typography } from '@mui/material';
import { LeaderboardRowData } from './LeaderboardTable';

export function LeaderboardChart({
  rows,
  isPerMetric,
}: {
  rows: LeaderboardRowData[];
  isPerMetric: boolean;
}) {
  const rowsWithData = rows.filter((row) => row.timeline.length > 0);
  if (rowsWithData.length === 0) return null;

  const allDates = Array.from(
    new Set(rowsWithData.flatMap((row) => row.timeline.map((point) => point.recordedAt.slice(0, 10))))
  ).sort();

  const dataset = allDates.map((date) => {
    const point: Record<string, string | number | null> = { date };
    for (const row of rowsWithData) {
      const match = row.timeline.find((p) => p.recordedAt.slice(0, 10) === date);
      point[row.userId] = match ? match.value : null;
    }
    return point;
  });

  const series = rowsWithData.map((row) => ({
    dataKey: row.userId,
    label: row.displayName,
    connectNulls: true,
  }));

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {isPerMetric ? '% Improvement Over Time' : 'Score Over Time'}
      </Typography>
      <LineChart
        dataset={dataset}
        xAxis={[{ dataKey: 'date', scaleType: 'point', label: 'Date' }]}
        series={series}
        height={350}
      />
    </Paper>
  );
}
