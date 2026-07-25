'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useParams } from 'next/navigation';
import { Container, Typography, CircularProgress, Stack, Alert } from '@mui/material';
import { TimelineChart } from '@/features/users/components/TimelineChart';
import { ScoreBreakdownPanel, ScoreBreakdown } from '@/features/users/components/ScoreBreakdownPanel';

interface TimelinePoint {
  recordedAt: string;
  metricChanges: { metricKey: string; pctChange: number }[];
}

interface UserDetailQueryData {
  userDetail: {
    displayName: string;
    timeline: TimelinePoint[];
    scoreBreakdown: ScoreBreakdown | null;
  } | null;
}

const USER_DETAIL_QUERY = gql`
  query UserDetail($userId: ID!) {
    userDetail(userId: $userId) {
      displayName
      timeline {
        recordedAt
        metricChanges {
          metricKey
          pctChange
        }
      }
      scoreBreakdown {
        rawScore
        ageGenderMultiplier
        conditionMultipliers
        finalScore
        metricChanges {
          metricKey
          pctChange
          weight
          contribution
        }
      }
    }
  }
`;

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<UserDetailQueryData>(USER_DETAIL_QUERY, { variables: { userId: params.id } });

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">Failed to load this profile: {error.message}</Alert>;
  if (!data?.userDetail) return <Typography>User not found.</Typography>;

  const { displayName, timeline, scoreBreakdown } = data.userDetail;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>{displayName}</Typography>
      <Stack spacing={3}>
        {scoreBreakdown && <ScoreBreakdownPanel breakdown={scoreBreakdown} />}
        <TimelineChart timeline={timeline} metricKey="BODY_FAT_PCT" />
      </Stack>
    </Container>
  );
}
