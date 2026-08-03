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
import { EditMeasurementDialog } from '@/features/measurements/components/EditMeasurementDialog';
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

interface UserMeasurementsQueryData {
  userMeasurements: MeasurementRow[];
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

const USER_MEASUREMENTS_QUERY = gql`
  query UserMeasurements($userId: ID!) {
    userMeasurements(userId: $userId) {
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
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementRow | null>(null);

  const { data, loading, error } = useQuery<UserDetailQueryData>(USER_DETAIL_QUERY, { variables: { userId: params.id } });

  const sessionUser = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  const isOwnProfile = sessionUser?.id === params.id;
  const isAdmin = !!sessionUser?.isAdmin;
  const canSeeMeasurements = isOwnProfile || isAdmin;

  const { data: measurementsData, refetch: refetchMeasurements } = useQuery<UserMeasurementsQueryData>(USER_MEASUREMENTS_QUERY, {
    variables: { userId: params.id },
    skip: !canSeeMeasurements,
  });

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">No se pudo cargar este perfil: {error.message}</Alert>;
  if (!data?.userDetail) return <Typography>Usuario no encontrado.</Typography>;

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
            label="Campo del Gráfico"
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

      {canSeeMeasurements && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>{isOwnProfile ? 'Tus Mediciones' : 'Mediciones'}</Typography>
          <MeasurementsTable
            measurements={measurementsData?.userMeasurements ?? []}
            canEdit={isAdmin}
            onEdit={setEditingMeasurement}
          />
        </Box>
      )}

      <EditMeasurementDialog
        measurement={editingMeasurement}
        onClose={() => setEditingMeasurement(null)}
        onSaved={() => {
          setEditingMeasurement(null);
          refetchMeasurements();
        }}
      />
    </Container>
  );
}
