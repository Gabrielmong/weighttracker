import { ReactNode } from 'react';
import { ThemeRegistry } from '@/theme/ThemeRegistry';
import { Providers } from './providers';

export const metadata = { title: 'WeightTracker' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ThemeRegistry>{children}</ThemeRegistry>
        </Providers>
      </body>
    </html>
  );
}
