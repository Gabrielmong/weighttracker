export const typeDefs = `#graphql
  enum DirectionType {
    FIXED
    GOAL_RELATIVE
  }

  enum FixedDirection {
    UP
    DOWN
  }

  input UpdateMetricConfigInput {
    metricKey: String!
    weight: Float!
    directionType: DirectionType!
    fixedDirection: FixedDirection
  }

  input HandicapBracketInput {
    id: ID
    gender: Gender!
    minAge: Int!
    maxAge: Int!
    multiplier: Float!
  }

  input ConditionInput {
    id: ID
    name: String!
    description: String
    multiplier: Float!
  }

  type Condition {
    id: ID!
    name: String!
    description: String
    multiplier: Float!
  }

  type HandicapBracketType {
    id: ID!
    gender: Gender!
    minAge: Int!
    maxAge: Int!
    multiplier: Float!
  }

  type UserSummary {
    id: ID!
    displayName: String!
  }

  type MetricConfigType {
    metricKey: String!
    weight: Float!
    directionType: DirectionType!
    fixedDirection: FixedDirection
  }

  extend type Query {
    conditions: [Condition!]!
    handicapBrackets: [HandicapBracketType!]!
    metricConfigs: [MetricConfigType!]!
    users: [UserSummary!]!
    userConditionIds(userId: ID!): [ID!]!
  }

  extend type Mutation {
    updateMetricConfig(input: UpdateMetricConfigInput!): Boolean!
    upsertHandicapBracket(input: HandicapBracketInput!): HandicapBracketType!
    deleteHandicapBracket(id: ID!): Boolean!
    createCondition(input: ConditionInput!): Condition!
    updateCondition(input: ConditionInput!): Condition!
    deleteCondition(id: ID!): Boolean!
    assignConditionToUser(userId: ID!, conditionId: ID!): Boolean!
    unassignConditionFromUser(userId: ID!, conditionId: ID!): Boolean!
    endChallenge(challengeId: ID!): Boolean!
    startChallenge(name: String!, startDate: String!): Boolean!
  }
`;
