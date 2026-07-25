import { GraphQLContext, requireUser } from '@/lib/graphql/context';
import { recordMeasurement, listMeasurementsForUser } from '../service';

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
  },
  Mutation: {
    recordMeasurement: async (_parent: unknown, args: { input: any }, context: GraphQLContext) => {
      const user = requireUser(context);
      const challenge = await context.prisma.challenge.findFirst({ where: { isActive: true } });
      if (!challenge) throw new Error('No active challenge.');
      return recordMeasurement(user.id, challenge.id, args.input);
    },
  },
};
