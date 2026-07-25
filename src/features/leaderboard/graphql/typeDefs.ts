export const typeDefs = `#graphql
  enum Gender {
    MALE
    FEMALE
  }

  enum ScoreType {
    RAW
    FINAL
  }

  type LeaderboardTimelinePoint {
    recordedAt: String!
    value: Float!
    """Only populated when metricKey is set — the metric's actual measured value at this point in time."""
    rawValue: Float
  }

  type LeaderboardRow {
    userId: ID!
    displayName: String!
    rank: Int!
    rawScore: Float!
    finalScore: Float!
    metricPctChange: Float
    """Only populated when metricKey is set — the metric's actual latest measured value."""
    metricRawValue: Float
    timeline: [LeaderboardTimelinePoint!]!
  }

  extend type Query {
    leaderboard(
      gender: Gender
      scoreType: ScoreType
      minAge: Int
      maxAge: Int
      metricKey: String
    ): [LeaderboardRow!]!
  }
`;
