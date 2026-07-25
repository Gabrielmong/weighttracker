'use client';

import { Container, Typography, Link } from '@mui/material';
import NextLink from 'next/link';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Únete al Reto</Typography>
      <RegisterForm />
      <Typography sx={{ mt: 2 }}>
        ¿Ya tienes una cuenta?{' '}
        <Link component={NextLink} href="/login" color="primary" underline="hover">Inicia Sesión</Link>
      </Typography>
    </Container>
  );
}
