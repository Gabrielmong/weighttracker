'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
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
  metricKey,
}: {
  gender: 'MALE' | 'FEMALE' | null;
  minAge?: number;
  maxAge?: number;
  metricKey: MetricKey;
}) {
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
      title={`${METRIC_LABELS[metricKey]} Over Time`}
      people={people}
      emptyMessage="No data yet for this field."
    />
  );
}
