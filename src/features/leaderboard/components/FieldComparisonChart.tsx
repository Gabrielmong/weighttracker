'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { TextField, MenuItem } from '@mui/material';
import { MultiPersonTimelineChart } from './MultiPersonTimelineChart';
import { METRIC_LABELS } from '@/features/scoring/metricLabels';
import { MetricKey } from '@/features/scoring/types';

const FIELD_COMPARISON_QUERY = gql`
  query LeaderboardFieldComparison($gender: Gender, $minAge: Int, $maxAge: Int, $metricKey: String) {
    leaderboard(gender: $gender, minAge: $minAge, maxAge: $maxAge, metricKey: $metricKey) {
      userId
      displayName
      timeline {
        recordedAt
        rawValue
      }
    }
  }
`;

interface FieldComparisonQueryData {
  leaderboard: Array<{
    userId: string;
    displayName: string;
    timeline: Array<{ recordedAt: string; rawValue: number | null }>;
  }>;
}

export function FieldComparisonChart({
  gender,
  minAge,
  maxAge,
}: {
  gender: 'MALE' | 'FEMALE' | null;
  minAge?: number;
  maxAge?: number;
}) {
  const [metricKey, setMetricKey] = useState<MetricKey>('WEIGHT');
  const { data } = useQuery<FieldComparisonQueryData>(FIELD_COMPARISON_QUERY, {
    variables: { gender, minAge: minAge ?? null, maxAge: maxAge ?? null, metricKey },
  });

  const people = (data?.leaderboard ?? []).map((row) => ({
    userId: row.userId,
    displayName: row.displayName,
    points: row.timeline
      .filter((point): point is { recordedAt: string; rawValue: number } => point.rawValue != null)
      .map((point) => ({ recordedAt: point.recordedAt, value: point.rawValue })),
  }));

  return (
    <MultiPersonTimelineChart
      title="Compare a Field Over Time"
      people={people}
      emptyMessage="No data yet for this field."
      headerContent={
        <TextField
          select
          label="Field"
          size="small"
          value={metricKey}
          onChange={(e) => setMetricKey(e.target.value as MetricKey)}
          sx={{ minWidth: 180 }}
        >
          {Object.entries(METRIC_LABELS).map(([key, label]) => (
            <MenuItem key={key} value={key}>{label}</MenuItem>
          ))}
        </TextField>
      }
    />
  );
}
