'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container, Typography, CircularProgress, Stack, Box, Alert, TextField, MenuItem } from '@mui/material';
import { TimelineChart } from '@/features/users/components/TimelineChart';
import { ScoreBreakdownPanel, ScoreBreakdown } from '@/features/users/components/ScoreBreakdownPanel';
import { MeasurementsTable, MeasurementRow } from '@/features/measurements/components/MeasurementsTable';
import { METRIC_LABELS } from '@/features/scoring/metricLabels';
import { MetricKey } from '@/features/scoring/types';

interface TimelinePoint {
  recordedAt: string;
  metricChanges: { metricKey: string; pctChange: number; rawValue: number | null }[];
}

interface UserDetailQueryData {
  userDetail: {
    displayName: string;
    timeline: TimelinePoint[];
    scoreBreakdown: ScoreBreakdown | null;
  } | null;
}

interface MyMeasurementsQueryData {
  myMeasurements: MeasurementRow[];
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
          rawValue
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

const MY_MEASUREMENTS_QUERY = gql`
  query MyMeasurements {
    myMeasurements {
      id
      recordedAt
      weightKg
      bmi
      bodyFatPct
      subcutaneousFatPct
      visceralFatRating
      skeletalMusclePct
      muscleMassKg
      proteinPct
      bmr
      metabolicAge
      isBaseline
    }
  }
`;

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [metricKey, setMetricKey] = useState<MetricKey>('BODY_FAT_PCT');

  const { data, loading, error } = useQuery<UserDetailQueryData>(USER_DETAIL_QUERY, { variables: { userId: params.id } });

  const isOwnProfile = (session?.user as { id?: string } | undefined)?.id === params.id;
  const { data: myMeasurementsData } = useQuery<MyMeasurementsQueryData>(MY_MEASUREMENTS_QUERY, { skip: !isOwnProfile });

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">Failed to load this profile: {error.message}</Alert>;
  if (!data?.userDetail) return <Typography>User not found.</Typography>;

  const { displayName, timeline, scoreBreakdown } = data.userDetail;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>{displayName}</Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Box>
          {scoreBreakdown && <ScoreBreakdownPanel breakdown={scoreBreakdown} />}
        </Box>

        <Stack spacing={2}>
          <TextField
            select
            label="Chart Field"
            size="small"
            value={metricKey}
            onChange={(e) => setMetricKey(e.target.value as MetricKey)}
            sx={{ width: { xs: '100%', sm: 220 } }}
          >
            {Object.entries(METRIC_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key}>{label}</MenuItem>
            ))}
          </TextField>
          <TimelineChart timeline={timeline} metricKey={metricKey} />
        </Stack>
      </Box>

      {isOwnProfile && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>Your Measurements</Typography>
          <MeasurementsTable measurements={myMeasurementsData?.myMeasurements ?? []} />
        </Box>
      )}
    </Container>
  );
}
