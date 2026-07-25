import { Container, Typography } from '@mui/material';
import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Join the Challenge</Typography>
      <RegisterForm />
      <Typography sx={{ mt: 2 }}>
        Already have an account? <Link href="/login">Log in</Link>
      </Typography>
    </Container>
  );
}
