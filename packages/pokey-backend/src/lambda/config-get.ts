import { createConfigGetHandler } from '../handlers/configs/get';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../dependencies';

const deps = createDependencies();
export const handler = lambdaAdapter(createConfigGetHandler(deps));
