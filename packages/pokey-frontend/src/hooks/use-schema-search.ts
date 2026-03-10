import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api';

export interface SchemaSearchResult {
  id: string;
  name: string;
  status: string;
}

interface SchemaListResponse {
  items: SchemaSearchResult[];
}

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

interface UseSchemaSearchOptions {
  statusFilter?: 'active';
}

interface UseSchemaSearchReturn {
  results: SchemaSearchResult[];
  loading: boolean;
  search: (query: string) => void;
}

/**
 * Debounced, cancellation-safe hook for searching schemas by name.
 * Encapsulates the timing, abort controller, and API call logic that previously
 * lived inline inside SchemaSelector.
 */
export function useSchemaSearch({ statusFilter }: UseSchemaSearchOptions = {}): UseSchemaSearchReturn {
  const [results, setResults] = useState<SchemaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    (query: string): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (query.length < MIN_QUERY_LENGTH) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(() => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);

        const searchParams: Record<string, string> = { name: query };
        if (statusFilter) searchParams.status = statusFilter;

        api
          .get('schemas', { searchParams, signal: controller.signal })
          .json<SchemaListResponse>()
          .then((data): void => {
            setResults(data.items);
          })
          .catch((err: unknown): void => {
            if (err instanceof Error && err.name === 'AbortError') return;
          })
          .finally((): void => {
            setLoading(false);
          });
      }, DEBOUNCE_MS);
    },
    [statusFilter],
  );

  return { results, loading, search };
}
