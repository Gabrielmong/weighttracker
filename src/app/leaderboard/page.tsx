'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { Container, Typography, CircularProgress, Button, Alert, Box } from '@mui/material';
import Link from 'next/link';
import { LeaderboardTable, LeaderboardRowData } from '@/features/leaderboard/components/LeaderboardTable';
import { LeaderboardChart } from '@/features/leaderboard/components/LeaderboardChart';
import { FieldComparisonChart } from '@/features/leaderboard/components/FieldComparisonChart';
import { LeaderboardFilters, LeaderboardFilterState, ageBracketToRange } from '@/features/leaderboard/components/LeaderboardFilters';
import { MetricKey } from '@/features/scoring/types';

interface LeaderboardQueryData {
  leaderboard: LeaderboardRowData[];
}

const LEADERBOARD_QUERY = gql`
  query Leaderboard($gender: Gender, $scoreType: ScoreType, $minAge: Int, $maxAge: Int, $metricKey: String) {
    leaderboard(gender: $gender, scoreType: $scoreType, minAge: $minAge, maxAge: $maxAge, metricKey: $metricKey) {
      userId
      displayName
      rank
      rawScore
      finalScore
      metricPctChange
      timeline {
        recordedAt
        value
      }
    }
  }
`;

export default function LeaderboardPage() {
  const [filters, setFilters] = useState<LeaderboardFilterState>({
    gender: 'ALL',
    scoreType: 'FINAL',
    ageBracket: 'ALL',
    metricKey: 'COMBINED',
  });
  const [compareMetricKey, setCompareMetricKey] = useState<MetricKey>('WEIGHT');
  const { minAge, maxAge } = ageBracketToRange(filters.ageBracket);
  const gender = filters.gender === 'ALL' ? null : filters.gender;
  const { data, loading, error } = useQuery<LeaderboardQueryData>(LEADERBOARD_QUERY, {
    variables: {
      gender,
      scoreType: filters.scoreType,
      minAge: minAge ?? null,
      maxAge: maxAge ?? null,
      metricKey: filters.metricKey === 'COMBINED' ? null : filters.metricKey,
    },
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Leaderboard</Typography>
      <Button component={Link} href="/measurements/new" variant="contained" sx={{ mb: 2 }}>
        Record a Measurement
      </Button>
      <LeaderboardFilters
        value={filters}
        onChange={setFilters}
        compareMetricKey={compareMetricKey}
        onCompareMetricKeyChange={setCompareMetricKey}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load the leaderboard: {error.message}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        !error && (
          data?.leaderboard.length === 0 ? (
            <Typography color="text.secondary">No one has recorded a follow-up measurement yet.</Typography>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3,
                  mb: 3,
                  alignItems: 'start',
                }}
              >
                <LeaderboardChart
                  rows={data?.leaderboard ?? []}
                  isPerMetric={filters.metricKey !== 'COMBINED'}
                />
                <FieldComparisonChart gender={gender} minAge={minAge} maxAge={maxAge} metricKey={compareMetricKey} />
              </Box>
              <LeaderboardTable
                rows={data?.leaderboard ?? []}
                scoreType={filters.scoreType}
                isPerMetric={filters.metricKey !== 'COMBINED'}
              />
            </>
          )
        )
      )}
    </Container>
  );
}
