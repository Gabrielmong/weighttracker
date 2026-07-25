import { GraphQLContext, requireUser } from '@/lib/graphql/context';
import { getUserTimeline, getUserScoreBreakdown } from '../service';

export const resolvers = {
  Query: {
    userDetail: async (_parent: unknown, args: { userId: string }, context: GraphQLContext) => {
      requireUser(context);
      const user = await context.prisma.user.findUnique({ where: { id: args.userId } });
      if (!user) return null;

      const [timeline, scoreBreakdown] = await Promise.all([
        getUserTimeline(args.userId),
        getUserScoreBreakdown(args.userId),
      ]);

      return { userId: user.id, displayName: user.displayName, timeline, scoreBreakdown };
    },
  },
};
