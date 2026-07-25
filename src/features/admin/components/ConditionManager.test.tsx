import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { ConditionManager, CONDITIONS_QUERY, CREATE_CONDITION } from './ConditionManager';

describe('ConditionManager', () => {
  it('lists existing conditions and allows creating a new one', async () => {
    const mocks = [
      { request: { query: CONDITIONS_QUERY }, result: { data: { conditions: [{ id: 'c1', name: 'Hypothyroidism', description: null, multiplier: 1.15 }] } } },
      {
        request: { query: CREATE_CONDITION, variables: { input: { name: 'PCOS', description: null, multiplier: 1.1 } } },
        result: { data: { createCondition: { id: 'c2', name: 'PCOS', description: null, multiplier: 1.1 } } },
      },
      { request: { query: CONDITIONS_QUERY }, result: { data: { conditions: [{ id: 'c1', name: 'Hypothyroidism', description: null, multiplier: 1.15 }, { id: 'c2', name: 'PCOS', description: null, multiplier: 1.1 }] } } },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ConditionManager />
      </MockedProvider>
    );

    expect(await screen.findByText('Hypothyroidism')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nombre de la condición/i), { target: { value: 'PCOS' } });
    fireEvent.change(screen.getByLabelText(/multiplicador/i), { target: { value: '1.1' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar condición/i }));

    await waitFor(() => expect(screen.getByText('PCOS')).toBeInTheDocument());
  });
});
