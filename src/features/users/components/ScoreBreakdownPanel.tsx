import { Card, CardContent, Typography, Stack, Box, Chip, Divider } from '@mui/material';
import { METRIC_LABELS } from '@/features/scoring/metricLabels';
import { MetricKey } from '@/features/scoring/types';

interface MetricChange {
  metricKey: string;
  pctChange: number;
  weight?: number | null;
  contribution?: number | null;
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

function signed(value: number, digits = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
}

export function ScoreBreakdownPanel({ breakdown }: { breakdown: ScoreBreakdown }) {
  const conditionProduct = breakdown.conditionMultipliers.reduce((product, m) => product * m, 1);

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
                  {signed(change.pctChange)}%
                </Typography>
                {change.weight != null && change.contribution != null && (
                  <Typography variant="caption" color="text.secondary">
                    {signed(change.pctChange)}% × {change.weight.toFixed(2)} weight = {signed(change.contribution)} pts
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>Score Summary</Typography>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip size="small" label={`Age/gender ×${breakdown.ageGenderMultiplier.toFixed(2)}`} />
              {breakdown.conditionMultipliers.map((multiplier, index) => (
                <Chip key={index} size="small" label={`Condition ×${multiplier.toFixed(2)}`} />
              ))}
            </Stack>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2">How this is calculated</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              component="pre"
              sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0 }}
            >
              {'Raw score = Σ (metric % change × metric weight)\n'}
              {breakdown.metricChanges
                .map((c) => `  ${metricLabel(c.metricKey)}: ${signed(c.pctChange)}% × ${(c.weight ?? 0).toFixed(2)} = ${signed(c.contribution ?? 0)}`)
                .join('\n')}
              {`\n  = ${breakdown.rawScore.toFixed(2)}\n\n`}
              {'Final score = Raw score × Age/gender multiplier × Condition multipliers\n'}
              {`  = ${breakdown.rawScore.toFixed(2)} × ${breakdown.ageGenderMultiplier.toFixed(2)} × ${conditionProduct.toFixed(2)}\n`}
              {`  = ${breakdown.finalScore.toFixed(2)}`}
            </Typography>

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
