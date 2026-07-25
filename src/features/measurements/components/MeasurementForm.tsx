'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { Box, TextField, Button, Stack, Collapse, Link } from '@mui/material';

export const RECORD_MEASUREMENT = gql`
  mutation RecordMeasurement($input: RecordMeasurementInput!) {
    recordMeasurement(input: $input) {
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

const emptyForm: Omit<FormState, 'recordedAt'> = {
  weightKg: '', bmi: '', bodyFatPct: '', subcutaneousFatPct: '', visceralFatRating: '',
  skeletalMusclePct: '', muscleMassKg: '', proteinPct: '', bmr: '', metabolicAge: '',
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MeasurementForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<FormState>({ ...emptyForm, recordedAt: today() });
  const [showOptional, setShowOptional] = useState(false);
  const [recordMeasurement] = useMutation(RECORD_MEASUREMENT);

  function setField(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await recordMeasurement({
      variables: {
        input: {
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
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField
          label="Measurement Date"
          type="date"
          value={form.recordedAt}
          onChange={setField('recordedAt')}
          slotProps={{ inputLabel: { shrink: true } }}
          required
        />
        <TextField label="Weight (kg)" type="number" value={form.weightKg} onChange={setField('weightKg')} required />
        <TextField label="BMI" type="number" value={form.bmi} onChange={setField('bmi')} required />
        <TextField label="Body Fat %" type="number" value={form.bodyFatPct} onChange={setField('bodyFatPct')} required />
        <TextField label="Subcutaneous Fat %" type="number" value={form.subcutaneousFatPct} onChange={setField('subcutaneousFatPct')} required />
        <TextField label="Visceral Fat Rating" type="number" value={form.visceralFatRating} onChange={setField('visceralFatRating')} required />
        <TextField label="Skeletal Muscle %" type="number" value={form.skeletalMusclePct} onChange={setField('skeletalMusclePct')} required />
        <TextField label="Muscle Mass (kg)" type="number" value={form.muscleMassKg} onChange={setField('muscleMassKg')} required />

        <Link component="button" type="button" onClick={() => setShowOptional(!showOptional)}>
          {showOptional ? 'Hide' : 'Show'} optional fields
        </Link>
        <Collapse in={showOptional}>
          <Stack spacing={2}>
            <TextField label="Protein %" type="number" value={form.proteinPct} onChange={setField('proteinPct')} />
            <TextField label="BMR" type="number" value={form.bmr} onChange={setField('bmr')} />
            <TextField label="Metabolic Age" type="number" value={form.metabolicAge} onChange={setField('metabolicAge')} />
          </Stack>
        </Collapse>

        <Button type="submit" variant="contained">Save Measurement</Button>
      </Stack>
    </Box>
  );
}
