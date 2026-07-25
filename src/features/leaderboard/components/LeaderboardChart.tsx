'use client';

import { BarChart } from '@mui/x-charts/BarChart';
import { Paper, Typography } from '@mui/material';
import { LeaderboardRowData } from './LeaderboardTable';

export function LeaderboardChart({
  rows,
  scoreType,
  isPerMetric,
}: {
  rows: LeaderboardRowData[];
  scoreType: 'RAW' | 'FINAL';
  isPerMetric: boolean;
}) {
  if (rows.length === 0) return null;

  const values = rows.map((row) =>
    isPerMetric ? row.metricPctChange ?? 0 : scoreType === 'RAW' ? row.rawScore : row.finalScore
  );

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {isPerMetric ? '% Improvement by Person' : 'Score by Person'}
      </Typography>
      <BarChart
        xAxis={[{ data: rows.map((row) => row.displayName), scaleType: 'band' }]}
        series={[{ data: values, label: isPerMetric ? '% improvement' : 'score' }]}
        height={300}
      />
    </Paper>
  );
}
