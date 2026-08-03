import { GraphQLContext, requireUser, requireAdmin } from '@/lib/graphql/context';
import { recordMeasurement, updateMeasurement, listMeasurementsForUser } from '../service';

export const resolvers = {
  Measurement: {
    // GraphQL's default String serializer calls Date.prototype.valueOf() on
    // non-plain objects, which returns epoch milliseconds, not a readable
    // date — a raw Prisma DateTime must be explicitly converted here.
    recordedAt: (parent: { recordedAt: Date }) => parent.recordedAt.toISOString(),
  },
  Query: {
    myMeasurements: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireUser(context);
      const challenge = await context.prisma.challenge.findFirst({ where: { isActive: true } });
      if (!challenge) return [];
      return listMeasurementsForUser(user.id, challenge.id);
    },
    userMeasurements: async (_parent: unknown, args: { userId: string }, context: GraphQLContext) => {
      const user = requireUser(context);
      if (user.id !== args.userId) requireAdmin(context);
      const challenge = await context.prisma.challenge.findFirst({ where: { isActive: true } });
      if (!challenge) return [];
      return listMeasurementsForUser(args.userId, challenge.id);
    },
  },
  Mutation: {
    recordMeasurement: async (_parent: unknown, args: { input: any }, context: GraphQLContext) => {
      const user = requireUser(context);
      const challenge = await context.prisma.challenge.findFirst({ where: { isActive: true } });
      if (!challenge) throw new Error('No hay un reto activo.');
      return recordMeasurement(user.id, challenge.id, args.input);
    },
    updateMeasurement: async (_parent: unknown, args: { input: any }, context: GraphQLContext) => {
      requireAdmin(context);
      return updateMeasurement(args.input);
    },
  },
};
