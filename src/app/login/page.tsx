'use client';

import { Container, Typography, Link } from '@mui/material';
import NextLink from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Iniciar Sesión</Typography>
      <LoginForm />
      <Typography sx={{ mt: 2 }}>
        ¿No tienes una cuenta?{' '}
        <Link component={NextLink} href="/register" color="primary" underline="hover">Regístrate</Link>
      </Typography>
    </Container>
  );
}
