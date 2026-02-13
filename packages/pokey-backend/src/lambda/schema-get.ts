import { createSchemaGetHandler } from '../handlers/schema-handlers/get';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../utils/handler-dependency-util';

const deps = createDependencies();
export const handler = lambdaAdapter(createSchemaGetHandler(deps));
