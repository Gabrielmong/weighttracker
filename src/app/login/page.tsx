import { Container, Typography } from '@mui/material';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Log in</Typography>
      <LoginForm />
    </Container>
  );
}
