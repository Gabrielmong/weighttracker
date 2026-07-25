import { GraphQLContext, requireAdmin } from '@/lib/graphql/context';
import * as adminService from '../service';

export const resolvers = {
  Query: {
    conditions: async (_p: unknown, _a: unknown, context: GraphQLContext) => {
      requireAdmin(context);
      return context.prisma.condition.findMany();
    },
    handicapBrackets: async (_p: unknown, _a: unknown, context: GraphQLContext) => {
      requireAdmin(context);
      return context.prisma.handicapBracket.findMany();
    },
    metricConfigs: async (_p: unknown, _a: unknown, context: GraphQLContext) => {
      requireAdmin(context);
      return context.prisma.metricConfig.findMany({ where: { challengeId: null } });
    },
    users: async (_p: unknown, _a: unknown, context: GraphQLContext) => {
      requireAdmin(context);
      return context.prisma.user.findMany({ orderBy: { displayName: 'asc' } });
    },
    userConditionIds: async (_p: unknown, args: { userId: string }, context: GraphQLContext) => {
      requireAdmin(context);
      const links = await context.prisma.userCondition.findMany({ where: { userId: args.userId } });
      return links.map((link) => link.conditionId);
    },
  },
  Mutation: {
    updateMetricConfig: async (_p: unknown, args: { input: any }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.updateMetricConfig(args.input);
      return true;
    },
    upsertHandicapBracket: async (_p: unknown, args: { input: any }, context: GraphQLContext) => {
      requireAdmin(context);
      return adminService.upsertHandicapBracket(args.input);
    },
    deleteHandicapBracket: async (_p: unknown, args: { id: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.deleteHandicapBracket(args.id);
      return true;
    },
    createCondition: async (_p: unknown, args: { input: any }, context: GraphQLContext) => {
      requireAdmin(context);
      return adminService.createCondition(args.input);
    },
    updateCondition: async (_p: unknown, args: { input: any }, context: GraphQLContext) => {
      requireAdmin(context);
      return adminService.updateCondition(args.input);
    },
    deleteCondition: async (_p: unknown, args: { id: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.deleteCondition(args.id);
      return true;
    },
    assignConditionToUser: async (_p: unknown, args: { userId: string; conditionId: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.assignConditionToUser(args.userId, args.conditionId);
      return true;
    },
    unassignConditionFromUser: async (_p: unknown, args: { userId: string; conditionId: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.unassignConditionFromUser(args.userId, args.conditionId);
      return true;
    },
    endChallenge: async (_p: unknown, args: { challengeId: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.endChallenge(args.challengeId);
      return true;
    },
    startChallenge: async (_p: unknown, args: { name: string; startDate: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.startChallenge(args);
      return true;
    },
  },
};
