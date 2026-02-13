import { Router } from 'express';
import { expressAdapter } from '../adapters/express-adapter';
import type { HandlerDependencies } from '../adapters/types';

// Schema handlers
import { createSchemaGetHandler } from '../handlers/schema-handlers/get';
import { createSchemaListHandler } from '../handlers/schema-handlers/list';
import { createSchemaCreateHandler } from '../handlers/schema-handlers/create';
import { createSchemaUpdateHandler } from '../handlers/schema-handlers/update';
import { createSchemaDisableHandler } from '../handlers/schema-handlers/disable';
import { createSchemaActivateHandler } from '../handlers/schema-handlers/activate';

// Config handlers
import { createConfigGetHandler } from '../handlers/config-handlers/get';
import { createConfigListHandler } from '../handlers/config-handlers/list';
import { createConfigCreateHandler } from '../handlers/config-handlers/create';
import { createConfigUpdateHandler } from '../handlers/config-handlers/update';
import { createConfigDisableHandler } from '../handlers/config-handlers/disable';
import { createConfigActivateHandler } from '../handlers/config-handlers/activate';

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
