import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, HTMLSelect, HTMLTable, InputGroup, NonIdealState, Spinner } from '@blueprintjs/core';
import { ListPage } from '../../components/shared/ListPage';
import { SchemaSelector } from '../../components/shared/SchemaSelector';
import { usePagination } from '../../hooks/use-pagination';
import { useSchemaNameCache } from '../../hooks/use-schema-name-cache';
import { api } from '../../services/api';
import { showErrorToast } from '../../services/toaster';
import { buildConfigParams, buildFilterSearchParams } from '../../utils/list-params';
import type { ConfigListItem, PaginatedResponse } from 'pokey-common';
import './config-list.scss';

interface SchemaOption {
  id: string;
  name: string;
  status: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All' },
  { value: 'disabled', label: 'Disabled' },
];

const DEBOUNCE_MS = 300;

export function ConfigList(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [schemaFilter, setSchemaFilter] = useState<SchemaOption | null>(null);
  const [nameFilter, setNameFilter] = useState(searchParams.get('name') ?? '');
  const [idFilter, setIdFilter] = useState(searchParams.get('id') ?? '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'active');

  const [items, setItems] = useState<ConfigListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const pagination = usePagination();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const schemaNameCache = useSchemaNameCache();

  const fetchConfigs = useCallback(
    async (token: string | undefined, schema: SchemaOption | null, name: string, id: string, status: string): Promise<void> => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      try {
        const params = buildConfigParams({ name, id, status, schemaId: schema?.id, nextToken: token });

        const response = await api
          .get('configs', { searchParams: params, signal: controller.signal })
          .json<PaginatedResponse<ConfigListItem>>();

        const uniqueIds = [...new Set(response.items.map((c) => c.schemaId))];
        await Promise.all(uniqueIds.map((sid) => schemaNameCache.resolve(sid)));
        setItems(response.items);
        pagination.setNextToken(response.nextToken);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        void showErrorToast('Failed to load configs. Please try again.');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [pagination, schemaNameCache],
  );

  useEffect(() => {
    void fetchConfigs(pagination.currentToken, schemaFilter, nameFilter, idFilter, statusFilter);

    return (): void => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [pagination.currentToken]);

  const syncUrlParams = useCallback(
    (name: string, id: string, status: string, schemaId?: string): void => {
      const params = buildFilterSearchParams({ name, id, status, schemaId }, { name: '', id: '', status: 'active' });
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const debouncedFetch = useCallback(
    (name: string, id: string, status: string, schema: SchemaOption | null): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        pagination.reset();
        void fetchConfigs(undefined, schema, name, id, status);
      }, DEBOUNCE_MS);
    },
    [fetchConfigs, pagination],
  );

  const handleSchemaSelect = useCallback(
    (schema: SchemaOption | null): void => {
      setSchemaFilter(schema);
      syncUrlParams(nameFilter, idFilter, statusFilter, schema?.id);
      pagination.reset();
      void fetchConfigs(undefined, schema, nameFilter, idFilter, statusFilter);
    },
    [nameFilter, idFilter, statusFilter, syncUrlParams, fetchConfigs, pagination],
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      setNameFilter(value);
      syncUrlParams(value, idFilter, statusFilter, schemaFilter?.id);
      debouncedFetch(value, idFilter, statusFilter, schemaFilter);
    },
    [idFilter, statusFilter, schemaFilter, syncUrlParams, debouncedFetch],
  );

  const handleIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      setIdFilter(value);
      syncUrlParams(nameFilter, value, statusFilter, schemaFilter?.id);
      debouncedFetch(nameFilter, value, statusFilter, schemaFilter);
    },
    [nameFilter, statusFilter, schemaFilter, syncUrlParams, debouncedFetch],
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>): void => {
      const value = e.target.value;
      setStatusFilter(value);
      syncUrlParams(nameFilter, idFilter, value, schemaFilter?.id);
      pagination.reset();
      void fetchConfigs(undefined, schemaFilter, nameFilter, idFilter, value);
    },
    [nameFilter, idFilter, schemaFilter, syncUrlParams, fetchConfigs, pagination],
  );

  function getSchemaDisplay(schemaId: string): { name: string; className: string } {
    const entry = schemaNameCache.get(schemaId);
    if (!entry) return { name: schemaId, className: 'pokey-config-schema--unknown' };
    if (entry.status === 'deleted') return { name: entry.name, className: 'pokey-config-schema--deleted' };
    if (entry.status !== 'active') return { name: entry.name, className: 'pokey-config-schema--disabled' };
    return { name: entry.name, className: '' };
  }

  const filterBar = (
    <>
      <SchemaSelector value={schemaFilter} onSelect={handleSchemaSelect} placeholder="Filter by schema..." />
      <InputGroup
        placeholder="Filter by name..."
        value={nameFilter}
        onChange={handleNameChange}
        leftIcon="search"
        aria-label="Filter by name"
        style={{ maxWidth: 200 }}
      />
      <InputGroup
        placeholder="Filter by ID..."
        value={idFilter}
        onChange={handleIdChange}
        leftIcon="id-number"
        aria-label="Filter by ID"
        style={{ maxWidth: 200 }}
      />
      <HTMLSelect value={statusFilter} onChange={handleStatusChange} aria-label="Filter by status">
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </HTMLSelect>
    </>
  );

  const createButton = (
    <Button
      intent="success"
      icon="plus"
      text="Create Config"
      onClick={(): void => {
        void navigate('/configs/new');
      }}
    />
  );

  const renderTable = (): React.JSX.Element => {
    if (initialLoad) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner size={40} />
        </div>
      );
    }

    if (items.length === 0) {
      const hasFilters = nameFilter || idFilter || statusFilter !== 'active' || schemaFilter;
      return (
        <NonIdealState
          icon={hasFilters ? 'filter-remove' : 'search'}
          title={hasFilters ? 'No matching results' : 'No configs found'}
          description={hasFilters ? 'Try adjusting your filters.' : 'Create your first config to get started.'}
          action={
            !hasFilters ? (
              <Button
                intent="success"
                text="Create Config"
                onClick={(): void => {
                  void navigate('/configs/new');
                }}
              />
            ) : undefined
          }
        />
      );
    }

    return (
      <HTMLTable bordered striped interactive className="pokey-config-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Schema</th>
            <th>Status</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((config) => {
            const schemaDisplay = getSchemaDisplay(config.schemaId);
            return (
              <tr
                key={config.id}
                className="pokey-config-row"
                onClick={(): void => {
                  void navigate(`/configs/${config.id}`);
                }}
              >
                <td className="pokey-config-id">{config.id}</td>
                <td className="pokey-config-name">{config.name}</td>
                <td className={schemaDisplay.className}>{schemaDisplay.name}</td>
                <td className={`pokey-config-status pokey-config-status--${config.status}`}>{config.status}</td>
                <td>{config.createdAt}</td>
                <td>{config.updatedAt}</td>
              </tr>
            );
          })}
        </tbody>
      </HTMLTable>
    );
  };

  return (
    <ListPage
      filterBar={filterBar}
      createButton={createButton}
      table={renderTable()}
      canGoBack={pagination.canGoBack}
      canGoNext={pagination.canGoNext}
      onBack={pagination.goBack}
      onNext={pagination.goNext}
      loading={loading && !initialLoad}
    />
  );
}
