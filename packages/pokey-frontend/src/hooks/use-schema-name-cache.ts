import { useRef, useCallback } from 'react';
import { api } from '../services/api';

interface SchemaLookupResult {
  name: string;
  status: string;
}

interface SchemaResponse {
  schema: SchemaLookupResult;
}

export interface ResolvedSchemaName {
  name: string;
  status: string;
}

/**
 * Provides a stable `resolve(schemaId)` function that fetches and caches schema names.
 * The cache lives for the component lifetime — no global state or module-level singletons.
 * Returns `null` while loading and `undefined` for IDs that failed to resolve.
 */
export function useSchemaNameCache(): {
  resolve: (schemaId: string) => Promise<ResolvedSchemaName | null>;
  get: (schemaId: string) => ResolvedSchemaName | undefined;
} {
  const cache = useRef<Map<string, ResolvedSchemaName>>(new Map());
  const inflight = useRef<Map<string, Promise<ResolvedSchemaName | null>>>(new Map());

  const get = useCallback((schemaId: string): ResolvedSchemaName | undefined => {
    return cache.current.get(schemaId);
  }, []);

  const resolve = useCallback(async (schemaId: string): Promise<ResolvedSchemaName | null> => {
    const cached = cache.current.get(schemaId);
    if (cached) return cached;

    const existing = inflight.current.get(schemaId);
    if (existing) return existing;

    const promise = api
      .get(`schemas/${schemaId}`)
      .json<SchemaResponse>()
      .then((data): ResolvedSchemaName => {
        const result: ResolvedSchemaName = { name: data.schema.name, status: data.schema.status };
        cache.current.set(schemaId, result);
        inflight.current.delete(schemaId);
        return result;
      })
      .catch((): null => {
        inflight.current.delete(schemaId);
        return null;
      });

    inflight.current.set(schemaId, promise);
    return promise;
  }, []);

  return { resolve, get };
}
