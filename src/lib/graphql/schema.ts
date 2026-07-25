import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { rootTypeDefs } from '@/features/scoring/graphql/typeDefs';
import { typeDefs as measurementsTypeDefs } from '@/features/measurements/graphql/typeDefs';
import { resolvers as measurementsResolvers } from '@/features/measurements/graphql/resolvers';
import { typeDefs as leaderboardTypeDefs } from '@/features/leaderboard/graphql/typeDefs';
import { resolvers as leaderboardResolvers } from '@/features/leaderboard/graphql/resolvers';
import { typeDefs as usersTypeDefs } from '@/features/users/graphql/typeDefs';
import { resolvers as usersResolvers } from '@/features/users/graphql/resolvers';

const typeDefs = [rootTypeDefs, measurementsTypeDefs, leaderboardTypeDefs, usersTypeDefs];
const resolvers = [
  { Query: { _placeholder: () => true }, Mutation: { _placeholder: () => true } },
  measurementsResolvers,
  leaderboardResolvers,
  usersResolvers,
];

export const schema = makeExecutableSchema({
  typeDefs: mergeTypeDefs(typeDefs),
  resolvers: mergeResolvers(resolvers),
});
