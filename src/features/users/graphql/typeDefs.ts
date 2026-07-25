export const typeDefs = `#graphql
  type MetricChange {
    metricKey: String!
    pctChange: Float!
    """Only populated on ScoreBreakdown.metricChanges, not on TimelinePoint.metricChanges."""
    weight: Float
    """Only populated on ScoreBreakdown.metricChanges, not on TimelinePoint.metricChanges."""
    contribution: Float
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
