import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { rootTypeDefs } from '@/features/scoring/graphql/typeDefs';
import { typeDefs as measurementsTypeDefs } from '@/features/measurements/graphql/typeDefs';
import { resolvers as measurementsResolvers } from '@/features/measurements/graphql/resolvers';
import { typeDefs as leaderboardTypeDefs } from '@/features/leaderboard/graphql/typeDefs';
import { resolvers as leaderboardResolvers } from '@/features/leaderboard/graphql/resolvers';
import { typeDefs as usersTypeDefs } from '@/features/users/graphql/typeDefs';
import { resolvers as usersResolvers } from '@/features/users/graphql/resolvers';
import { typeDefs as adminTypeDefs } from '@/features/admin/graphql/typeDefs';
import { resolvers as adminResolvers } from '@/features/admin/graphql/resolvers';

const typeDefs = [rootTypeDefs, measurementsTypeDefs, leaderboardTypeDefs, usersTypeDefs, adminTypeDefs];
const resolvers = [measurementsResolvers, leaderboardResolvers, usersResolvers, adminResolvers];

export const schema = makeExecutableSchema({
  typeDefs: mergeTypeDefs(typeDefs),
  resolvers: mergeResolvers(resolvers),
});
