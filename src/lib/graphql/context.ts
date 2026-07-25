import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface GraphQLContext {
  session: Session | null;
  prisma: typeof prisma;
}

export async function createContext(): Promise<GraphQLContext> {
  const session = await getServerSession(authOptions);
  return { session, prisma };
}

export function requireUser(context: GraphQLContext): { id: string; isAdmin: boolean } {
  const user = context.session?.user as { id?: string; isAdmin?: boolean } | undefined;
  if (!user?.id) throw new Error('No autenticado.');
  return { id: user.id, isAdmin: !!user.isAdmin };
}

export function requireAdmin(context: GraphQLContext): { id: string; isAdmin: boolean } {
  const user = requireUser(context);
  if (!user.isAdmin) throw new Error('Se requiere acceso de administrador.');
  return user;
}
