import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser } from './registerUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: vi.fn().mockResolvedValue({ id: 'user-1' }),
    },
  },
}));

describe('registerUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hashes the password before storing and returns the new user id', async () => {
    const result = await registerUser({
      displayName: 'Alice',
      password: 'secret123',
      gender: 'FEMALE',
      birthdate: '1990-05-01',
      weightGoal: 'LOSE',
    });

    expect(result.id).toBe('user-1');
    const createArgs = (prisma.user.create as any).mock.calls[0][0];
    expect(createArgs.data.displayName).toBe('Alice');
    expect(createArgs.data.passwordHash).not.toBe('secret123');
    expect(createArgs.data.gender).toBe('FEMALE');
    expect(createArgs.data.weightGoal).toBe('LOSE');
  });
});
