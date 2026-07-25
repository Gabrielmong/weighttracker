'use client';

import { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { TextField, Button, Stack, Typography, MenuItem, CircularProgress } from '@mui/material';
import { METRIC_LABELS } from '@/features/scoring/metricLabels';

const METRIC_CONFIGS_QUERY = gql`
  query MetricConfigs {
    metricConfigs {
      metricKey
      weight
      directionType
      fixedDirection
    }
  }
`;

const UPDATE_METRIC_CONFIG = gql`
  mutation UpdateMetricConfig($input: UpdateMetricConfigInput!) {
    updateMetricConfig(input: $input)
  }
`;

interface MetricConfigsQueryData {
  metricConfigs: Array<{
    metricKey: string;
    weight: number;
    directionType: 'FIXED' | 'GOAL_RELATIVE';
    fixedDirection: 'UP' | 'DOWN' | null;
  }>;
}

export function MetricConfigEditor() {
  const [metricKey, setMetricKey] = useState('BODY_FAT_PCT');
  const [weight, setWeight] = useState('1');
  const [directionType, setDirectionType] = useState<'FIXED' | 'GOAL_RELATIVE'>('FIXED');
  const [fixedDirection, setFixedDirection] = useState<'UP' | 'DOWN'>('DOWN');

  const { data, loading, refetch } = useQuery<MetricConfigsQueryData>(METRIC_CONFIGS_QUERY);
  const [updateMetricConfig, { data: saveResult }] = useMutation(UPDATE_METRIC_CONFIG);

  useEffect(() => {
    const current = data?.metricConfigs.find((c) => c.metricKey === metricKey);
    if (current) {
      setWeight(String(current.weight));
      setDirectionType(current.directionType);
      setFixedDirection(current.fixedDirection ?? 'DOWN');
    }
  }, [metricKey, data]);

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
    await refetch();
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Pesos de Métricas</Typography>
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <>
          <TextField select label="Métrica" value={metricKey} onChange={(e) => setMetricKey(e.target.value)}>
            {Object.entries(METRIC_LABELS).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
          </TextField>
          <TextField label="Peso" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <TextField select label="Tipo de Dirección" value={directionType} onChange={(e) => setDirectionType(e.target.value as 'FIXED' | 'GOAL_RELATIVE')}>
            <MenuItem value="FIXED">Fija</MenuItem>
            <MenuItem value="GOAL_RELATIVE">Relativa a la meta</MenuItem>
          </TextField>
          {directionType === 'FIXED' && (
            <TextField select label="Dirección Fija" value={fixedDirection} onChange={(e) => setFixedDirection(e.target.value as 'UP' | 'DOWN')}>
              <MenuItem value="UP">Subir es mejorar</MenuItem>
              <MenuItem value="DOWN">Bajar es mejorar</MenuItem>
            </TextField>
          )}
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
          {saveResult ? <Typography color="success.main">Guardado.</Typography> : null}
        </>
      )}
    </Stack>
  );
}
