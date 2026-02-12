import { createSchemaDisableHandler } from '../handlers/schemas/disable';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../dependencies';

const deps = createDependencies();
export const handler = lambdaAdapter(createSchemaDisableHandler(deps));
