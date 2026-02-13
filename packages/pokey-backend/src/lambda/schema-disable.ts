import { createSchemaDisableHandler } from '../handlers/schema-handlers/disable';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../utils/handler-dependency-util';

const deps = createDependencies();
export const handler = lambdaAdapter(createSchemaDisableHandler(deps));
