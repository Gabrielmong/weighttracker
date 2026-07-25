import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { rootTypeDefs } from '@/features/scoring/graphql/typeDefs';

const typeDefs = [rootTypeDefs];
const resolvers = [{ Query: { _placeholder: () => true }, Mutation: { _placeholder: () => true } }];

export const schema = makeExecutableSchema({
  typeDefs: mergeTypeDefs(typeDefs),
  resolvers: mergeResolvers(resolvers),
});
