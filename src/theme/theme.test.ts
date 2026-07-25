import { describe, it, expect } from 'vitest';
import { theme } from './theme';

describe('theme', () => {
  it('defines a primary palette color', () => {
    expect(theme.palette.primary.main).toBe('#2E7D32');
  });
});
