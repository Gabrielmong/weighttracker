import { ToggleButtonGroup, ToggleButton, Stack, TextField, MenuItem } from '@mui/material';

export type AgeBracketOption = 'ALL' | '0-29' | '30-44' | '45-120';

export const METRIC_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'COMBINED', label: 'Combined Score' },
  { value: 'WEIGHT', label: 'Weight' },
  { value: 'BMI', label: 'BMI' },
  { value: 'BODY_FAT_PCT', label: 'Body Fat %' },
  { value: 'SUBCUTANEOUS_FAT_PCT', label: 'Subcutaneous Fat %' },
  { value: 'VISCERAL_FAT_RATING', label: 'Visceral Fat Rating' },
  { value: 'SKELETAL_MUSCLE_PCT', label: 'Skeletal Muscle %' },
  { value: 'MUSCLE_MASS_KG', label: 'Muscle Mass' },
  { value: 'PROTEIN_PCT', label: 'Protein %' },
  { value: 'BMR', label: 'BMR' },
  { value: 'METABOLIC_AGE', label: 'Metabolic Age' },
];

export interface LeaderboardFilterState {
  gender: 'ALL' | 'MALE' | 'FEMALE';
  scoreType: 'RAW' | 'FINAL';
  ageBracket: AgeBracketOption;
  metricKey: string; // 'COMBINED' or a MetricKey
}

const AGE_BRACKET_RANGES: Record<Exclude<AgeBracketOption, 'ALL'>, { minAge: number; maxAge: number }> = {
  '0-29': { minAge: 0, maxAge: 29 },
  '30-44': { minAge: 30, maxAge: 44 },
  '45-120': { minAge: 45, maxAge: 120 },
};

export function ageBracketToRange(bracket: AgeBracketOption): { minAge?: number; maxAge?: number } {
  if (bracket === 'ALL') return {};
  return AGE_BRACKET_RANGES[bracket];
}

export function LeaderboardFilters({
  value,
  onChange,
}: {
  value: LeaderboardFilterState;
  onChange: (value: LeaderboardFilterState) => void;
}) {
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
      <ToggleButtonGroup
        exclusive
        value={value.gender}
        onChange={(_e, gender) => gender && onChange({ ...value, gender })}
      >
        <ToggleButton value="ALL">Everyone</ToggleButton>
        <ToggleButton value="MALE">Men</ToggleButton>
        <ToggleButton value="FEMALE">Women</ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        exclusive
        value={value.scoreType}
        onChange={(_e, scoreType) => scoreType && onChange({ ...value, scoreType })}
      >
        <ToggleButton value="FINAL">Handicapped</ToggleButton>
        <ToggleButton value="RAW">Raw</ToggleButton>
      </ToggleButtonGroup>
      <TextField
        select
        label="Age Bracket"
        size="small"
        value={value.ageBracket}
        onChange={(e) => onChange({ ...value, ageBracket: e.target.value as AgeBracketOption })}
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="ALL">All Ages</MenuItem>
        <MenuItem value="0-29">0-29</MenuItem>
        <MenuItem value="30-44">30-44</MenuItem>
        <MenuItem value="45-120">45+</MenuItem>
      </TextField>
      <TextField
        select
        label="Rank By"
        size="small"
        value={value.metricKey}
        onChange={(e) => onChange({ ...value, metricKey: e.target.value })}
        sx={{ minWidth: 180 }}
      >
        {METRIC_FILTER_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
