import { createConfigCreateHandler } from '../handlers/configs/create';
import { lambdaAdapter } from '../adapters/lambda-adapter';
import { createDependencies } from '../dependencies';

const deps = createDependencies();
export const handler = lambdaAdapter(createConfigCreateHandler(deps));
