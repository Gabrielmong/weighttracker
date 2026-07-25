'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { Container, Typography, CircularProgress, Button, Alert } from '@mui/material';
import Link from 'next/link';
import { LeaderboardTable, LeaderboardRowData } from '@/features/leaderboard/components/LeaderboardTable';
import { LeaderboardChart } from '@/features/leaderboard/components/LeaderboardChart';
import { LeaderboardFilters, LeaderboardFilterState, ageBracketToRange } from '@/features/leaderboard/components/LeaderboardFilters';

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
  const { minAge, maxAge } = ageBracketToRange(filters.ageBracket);
  const { data, loading, error } = useQuery<LeaderboardQueryData>(LEADERBOARD_QUERY, {
    variables: {
      gender: filters.gender === 'ALL' ? null : filters.gender,
      scoreType: filters.scoreType,
      minAge: minAge ?? null,
      maxAge: maxAge ?? null,
      metricKey: filters.metricKey === 'COMBINED' ? null : filters.metricKey,
    },
  });

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Leaderboard</Typography>
      <Button component={Link} href="/measurements/new" variant="contained" sx={{ mb: 2 }}>
        Record a Measurement
      </Button>
      <LeaderboardFilters value={filters} onChange={setFilters} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load the leaderboard: {error.message}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        !error && (
          data?.leaderboard.length === 0 ? (
            <Typography color="text.secondary">No one has recorded a follow-up measurement yet.</Typography>
          ) : (
            <>
              <LeaderboardChart
                rows={data?.leaderboard ?? []}
                isPerMetric={filters.metricKey !== 'COMBINED'}
              />
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
