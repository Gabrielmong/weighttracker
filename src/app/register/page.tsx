import { Container, Typography } from '@mui/material';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Join the Challenge</Typography>
      <RegisterForm />
    </Container>
  );
}
