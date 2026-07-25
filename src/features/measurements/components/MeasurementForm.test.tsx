import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { MeasurementForm, RECORD_MEASUREMENT } from './MeasurementForm';

describe('MeasurementForm', () => {
  it('renders required fields and an optional-fields toggle, defaulting the date to today', () => {
    render(
      <MockedProvider mocks={[]}>
        <MeasurementForm onSaved={() => {}} />
      </MockedProvider>
    );
    const dateInput = screen.getByLabelText(/fecha de la medición/i) as HTMLInputElement;
    expect(dateInput.value).toBe(new Date().toISOString().slice(0, 10));
    expect(screen.getByLabelText(/peso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/grasa corporal/i)).toBeInTheDocument();
    expect(screen.getByText(/campos opcionales/i)).toBeInTheDocument();
  });

  it('submits the mutation with entered values, including a backdated measurement date', async () => {
    const onSaved = vi.fn();
    const mocks = [
      {
        request: {
          query: RECORD_MEASUREMENT,
          variables: {
            input: {
              recordedAt: new Date('2026-01-15').toISOString(),
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
        result: { data: { recordMeasurement: { id: 'm1', recordedAt: '2026-01-15', isBaseline: false } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MeasurementForm onSaved={onSaved} />
      </MockedProvider>
    );

    fireEvent.change(screen.getByLabelText(/fecha de la medición/i), { target: { value: '2026-01-15' } });
    fireEvent.change(screen.getByLabelText(/peso/i), { target: { value: '85' } });
    fireEvent.change(screen.getByLabelText(/^imc/i), { target: { value: '26' } });
    fireEvent.change(screen.getByLabelText(/grasa corporal/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/subcutánea/i), { target: { value: '16' } });
    fireEvent.change(screen.getByLabelText(/visceral/i), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/músculo esquelético/i), { target: { value: '34' } });
    fireEvent.change(screen.getByLabelText(/masa muscular/i), { target: { value: '29' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});
