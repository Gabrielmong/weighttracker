import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { rootTypeDefs } from '@/features/scoring/graphql/typeDefs';
import { typeDefs as measurementsTypeDefs } from '@/features/measurements/graphql/typeDefs';
import { resolvers as measurementsResolvers } from '@/features/measurements/graphql/resolvers';
import { typeDefs as leaderboardTypeDefs } from '@/features/leaderboard/graphql/typeDefs';
import { resolvers as leaderboardResolvers } from '@/features/leaderboard/graphql/resolvers';

const typeDefs = [rootTypeDefs, measurementsTypeDefs, leaderboardTypeDefs];
const resolvers = [
  { Query: { _placeholder: () => true }, Mutation: { _placeholder: () => true } },
  measurementsResolvers,
  leaderboardResolvers,
];

export const schema = makeExecutableSchema({
  typeDefs: mergeTypeDefs(typeDefs),
  resolvers: mergeResolvers(resolvers),
});
