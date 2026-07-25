import { ReactNode } from 'react';
import { ThemeRegistry } from '@/theme/ThemeRegistry';
import { Providers } from './providers';
import { AppNavBar } from '@/features/navigation/components/AppNavBar';

export const metadata = { title: 'WeightTracker' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ThemeRegistry>
            <AppNavBar />
            {children}
          </ThemeRegistry>
        </Providers>
      </body>
    </html>
  );
}
