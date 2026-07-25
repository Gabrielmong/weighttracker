'use client';

import { Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { MeasurementForm } from '@/features/measurements/components/MeasurementForm';

export default function NewMeasurementPage() {
  const router = useRouter();
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Registrar una Medición</Typography>
      <MeasurementForm onSaved={() => router.push('/leaderboard')} />
    </Container>
  );
}
