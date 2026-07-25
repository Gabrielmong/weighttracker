import { Paper, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

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

export function ScoreBreakdownPanel({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Score Breakdown</Typography>
      <List dense>
        {breakdown.metricChanges.map((change) => (
          <ListItem key={change.metricKey}>
            <ListItemText primary={change.metricKey} secondary={`${change.pctChange.toFixed(2)}% improvement`} />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
      <Typography>Raw score: {breakdown.rawScore.toFixed(2)}</Typography>
      <Typography>Age/gender multiplier: ×{breakdown.ageGenderMultiplier.toFixed(2)}</Typography>
      {breakdown.conditionMultipliers.map((multiplier, index) => (
        <Typography key={index}>Condition multiplier: ×{multiplier.toFixed(2)}</Typography>
      ))}
      <Typography variant="h6" sx={{ mt: 1 }}>Final score: {breakdown.finalScore.toFixed(2)}</Typography>
    </Paper>
  );
}
