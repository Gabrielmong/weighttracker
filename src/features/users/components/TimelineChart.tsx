'use client';

import { LineChart } from '@mui/x-charts/LineChart';
import { Paper, Typography } from '@mui/material';
import { METRIC_LABELS } from '@/features/scoring/metricLabels';
import { MetricKey } from '@/features/scoring/types';

interface MetricChange {
  metricKey: string;
  pctChange: number;
  rawValue?: number | null;
}

interface TimelinePoint {
  recordedAt: string;
  metricChanges: MetricChange[];
}

export function TimelineChart({ timeline, metricKey }: { timeline: TimelinePoint[]; metricKey: string }) {
  const points = timeline
    .map((point) => {
      const change = point.metricChanges.find((c) => c.metricKey === metricKey);
      return { recordedAt: point.recordedAt, pctChange: change?.pctChange, rawValue: change?.rawValue };
    })
    .filter((point): point is { recordedAt: string; pctChange: number; rawValue: number | null | undefined } => point.pctChange !== undefined);

  if (points.length === 0) {
    return <Typography color="text.secondary">Todavía no hay datos de {METRIC_LABELS[metricKey as MetricKey] ?? metricKey}.</Typography>;
  }

  const label = METRIC_LABELS[metricKey as MetricKey] ?? metricKey;

  return (
    <Paper sx={{ p: 2 }}>
      <LineChart
        xAxis={[{ data: points.map((_, i) => i), scaleType: 'point', valueFormatter: (i) => points[i]?.recordedAt.slice(0, 10) ?? '' }]}
        yAxis={[
          { id: 'pct', position: 'left', label: '% cambio' },
          { id: 'raw', position: 'right', label: label },
        ]}
        series={[
          { data: points.map((p) => p.pctChange), label: `${label} % cambio`, yAxisId: 'pct' },
          { data: points.map((p) => p.rawValue ?? null), label: `${label} (valor real)`, yAxisId: 'raw' },
        ]}
        height={300}
      />
    </Paper>
  );
}
