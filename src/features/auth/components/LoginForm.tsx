'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Box, TextField, Button, Alert, Stack } from '@mui/material';

export function LoginForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const result = await signIn('credentials', { displayName, password, redirect: false });
    if (result?.ok) {
      router.push('/leaderboard');
    } else {
      setError('Nombre o contraseña inválidos.');
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nombre" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" variant="contained">Iniciar Sesión</Button>
      </Stack>
    </Box>
  );
}
