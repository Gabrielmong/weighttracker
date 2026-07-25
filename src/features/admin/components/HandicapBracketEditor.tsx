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
      <Typography variant="h6">Age/Gender Handicap Brackets</Typography>
      {!loading && (
        <List>
          {data?.handicapBrackets.map((bracket) => (
            <ListItem key={bracket.id}>
              <ListItemText primary={`${bracket.gender}, ${bracket.minAge}-${bracket.maxAge}`} secondary={`×${bracket.multiplier}`} />
            </ListItem>
          ))}
        </List>
      )}
      <Stack direction="row" spacing={2}>
        <TextField select label="Gender" value={gender} onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}>
          <MenuItem value="MALE">Male</MenuItem>
          <MenuItem value="FEMALE">Female</MenuItem>
        </TextField>
        <TextField label="Min Age" type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
        <TextField label="Max Age" type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
        <TextField label="Multiplier" type="number" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
        <Button variant="contained" onClick={handleAdd}>Add / Update</Button>
      </Stack>
    </Stack>
  );
}
