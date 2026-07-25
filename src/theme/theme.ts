import { createTheme } from '@mui/material/styles';
import { palette } from './palette';

export const theme = createTheme({
  palette,
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
});
