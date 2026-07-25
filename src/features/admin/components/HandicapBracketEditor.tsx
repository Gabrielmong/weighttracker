'use client';

import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { List, ListItem, ListItemText, TextField, Button, Stack, Typography, MenuItem } from '@mui/material';

const BRACKETS_QUERY = gql`
  query HandicapBrackets {
    handicapBrackets {
      id
      gender
      minAge
      maxAge
      multiplier
    }
  }
`;

const UPSERT_BRACKET = gql`
  mutation UpsertHandicapBracket($input: HandicapBracketInput!) {
    upsertHandicapBracket(input: $input) {
      id
      gender
      minAge
      maxAge
      multiplier
    }
  }
`;

interface HandicapBracketsQueryData {
  handicapBrackets: Array<{ id: string; gender: string; minAge: number; maxAge: number; multiplier: number }>;
}

export function HandicapBracketEditor() {
  const { data, loading } = useQuery<HandicapBracketsQueryData>(BRACKETS_QUERY);
  const [upsertBracket] = useMutation(UPSERT_BRACKET, { refetchQueries: [{ query: BRACKETS_QUERY }] });
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [minAge, setMinAge] = useState('45');
  const [maxAge, setMaxAge] = useState('120');
  const [multiplier, setMultiplier] = useState('1.2');

  async function handleAdd() {
    await upsertBracket({
      variables: { input: { gender, minAge: Number(minAge), maxAge: Number(maxAge), multiplier: Number(multiplier) } },
    });
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Rangos de Handicap por Edad/Género</Typography>
      {!loading && (
        <List>
          {data?.handicapBrackets.map((bracket) => (
            <ListItem key={bracket.id}>
              <ListItemText
                primary={`${bracket.gender === 'MALE' ? 'Hombre' : 'Mujer'}, ${bracket.minAge}-${bracket.maxAge}`}
                secondary={`×${bracket.multiplier}`}
              />
            </ListItem>
          ))}
        </List>
      )}
      <Stack direction="row" spacing={2}>
        <TextField select label="Género" value={gender} onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}>
          <MenuItem value="MALE">Masculino</MenuItem>
          <MenuItem value="FEMALE">Femenino</MenuItem>
        </TextField>
        <TextField label="Edad Mín." type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
        <TextField label="Edad Máx." type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
        <TextField label="Multiplicador" type="number" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
        <Button variant="contained" onClick={handleAdd}>Agregar / Actualizar</Button>
      </Stack>
    </Stack>
  );
}
