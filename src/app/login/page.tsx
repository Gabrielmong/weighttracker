import { Container, Typography } from '@mui/material';
import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Log in</Typography>
      <LoginForm />
      <Typography sx={{ mt: 2 }}>
        Don&apos;t have an account? <Link href="/register">Sign up</Link>
      </Typography>
    </Container>
  );
}
