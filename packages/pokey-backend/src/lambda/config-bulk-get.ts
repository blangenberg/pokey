import { createConfigBulkGetHandler } from '../handlers/config-handlers/bulk-get';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../utils/handler-dependency-util';

const deps = createDependencies();
export const handler = lambdaAdapter(createConfigBulkGetHandler(deps));
