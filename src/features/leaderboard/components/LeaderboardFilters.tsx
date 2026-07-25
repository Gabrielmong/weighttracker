import { ToggleButtonGroup, ToggleButton, Stack, TextField, MenuItem } from '@mui/material';
import { METRIC_LABELS } from '@/features/scoring/metricLabels';

export type AgeBracketOption = 'ALL' | '0-29' | '30-44' | '45-120';

export const METRIC_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'COMBINED', label: 'Combined Score' },
  ...Object.entries(METRIC_LABELS).map(([value, label]) => ({ value, label })),
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
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ mb: 2, flexWrap: { sm: 'wrap' }, alignItems: { xs: 'stretch', sm: 'center' } }}
    >
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={value.gender}
        onChange={(_e, gender) => gender && onChange({ ...value, gender })}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        <ToggleButton value="ALL">Everyone</ToggleButton>
        <ToggleButton value="MALE">Men</ToggleButton>
        <ToggleButton value="FEMALE">Women</ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={value.scoreType}
        onChange={(_e, scoreType) => scoreType && onChange({ ...value, scoreType })}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        <ToggleButton value="FINAL">Handicapped</ToggleButton>
        <ToggleButton value="RAW">Raw</ToggleButton>
      </ToggleButtonGroup>
      <TextField
        select
        label="Age Bracket"
        size="small"
        fullWidth
        value={value.ageBracket}
        onChange={(e) => onChange({ ...value, ageBracket: e.target.value as AgeBracketOption })}
        sx={{ width: { xs: '100%', sm: 140 } }}
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
        fullWidth
        value={value.metricKey}
        onChange={(e) => onChange({ ...value, metricKey: e.target.value })}
        sx={{ width: { xs: '100%', sm: 180 } }}
      >
        {METRIC_FILTER_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
