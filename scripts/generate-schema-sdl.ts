import { writeFileSync } from 'fs';
import { printSchema } from 'graphql';
import { schema } from '../src/lib/graphql/schema';

writeFileSync('schema.graphql', printSchema(schema));
console.log('Wrote schema.graphql');
