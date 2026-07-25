import { Table, TableHead, TableRow, TableCell, TableBody, Paper, Typography, Chip } from '@mui/material';

export interface MeasurementRow {
  id: string;
  recordedAt: string;
  weightKg: number;
  bmi: number;
  bodyFatPct: number;
  subcutaneousFatPct: number;
  visceralFatRating: number;
  skeletalMusclePct: number;
  muscleMassKg: number;
  proteinPct: number | null;
  bmr: number | null;
  metabolicAge: number | null;
  isBaseline: boolean;
}

function fmt(value: number): string {
  return value.toFixed(1);
}

export function MeasurementsTable({ measurements }: { measurements: MeasurementRow[] }) {
  if (measurements.length === 0) {
    return <Typography color="text.secondary">No measurements recorded yet.</Typography>;
  }

  const sorted = [...measurements].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const hasOptional = sorted.some((m) => m.proteinPct != null || m.bmr != null || m.metabolicAge != null);

  return (
    <Paper sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell align="right">Weight (kg)</TableCell>
            <TableCell align="right">BMI</TableCell>
            <TableCell align="right">Body Fat %</TableCell>
            <TableCell align="right">Subcut. Fat %</TableCell>
            <TableCell align="right">Visceral Fat</TableCell>
            <TableCell align="right">Skeletal Muscle %</TableCell>
            <TableCell align="right">Muscle Mass (kg)</TableCell>
            {hasOptional && <TableCell align="right">Protein %</TableCell>}
            {hasOptional && <TableCell align="right">BMR</TableCell>}
            {hasOptional && <TableCell align="right">Metabolic Age</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                {m.recordedAt.slice(0, 10)}
                {m.isBaseline && <Chip label="Baseline" size="small" color="primary" sx={{ ml: 1 }} />}
              </TableCell>
              <TableCell align="right">{fmt(m.weightKg)}</TableCell>
              <TableCell align="right">{fmt(m.bmi)}</TableCell>
              <TableCell align="right">{fmt(m.bodyFatPct)}</TableCell>
              <TableCell align="right">{fmt(m.subcutaneousFatPct)}</TableCell>
              <TableCell align="right">{fmt(m.visceralFatRating)}</TableCell>
              <TableCell align="right">{fmt(m.skeletalMusclePct)}</TableCell>
              <TableCell align="right">{fmt(m.muscleMassKg)}</TableCell>
              {hasOptional && <TableCell align="right">{m.proteinPct != null ? fmt(m.proteinPct) : '—'}</TableCell>}
              {hasOptional && <TableCell align="right">{m.bmr != null ? fmt(m.bmr) : '—'}</TableCell>}
              {hasOptional && <TableCell align="right">{m.metabolicAge ?? '—'}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
