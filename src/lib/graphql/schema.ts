import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { rootTypeDefs } from '@/features/scoring/graphql/typeDefs';
import { typeDefs as measurementsTypeDefs } from '@/features/measurements/graphql/typeDefs';
import { resolvers as measurementsResolvers } from '@/features/measurements/graphql/resolvers';

const typeDefs = [rootTypeDefs, measurementsTypeDefs];
const resolvers = [
  { Query: { _placeholder: () => true }, Mutation: { _placeholder: () => true } },
  measurementsResolvers,
];

export const schema = makeExecutableSchema({
  typeDefs: mergeTypeDefs(typeDefs),
  resolvers: mergeResolvers(resolvers),
});
