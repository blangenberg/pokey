import { createSchemaActivateHandler } from '../handlers/schema-handlers/activate';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../utils/handler-dependency-util';

const deps = createDependencies();
export const handler = lambdaAdapter(createSchemaActivateHandler(deps));
