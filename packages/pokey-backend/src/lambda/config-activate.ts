import { createConfigActivateHandler } from '../handlers/config-handlers/activate';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../utils/handler-dependency-util';

const deps = createDependencies();
export const handler = lambdaAdapter(createConfigActivateHandler(deps));
