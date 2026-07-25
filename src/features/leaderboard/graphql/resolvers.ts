import { GraphQLContext, requireUser } from '@/lib/graphql/context';
import { getLeaderboard } from '../service';
import { MetricKey } from '@/features/scoring/types';

export const resolvers = {
  Query: {
    leaderboard: async (
      _parent: unknown,
      args: {
        gender?: 'MALE' | 'FEMALE';
        scoreType?: 'RAW' | 'FINAL';
        minAge?: number;
        maxAge?: number;
        metricKey?: MetricKey;
      },
      context: GraphQLContext
    ) => {
      requireUser(context);
      return getLeaderboard({
        gender: args.gender,
        scoreType: args.scoreType,
        minAge: args.minAge,
        maxAge: args.maxAge,
        metricKey: args.metricKey,
      });
    },
  },
};
