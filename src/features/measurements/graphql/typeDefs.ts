export const typeDefs = `#graphql
  type Measurement {
    id: ID!
    recordedAt: String!
    weightKg: Float!
    bmi: Float!
    bodyFatPct: Float!
    subcutaneousFatPct: Float!
    visceralFatRating: Float!
    skeletalMusclePct: Float!
    muscleMassKg: Float!
    proteinPct: Float
    bmr: Float
    metabolicAge: Int
    isBaseline: Boolean!
  }

  input RecordMeasurementInput {
    weightKg: Float!
    bmi: Float!
    bodyFatPct: Float!
    subcutaneousFatPct: Float!
    visceralFatRating: Float!
    skeletalMusclePct: Float!
    muscleMassKg: Float!
    proteinPct: Float
    bmr: Float
    metabolicAge: Int
    recordedAt: String
  }

  input UpdateMeasurementInput {
    id: ID!
    weightKg: Float!
    bmi: Float!
    bodyFatPct: Float!
    subcutaneousFatPct: Float!
    visceralFatRating: Float!
    skeletalMusclePct: Float!
    muscleMassKg: Float!
    proteinPct: Float
    bmr: Float
    metabolicAge: Int
    recordedAt: String!
  }

  extend type Query {
    myMeasurements: [Measurement!]!
    """Admin-only when userId is not the current user."""
    userMeasurements(userId: ID!): [Measurement!]!
  }

  extend type Mutation {
    recordMeasurement(input: RecordMeasurementInput!): Measurement!
    """Admin-only."""
    updateMeasurement(input: UpdateMeasurementInput!): Measurement!
  }
`;
