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
  }

  extend type Query {
    myMeasurements: [Measurement!]!
  }

  extend type Mutation {
    recordMeasurement(input: RecordMeasurementInput!): Measurement!
  }
`;
