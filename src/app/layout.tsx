import { ReactNode } from 'react';
import { ThemeRegistry } from '@/theme/ThemeRegistry';

export const metadata = { title: 'WeightTracker' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
