import { createConfigListHandler } from '../handlers/config-handlers/list';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../utils/handler-dependency-util';

const deps = createDependencies();
export const handler = lambdaAdapter(createConfigListHandler(deps));
