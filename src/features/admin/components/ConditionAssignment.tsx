'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';

export const USERS_QUERY = gql`
  query Users {
    users {
      id
      displayName
    }
  }
`;

export const CONDITIONS_QUERY = gql`
  query ConditionsForAssignment {
    conditions {
      id
      name
      description
      multiplier
    }
  }
`;

export const USER_CONDITION_IDS_QUERY = gql`
  query UserConditionIds($userId: ID!) {
    userConditionIds(userId: $userId)
  }
`;

export const ASSIGN_CONDITION = gql`
  mutation AssignConditionToUser($userId: ID!, $conditionId: ID!) {
    assignConditionToUser(userId: $userId, conditionId: $conditionId)
  }
`;

export const UNASSIGN_CONDITION = gql`
  mutation UnassignConditionFromUser($userId: ID!, $conditionId: ID!) {
    unassignConditionFromUser(userId: $userId, conditionId: $conditionId)
  }
`;

interface UsersQueryData {
  users: Array<{ id: string; displayName: string }>;
}

interface ConditionsQueryData {
  conditions: Array<{ id: string; name: string; description: string | null; multiplier: number }>;
}

interface UserConditionIdsQueryData {
  userConditionIds: string[];
}

export function ConditionAssignment() {
  const [userId, setUserId] = useState('');
  const { data: usersData, loading: usersLoading } = useQuery<UsersQueryData>(USERS_QUERY);
  const { data: conditionsData, loading: conditionsLoading } = useQuery<ConditionsQueryData>(CONDITIONS_QUERY);
  const { data: assignedData, loading: assignedLoading } = useQuery<UserConditionIdsQueryData>(USER_CONDITION_IDS_QUERY, {
    variables: { userId },
    skip: !userId,
  });

  const [assignCondition] = useMutation(ASSIGN_CONDITION, {
    refetchQueries: [{ query: USER_CONDITION_IDS_QUERY, variables: { userId } }],
  });
  const [unassignCondition] = useMutation(UNASSIGN_CONDITION, {
    refetchQueries: [{ query: USER_CONDITION_IDS_QUERY, variables: { userId } }],
  });

  const assignedIds = new Set(assignedData?.userConditionIds ?? []);

  async function handleToggle(conditionId: string, checked: boolean) {
    if (checked) {
      await assignCondition({ variables: { userId, conditionId } });
    } else {
      await unassignCondition({ variables: { userId, conditionId } });
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Asignar Condiciones de Salud</Typography>
      <FormControl sx={{ minWidth: 220 }}>
        <InputLabel id="assign-user-label">Seleccionar Usuario</InputLabel>
        <Select
          labelId="assign-user-label"
          label="Seleccionar Usuario"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        >
          {usersLoading && <MenuItem value="">Cargando…</MenuItem>}
          {usersData?.users.map((user) => (
            <MenuItem key={user.id} value={user.id}>{user.displayName}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {userId && (conditionsLoading || assignedLoading) && <CircularProgress size={24} />}

      {userId && !conditionsLoading && !assignedLoading && (
        <Stack>
          {conditionsData?.conditions.map((condition) => (
            <FormControlLabel
              key={condition.id}
              control={
                <Checkbox
                  checked={assignedIds.has(condition.id)}
                  onChange={(e) => handleToggle(condition.id, e.target.checked)}
                />
              }
              label={`${condition.name} (×${condition.multiplier})`}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
