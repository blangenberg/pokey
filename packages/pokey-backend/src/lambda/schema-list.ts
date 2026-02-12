import { createSchemaListHandler } from '../handlers/schemas/list';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../dependencies';

const deps = createDependencies();
export const handler = lambdaAdapter(createSchemaListHandler(deps));
