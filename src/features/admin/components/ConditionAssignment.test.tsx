import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  ConditionAssignment,
  USERS_QUERY,
  CONDITIONS_QUERY,
  USER_CONDITION_IDS_QUERY,
  ASSIGN_CONDITION,
  UNASSIGN_CONDITION,
} from './ConditionAssignment';

describe('ConditionAssignment', () => {
  it('lets an admin pick a user, then toggle a condition on for that user', async () => {
    const mocks = [
      { request: { query: USERS_QUERY }, result: { data: { users: [{ id: 'u1', displayName: 'Alice' }] } } },
      { request: { query: CONDITIONS_QUERY }, result: { data: { conditions: [{ id: 'c1', name: 'Hypothyroidism', description: null, multiplier: 1.15 }] } } },
      { request: { query: USER_CONDITION_IDS_QUERY, variables: { userId: 'u1' } }, result: { data: { userConditionIds: [] } } },
      {
        request: { query: ASSIGN_CONDITION, variables: { userId: 'u1', conditionId: 'c1' } },
        result: { data: { assignConditionToUser: true } },
      },
      { request: { query: USER_CONDITION_IDS_QUERY, variables: { userId: 'u1' } }, result: { data: { userConditionIds: ['c1'] } } },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ConditionAssignment />
      </MockedProvider>
    );

    fireEvent.mouseDown(await screen.findByLabelText(/seleccionar usuario/i));
    fireEvent.click(await screen.findByRole('option', { name: 'Alice' }));

    const checkbox = await screen.findByRole('checkbox', { name: /hypothyroidism/i });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    await waitFor(() => expect(checkbox).toBeChecked());
  });

  it('lets an admin toggle a condition off for that user', async () => {
    const mocks = [
      { request: { query: USERS_QUERY }, result: { data: { users: [{ id: 'u1', displayName: 'Alice' }] } } },
      { request: { query: CONDITIONS_QUERY }, result: { data: { conditions: [{ id: 'c1', name: 'Hypothyroidism', description: null, multiplier: 1.15 }] } } },
      { request: { query: USER_CONDITION_IDS_QUERY, variables: { userId: 'u1' } }, result: { data: { userConditionIds: ['c1'] } } },
      {
        request: { query: UNASSIGN_CONDITION, variables: { userId: 'u1', conditionId: 'c1' } },
        result: { data: { unassignConditionFromUser: true } },
      },
      { request: { query: USER_CONDITION_IDS_QUERY, variables: { userId: 'u1' } }, result: { data: { userConditionIds: [] } } },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ConditionAssignment />
      </MockedProvider>
    );

    fireEvent.mouseDown(await screen.findByLabelText(/seleccionar usuario/i));
    fireEvent.click(await screen.findByRole('option', { name: 'Alice' }));

    const checkbox = await screen.findByRole('checkbox', { name: /hypothyroidism/i });
    await waitFor(() => expect(checkbox).toBeChecked());

    fireEvent.click(checkbox);

    await waitFor(() => expect(checkbox).not.toBeChecked());
  });
});
