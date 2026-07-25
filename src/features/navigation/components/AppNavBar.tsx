'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

interface NavLink {
  label: string;
  href: string;
}

export function AppNavBar() {
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  if (!session) return null;

  const sessionUser = session.user as { id?: string; isAdmin?: boolean } | undefined;

  const links: NavLink[] = [
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Record Measurement', href: '/measurements/new' },
    ...(sessionUser?.id ? [{ label: 'My Profile', href: `/users/${sessionUser.id}` }] : []),
    ...(sessionUser?.isAdmin ? [{ label: 'Admin', href: '/admin' }] : []),
  ];

  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={() => setDrawerOpen(true)}
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" sx={{ display: { xs: 'block', md: 'none' }, flexGrow: 1 }}>
          WeightTracker
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          {links.map((link) => (
            <Button key={link.href} component={Link} href={link.href} color="inherit">
              {link.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

        <Button color="inherit" onClick={() => signOut({ callbackUrl: '/login' })} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
          Log out
        </Button>
      </Toolbar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 240 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <List>
            {links.map((link) => (
              <ListItemButton key={link.href} component={Link} href={link.href}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
            <ListItemButton onClick={() => signOut({ callbackUrl: '/login' })}>
              <ListItemText primary="Log out" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
