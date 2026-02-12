import { Router } from 'express';
import { expressAdapter } from '../adapters/express-adapter';
import type { HandlerDependencies } from '../adapters/types';

// Schema handlers
import { createSchemaGetHandler } from '../handlers/schemas/get';
import { createSchemaListHandler } from '../handlers/schemas/list';
import { createSchemaCreateHandler } from '../handlers/schemas/create';
import { createSchemaUpdateHandler } from '../handlers/schemas/update';
import { createSchemaDisableHandler } from '../handlers/schemas/disable';
import { createSchemaActivateHandler } from '../handlers/schemas/activate';

// Config handlers
import { createConfigGetHandler } from '../handlers/configs/get';
import { createConfigListHandler } from '../handlers/configs/list';
import { createConfigCreateHandler } from '../handlers/configs/create';
import { createConfigUpdateHandler } from '../handlers/configs/update';
import { createConfigDisableHandler } from '../handlers/configs/disable';
import { createConfigActivateHandler } from '../handlers/configs/activate';

export function createRouter(deps: HandlerDependencies): Router {
  const router = Router();

  // ── Schema routes ───────────────────────────────────────────────────────
  router.get('/schemas', expressAdapter(createSchemaListHandler(deps)));
  router.post('/schemas', expressAdapter(createSchemaCreateHandler(deps)));
  router.get('/schemas/:id', expressAdapter(createSchemaGetHandler(deps)));
  router.put('/schemas/:id', expressAdapter(createSchemaUpdateHandler(deps)));
  router.post('/schemas/:id/disable', expressAdapter(createSchemaDisableHandler(deps)));
  router.post('/schemas/:id/activate', expressAdapter(createSchemaActivateHandler(deps)));

  // ── Config routes ───────────────────────────────────────────────────────
  router.get('/configs', expressAdapter(createConfigListHandler(deps)));
  router.post('/configs', expressAdapter(createConfigCreateHandler(deps)));
  router.get('/configs/:id', expressAdapter(createConfigGetHandler(deps)));
  router.put('/configs/:id', expressAdapter(createConfigUpdateHandler(deps)));
  router.post('/configs/:id/disable', expressAdapter(createConfigDisableHandler(deps)));
  router.post('/configs/:id/activate', expressAdapter(createConfigActivateHandler(deps)));

  return router;
}
