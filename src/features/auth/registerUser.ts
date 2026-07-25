import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export interface RegisterUserInput {
  displayName: string;
  password: string;
  gender: 'MALE' | 'FEMALE';
  birthdate: string;
  weightGoal: 'LOSE' | 'GAIN' | 'MAINTAIN';
}

export async function registerUser(input: RegisterUserInput): Promise<{ id: string }> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      displayName: input.displayName,
      passwordHash,
      gender: input.gender,
      birthdate: new Date(input.birthdate),
      weightGoal: input.weightGoal,
    },
  });
  return { id: user.id };
}
