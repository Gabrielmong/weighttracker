'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { TextField, Button, Stack, Typography, MenuItem } from '@mui/material';

const UPDATE_METRIC_CONFIG = gql`
  mutation UpdateMetricConfig($input: UpdateMetricConfigInput!) {
    updateMetricConfig(input: $input)
  }
`;

const METRIC_KEYS = [
  'WEIGHT', 'BMI', 'BODY_FAT_PCT', 'SUBCUTANEOUS_FAT_PCT', 'VISCERAL_FAT_RATING',
  'SKELETAL_MUSCLE_PCT', 'MUSCLE_MASS_KG', 'PROTEIN_PCT', 'BMR', 'METABOLIC_AGE',
];

export function MetricConfigEditor() {
  const [metricKey, setMetricKey] = useState('BODY_FAT_PCT');
  const [weight, setWeight] = useState('1');
  const [directionType, setDirectionType] = useState<'FIXED' | 'GOAL_RELATIVE'>('FIXED');
  const [fixedDirection, setFixedDirection] = useState<'UP' | 'DOWN'>('DOWN');
  const [updateMetricConfig, { data }] = useMutation(UPDATE_METRIC_CONFIG);

  async function handleSave() {
    await updateMetricConfig({
      variables: {
        input: {
          metricKey,
          weight: Number(weight),
          directionType,
          fixedDirection: directionType === 'FIXED' ? fixedDirection : null,
        },
      },
    });
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Metric Weights</Typography>
      <TextField select label="Metric" value={metricKey} onChange={(e) => setMetricKey(e.target.value)}>
        {METRIC_KEYS.map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)}
      </TextField>
      <TextField label="Weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
      <TextField select label="Direction Type" value={directionType} onChange={(e) => setDirectionType(e.target.value as 'FIXED' | 'GOAL_RELATIVE')}>
        <MenuItem value="FIXED">Fixed</MenuItem>
        <MenuItem value="GOAL_RELATIVE">Goal-relative</MenuItem>
      </TextField>
      {directionType === 'FIXED' && (
        <TextField select label="Fixed Direction" value={fixedDirection} onChange={(e) => setFixedDirection(e.target.value as 'UP' | 'DOWN')}>
          <MenuItem value="UP">Up is improvement</MenuItem>
          <MenuItem value="DOWN">Down is improvement</MenuItem>
        </TextField>
      )}
      <Button variant="contained" onClick={handleSave}>Save</Button>
      {data ? <Typography color="success.main">Saved.</Typography> : null}
    </Stack>
  );
}
