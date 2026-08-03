'use client';

import { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import { MeasurementRow } from './MeasurementsTable';

export const UPDATE_MEASUREMENT = gql`
  mutation UpdateMeasurement($input: UpdateMeasurementInput!) {
    updateMeasurement(input: $input) {
      id
      recordedAt
      isBaseline
    }
  }
`;

interface FormState {
  recordedAt: string;
  weightKg: string;
  bmi: string;
  bodyFatPct: string;
  subcutaneousFatPct: string;
  visceralFatRating: string;
  skeletalMusclePct: string;
  muscleMassKg: string;
  proteinPct: string;
  bmr: string;
  metabolicAge: string;
}

function toFormState(measurement: MeasurementRow): FormState {
  return {
    recordedAt: measurement.recordedAt.slice(0, 10),
    weightKg: String(measurement.weightKg),
    bmi: String(measurement.bmi),
    bodyFatPct: String(measurement.bodyFatPct),
    subcutaneousFatPct: String(measurement.subcutaneousFatPct),
    visceralFatRating: String(measurement.visceralFatRating),
    skeletalMusclePct: String(measurement.skeletalMusclePct),
    muscleMassKg: String(measurement.muscleMassKg),
    proteinPct: measurement.proteinPct != null ? String(measurement.proteinPct) : '',
    bmr: measurement.bmr != null ? String(measurement.bmr) : '',
    metabolicAge: measurement.metabolicAge != null ? String(measurement.metabolicAge) : '',
  };
}

export function EditMeasurementDialog({
  measurement,
  onClose,
  onSaved,
}: {
  measurement: MeasurementRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState | null>(measurement ? toFormState(measurement) : null);
  const [updateMeasurement, { loading }] = useMutation(UPDATE_MEASUREMENT);

  useEffect(() => {
    setForm(measurement ? toFormState(measurement) : null);
  }, [measurement]);

  if (!measurement || !form) return null;

  function setField(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => (prev ? { ...prev, [field]: e.target.value } : prev));
  }

  async function handleSave() {
    if (!measurement || !form) return;
    await updateMeasurement({
      variables: {
        input: {
          id: measurement.id,
          recordedAt: new Date(form.recordedAt).toISOString(),
          weightKg: Number(form.weightKg),
          bmi: Number(form.bmi),
          bodyFatPct: Number(form.bodyFatPct),
          subcutaneousFatPct: Number(form.subcutaneousFatPct),
          visceralFatRating: Number(form.visceralFatRating),
          skeletalMusclePct: Number(form.skeletalMusclePct),
          muscleMassKg: Number(form.muscleMassKg),
          proteinPct: form.proteinPct ? Number(form.proteinPct) : null,
          bmr: form.bmr ? Number(form.bmr) : null,
          metabolicAge: form.metabolicAge ? Number(form.metabolicAge) : null,
        },
      },
    });
    onSaved();
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Editar Medición</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Fecha de la Medición"
            type="date"
            value={form.recordedAt}
            onChange={setField('recordedAt')}
            slotProps={{ inputLabel: { shrink: true } }}
            required
          />
          <TextField label="Peso (kg)" type="number" value={form.weightKg} onChange={setField('weightKg')} required />
          <TextField label="IMC" type="number" value={form.bmi} onChange={setField('bmi')} required />
          <TextField label="% Grasa Corporal" type="number" value={form.bodyFatPct} onChange={setField('bodyFatPct')} required />
          <TextField label="% Grasa Subcutánea" type="number" value={form.subcutaneousFatPct} onChange={setField('subcutaneousFatPct')} required />
          <TextField label="Nivel de Grasa Visceral" type="number" value={form.visceralFatRating} onChange={setField('visceralFatRating')} required />
          <TextField label="% Músculo Esquelético" type="number" value={form.skeletalMusclePct} onChange={setField('skeletalMusclePct')} required />
          <TextField label="Masa Muscular (kg)" type="number" value={form.muscleMassKg} onChange={setField('muscleMassKg')} required />
          <TextField label="% Proteína" type="number" value={form.proteinPct} onChange={setField('proteinPct')} />
          <TextField label="TMB" type="number" value={form.bmr} onChange={setField('bmr')} />
          <TextField label="Edad Metabólica" type="number" value={form.metabolicAge} onChange={setField('metabolicAge')} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
