import { createConfigUpdateHandler } from '../handlers/configs/update';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../dependencies';

const deps = createDependencies();
export const handler = lambdaAdapter(createConfigUpdateHandler(deps));
