'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Box, TextField, Button, MenuItem, Alert, Stack } from '@mui/material';

export function RegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [birthdate, setBirthdate] = useState('');
  const [weightGoal, setWeightGoal] = useState<'LOSE' | 'GAIN' | 'MAINTAIN'>('LOSE');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, password, gender, birthdate, weightGoal }),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? 'Registration failed.');
      return;
    }

    const signInResult = await signIn('credentials', { displayName, password, redirect: false });
    if (signInResult?.ok) {
      router.push('/leaderboard');
    } else {
      router.push('/login');
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <TextField select label="Gender" value={gender} onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}>
          <MenuItem value="MALE">Male</MenuItem>
          <MenuItem value="FEMALE">Female</MenuItem>
        </TextField>
        <TextField
          label="Birthdate"
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          required
        />
        <TextField
          select
          label="Goal"
          value={weightGoal}
          onChange={(e) => setWeightGoal(e.target.value as 'LOSE' | 'GAIN' | 'MAINTAIN')}
        >
          <MenuItem value="LOSE">Lose weight</MenuItem>
          <MenuItem value="GAIN">Gain weight</MenuItem>
          <MenuItem value="MAINTAIN">Maintain weight</MenuItem>
        </TextField>
        <Button type="submit" variant="contained">Create account</Button>
      </Stack>
    </Box>
  );
}
