const MIN_SEARCH_LENGTH = 3;

export interface SchemaListFilters {
  name: string;
  id: string;
  status: string;
  nextToken?: string;
}

export interface ConfigListFilters {
  name: string;
  id: string;
  status: string;
  schemaId?: string;
  nextToken?: string;
}

/**
 * Converts schema list filter state into API query params.
 * Omits params that would return no useful results (e.g. short search terms, 'all' status).
 */
export function buildSchemaParams(filters: SchemaListFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.nextToken) params.nextToken = filters.nextToken;
  if (filters.status !== 'all') params.status = filters.status;
  if (filters.name.length >= MIN_SEARCH_LENGTH) params.name = filters.name;
  if (filters.id.length >= MIN_SEARCH_LENGTH) params.id = filters.id;
  return params;
}

/**
 * Converts config list filter state into API query params.
 */
export function buildConfigParams(filters: ConfigListFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.nextToken) params.nextToken = filters.nextToken;
  if (filters.status !== 'all') params.status = filters.status;
  if (filters.schemaId) params.schemaId = filters.schemaId;
  if (filters.name.length >= MIN_SEARCH_LENGTH) params.name = filters.name;
  if (filters.id.length >= MIN_SEARCH_LENGTH) params.id = filters.id;
  return params;
}

/**
 * Serializes filter state into URL search params, omitting values that match their defaults
 * so the URL stays clean. Uses replaceState-style approach (caller decides pushState vs replaceState).
 */
export function buildFilterSearchParams(values: Record<string, string | undefined>, defaults: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value && value !== defaults[key]) {
      params.set(key, value);
    }
  }
  return params;
}
