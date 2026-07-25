'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { List, ListItem, ListItemText, TextField, Button, Stack, Typography } from '@mui/material';

export const CONDITIONS_QUERY = gql`
  query Conditions {
    conditions {
      id
      name
      description
      multiplier
    }
  }
`;

export const CREATE_CONDITION = gql`
  mutation CreateCondition($input: ConditionInput!) {
    createCondition(input: $input) {
      id
      name
      description
      multiplier
    }
  }
`;

interface ConditionsQueryData {
  conditions: Array<{ id: string; name: string; description: string | null; multiplier: number }>;
}

export function ConditionManager() {
  const { data, loading } = useQuery<ConditionsQueryData>(CONDITIONS_QUERY);
  const [createCondition] = useMutation(CREATE_CONDITION, {
    refetchQueries: [{ query: CONDITIONS_QUERY }],
  });
  const [name, setName] = useState('');
  const [multiplier, setMultiplier] = useState('');

  async function handleAdd() {
    await createCondition({ variables: { input: { name, description: null, multiplier: Number(multiplier) } } });
    setName('');
    setMultiplier('');
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Condiciones de Salud</Typography>
      {!loading && (
        <List>
          {data?.conditions.map((condition) => (
            <ListItem key={condition.id}>
              <ListItemText primary={condition.name} secondary={`×${condition.multiplier}`} />
            </ListItem>
          ))}
        </List>
      )}
      <Stack direction="row" spacing={2}>
        <TextField label="Nombre de la Condición" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Multiplicador" type="number" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
        <Button variant="contained" onClick={handleAdd}>Agregar Condición</Button>
      </Stack>
    </Stack>
  );
}
