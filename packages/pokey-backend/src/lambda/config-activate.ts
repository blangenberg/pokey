import { createConfigActivateHandler } from '../handlers/configs/activate';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../dependencies';

const deps = createDependencies();
export const handler = lambdaAdapter(createConfigActivateHandler(deps));
