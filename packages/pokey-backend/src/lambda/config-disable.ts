import { createConfigDisableHandler } from '../handlers/config-handlers/disable';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../utils/handler-dependency-util';

const deps = createDependencies();
export const handler = lambdaAdapter(createConfigDisableHandler(deps));
