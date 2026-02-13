import { createConfigUpdateHandler } from '../handlers/config-handlers/update';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../utils/handler-dependency-util';

const deps = createDependencies();
export const handler = lambdaAdapter(createConfigUpdateHandler(deps));
