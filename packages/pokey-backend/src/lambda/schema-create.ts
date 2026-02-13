import { createSchemaCreateHandler } from '../handlers/schema-handlers/create';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../utils/handler-dependency-util';

const deps = createDependencies();
export const handler = lambdaAdapter(createSchemaCreateHandler(deps));
