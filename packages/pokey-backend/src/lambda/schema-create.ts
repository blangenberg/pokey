import { createSchemaCreateHandler } from '../handlers/schemas/create';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../dependencies';

const deps = createDependencies();
export const handler = lambdaAdapter(createSchemaCreateHandler(deps));
