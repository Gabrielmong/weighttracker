'use client';

import { AppBar, Toolbar, Button, Box } from '@mui/material';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function AppNavBar() {
  const { data: session } = useSession();
  if (!session) return null;

  const sessionUser = session.user as { id?: string; isAdmin?: boolean } | undefined;

  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2 }}>
        <Button component={Link} href="/leaderboard" color="inherit">Leaderboard</Button>
        <Button component={Link} href="/measurements/new" color="inherit">Record Measurement</Button>
        {sessionUser?.id && (
          <Button component={Link} href={`/users/${sessionUser.id}`} color="inherit">My Profile</Button>
        )}
        {sessionUser?.isAdmin && (
          <Button component={Link} href="/admin" color="inherit">Admin</Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button color="inherit" onClick={() => signOut({ callbackUrl: '/login' })}>Log out</Button>
      </Toolbar>
    </AppBar>
  );
}
