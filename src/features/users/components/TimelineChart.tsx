'use client';

import { LineChart } from '@mui/x-charts/LineChart';
import { Paper, Typography } from '@mui/material';

interface MetricChange {
  metricKey: string;
  pctChange: number;
}

interface TimelinePoint {
  recordedAt: string;
  metricChanges: MetricChange[];
}

export function TimelineChart({ timeline, metricKey }: { timeline: TimelinePoint[]; metricKey: string }) {
  const points = timeline
    .map((point) => ({
      recordedAt: point.recordedAt,
      value: point.metricChanges.find((c) => c.metricKey === metricKey)?.pctChange,
    }))
    .filter((point): point is { recordedAt: string; value: number } => point.value !== undefined);

  if (points.length === 0) {
    return <Typography color="text.secondary">No data yet for {metricKey}.</Typography>;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <LineChart
        xAxis={[{ data: points.map((_, i) => i), scaleType: 'point', valueFormatter: (i) => points[i]?.recordedAt.slice(0, 10) ?? '' }]}
        series={[{ data: points.map((p) => p.value), label: `${metricKey} % change` }]}
        height={300}
      />
    </Paper>
  );
}
