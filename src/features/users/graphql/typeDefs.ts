export const typeDefs = `#graphql
  type MetricChange {
    metricKey: String!
    pctChange: Float!
  }

  type TimelinePoint {
    recordedAt: String!
    metricChanges: [MetricChange!]!
  }

  type ScoreBreakdown {
    metricChanges: [MetricChange!]!
    rawScore: Float!
    ageGenderMultiplier: Float!
    conditionMultipliers: [Float!]!
    finalScore: Float!
  }

  type UserDetail {
    userId: ID!
    displayName: String!
    timeline: [TimelinePoint!]!
    scoreBreakdown: ScoreBreakdown
  }

  extend type Query {
    userDetail(userId: ID!): UserDetail
  }
`;
