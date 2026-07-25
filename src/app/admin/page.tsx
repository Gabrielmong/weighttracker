'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Container, Typography, Tabs, Tab, Box } from '@mui/material';
import { MetricConfigEditor } from '@/features/admin/components/MetricConfigEditor';
import { HandicapBracketEditor } from '@/features/admin/components/HandicapBracketEditor';
import { ConditionManager } from '@/features/admin/components/ConditionManager';
import { ConditionAssignment } from '@/features/admin/components/ConditionAssignment';

export default function AdminPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState(0);

  if (!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin) {
    return <Typography sx={{ mt: 4 }}>Se requiere acceso de administrador.</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Admin</Typography>
      <Tabs
        value={tab}
        onChange={(_e, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab label="Pesos de Métricas" />
        <Tab label="Rangos de Handicap" />
        <Tab label="Condiciones" />
        <Tab label="Asignar Condiciones" />
      </Tabs>
      <Box sx={{ mt: 3 }}>
        {tab === 0 && <MetricConfigEditor />}
        {tab === 1 && <HandicapBracketEditor />}
        {tab === 2 && <ConditionManager />}
        {tab === 3 && <ConditionAssignment />}
      </Box>
    </Container>
  );
}
