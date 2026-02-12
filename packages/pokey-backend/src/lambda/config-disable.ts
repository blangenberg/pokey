import { createConfigDisableHandler } from '../handlers/configs/disable';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../dependencies';

const deps = createDependencies();
export const handler = lambdaAdapter(createConfigDisableHandler(deps));
