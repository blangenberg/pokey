import { createSchemaUpdateHandler } from '../handlers/schemas/update';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../dependencies';

const deps = createDependencies();
export const handler = lambdaAdapter(createSchemaUpdateHandler(deps));
