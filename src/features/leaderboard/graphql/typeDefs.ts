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
  }

  type LeaderboardRow {
    userId: ID!
    displayName: String!
    rank: Int!
    rawScore: Float!
    finalScore: Float!
    metricPctChange: Float
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
