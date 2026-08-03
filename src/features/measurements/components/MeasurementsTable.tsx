import { Table, TableHead, TableRow, TableCell, TableBody, Paper, Typography, Chip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

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

export function MeasurementsTable({
  measurements,
  canEdit = false,
  onEdit,
}: {
  measurements: MeasurementRow[];
  /** Only an admin may edit a recorded measurement. */
  canEdit?: boolean;
  onEdit?: (measurement: MeasurementRow) => void;
}) {
  if (measurements.length === 0) {
    return <Typography color="text.secondary">Todavía no hay mediciones registradas.</Typography>;
  }

  const sorted = [...measurements].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const hasOptional = sorted.some((m) => m.proteinPct != null || m.bmr != null || m.metabolicAge != null);

  return (
    <Paper sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell align="right">Peso (kg)</TableCell>
            <TableCell align="right">IMC</TableCell>
            <TableCell align="right">% Grasa Corporal</TableCell>
            <TableCell align="right">% Grasa Subcut.</TableCell>
            <TableCell align="right">Grasa Visceral</TableCell>
            <TableCell align="right">% Músculo Esquelético</TableCell>
            <TableCell align="right">Masa Muscular (kg)</TableCell>
            {hasOptional && <TableCell align="right">% Proteína</TableCell>}
            {hasOptional && <TableCell align="right">TMB</TableCell>}
            {hasOptional && <TableCell align="right">Edad Metabólica</TableCell>}
            {canEdit && <TableCell align="right"></TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                {m.recordedAt.slice(0, 10)}
                {m.isBaseline && <Chip label="Línea Base" size="small" color="primary" sx={{ ml: 1 }} />}
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
              {canEdit && (
                <TableCell align="right">
                  <IconButton aria-label="Editar" size="small" onClick={() => onEdit?.(m)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
