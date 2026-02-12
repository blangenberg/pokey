import { createSchemaGetHandler } from '../handlers/schemas/get';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../dependencies';

const deps = createDependencies();
export const handler = lambdaAdapter(createSchemaGetHandler(deps));
