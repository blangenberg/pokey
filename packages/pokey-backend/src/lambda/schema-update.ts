import { createSchemaUpdateHandler } from '../handlers/schema-handlers/update';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../utils/handler-dependency-util';

const deps = createDependencies();
export const handler = lambdaAdapter(createSchemaUpdateHandler(deps));
