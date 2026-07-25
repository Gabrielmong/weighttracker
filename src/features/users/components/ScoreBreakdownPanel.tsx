import { Card, CardContent, Typography, Stack, Box, Chip } from '@mui/material';
import { METRIC_LABELS } from '@/features/scoring/metricLabels';
import { MetricKey } from '@/features/scoring/types';

interface MetricChange {
  metricKey: string;
  pctChange: number;
}

export interface ScoreBreakdown {
  rawScore: number;
  ageGenderMultiplier: number;
  conditionMultipliers: number[];
  finalScore: number;
  metricChanges: MetricChange[];
}

function metricLabel(metricKey: string): string {
  return METRIC_LABELS[metricKey as MetricKey] ?? metricKey;
}

export function ScoreBreakdownPanel({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>Metric Changes</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
            }}
          >
            {breakdown.metricChanges.map((change) => (
              <Box
                key={change.metricKey}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="body2" color="text.secondary">{metricLabel(change.metricKey)}</Typography>
                <Typography
                  variant="h6"
                  color={change.pctChange >= 0 ? 'success.main' : 'error.main'}
                >
                  {change.pctChange >= 0 ? '+' : ''}{change.pctChange.toFixed(2)}%
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>Score Summary</Typography>
          <Stack spacing={1}>
            <Typography>Raw score: {breakdown.rawScore.toFixed(2)}</Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip size="small" label={`Age/gender ×${breakdown.ageGenderMultiplier.toFixed(2)}`} />
              {breakdown.conditionMultipliers.map((multiplier, index) => (
                <Chip key={index} size="small" label={`Condition ×${multiplier.toFixed(2)}`} />
              ))}
            </Stack>
            <Typography variant="h4" color="primary" sx={{ mt: 1 }}>
              {breakdown.finalScore.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">Final score</Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
