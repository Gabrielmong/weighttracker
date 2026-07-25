import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { MeasurementForm, RECORD_MEASUREMENT } from './MeasurementForm';

describe('MeasurementForm', () => {
  it('renders required fields and an optional-fields toggle', () => {
    render(
      <MockedProvider mocks={[]}>
        <MeasurementForm onSaved={() => {}} />
      </MockedProvider>
    );
    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/body fat/i)).toBeInTheDocument();
    expect(screen.getByText(/optional fields/i)).toBeInTheDocument();
  });

  it('submits the mutation with entered values', async () => {
    const onSaved = vi.fn();
    const mocks = [
      {
        request: {
          query: RECORD_MEASUREMENT,
          variables: {
            input: {
              weightKg: 85,
              bmi: 26,
              bodyFatPct: 20,
              subcutaneousFatPct: 16,
              visceralFatRating: 8,
              skeletalMusclePct: 34,
              muscleMassKg: 29,
              proteinPct: null,
              bmr: null,
              metabolicAge: null,
            },
          },
        },
        result: { data: { recordMeasurement: { id: 'm1', recordedAt: '2026-07-25', isBaseline: false } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MeasurementForm onSaved={onSaved} />
      </MockedProvider>
    );

    fireEvent.change(screen.getByLabelText(/weight/i), { target: { value: '85' } });
    fireEvent.change(screen.getByLabelText(/^bmi/i), { target: { value: '26' } });
    fireEvent.change(screen.getByLabelText(/body fat/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/subcutaneous/i), { target: { value: '16' } });
    fireEvent.change(screen.getByLabelText(/visceral/i), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/skeletal muscle/i), { target: { value: '34' } });
    fireEvent.change(screen.getByLabelText(/muscle mass/i), { target: { value: '29' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});
