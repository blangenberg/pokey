import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Select, Spin, Result } from 'antd';
import { SearchOutlined, IdcardOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons';
import { ListPage } from '../../components/shared/ListPage';
import { usePagination } from '../../hooks/use-pagination';
import { api } from '../../services/api';
import { showErrorToast } from '../../services/toaster';
import { buildSchemaParams, buildFilterSearchParams } from '../../utils/list-params';
import type { SchemaListItem, PaginatedResponse } from 'pokey-common';
import './schema-list.scss';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
];

const DEBOUNCE_MS = 300;

export default function SchemaList(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [nameFilter, setNameFilter] = useState(searchParams.get('name') ?? '');
  const [idFilter, setIdFilter] = useState(searchParams.get('id') ?? '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'active');

  const [items, setItems] = useState<SchemaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const pagination = usePagination();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSchemas = useCallback(
    async (token: string | undefined, name: string, id: string, status: string): Promise<void> => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      try {
        const params = buildSchemaParams({ name, id, status, nextToken: token });

        const response = await api
          .get('schemas', { searchParams: params, signal: controller.signal })
          .json<PaginatedResponse<SchemaListItem>>();

        setItems(response.items);
        pagination.setNextToken(response.nextToken);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        showErrorToast('Failed to load schemas. Please try again.');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [pagination],
  );

  useEffect(() => {
    void fetchSchemas(pagination.currentToken, nameFilter, idFilter, statusFilter);

    return (): void => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [pagination.currentToken]);

  const syncUrlParams = useCallback(
    (name: string, id: string, status: string): void => {
      const params = buildFilterSearchParams({ name, id, status }, { name: '', id: '', status: 'active' });
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const debouncedFetch = useCallback(
    (name: string, id: string, status: string): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        pagination.reset();
        void fetchSchemas(undefined, name, id, status);
      }, DEBOUNCE_MS);
    },
    [fetchSchemas, pagination],
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      setNameFilter(value);
      syncUrlParams(value, idFilter, statusFilter);
      debouncedFetch(value, idFilter, statusFilter);
    },
    [idFilter, statusFilter, syncUrlParams, debouncedFetch],
  );

  const handleIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      setIdFilter(value);
      syncUrlParams(nameFilter, value, statusFilter);
      debouncedFetch(nameFilter, value, statusFilter);
    },
    [nameFilter, statusFilter, syncUrlParams, debouncedFetch],
  );

  const handleStatusChange = useCallback(
    (value: string): void => {
      setStatusFilter(value);
      syncUrlParams(nameFilter, idFilter, value);
      pagination.reset();
      void fetchSchemas(undefined, nameFilter, idFilter, value);
    },
    [nameFilter, idFilter, syncUrlParams, fetchSchemas, pagination],
  );

  const filterBar = (
    <>
      <Input
        placeholder="Filter by name..."
        value={nameFilter}
        onChange={handleNameChange}
        prefix={<SearchOutlined />}
        aria-label="Filter by name"
        style={{ maxWidth: 200 }}
      />
      <Input
        placeholder="Filter by ID..."
        value={idFilter}
        onChange={handleIdChange}
        prefix={<IdcardOutlined />}
        aria-label="Filter by ID"
        style={{ maxWidth: 200 }}
      />
      <Select
        value={statusFilter}
        onChange={handleStatusChange}
        options={STATUS_OPTIONS}
        aria-label="Filter by status"
        style={{ minWidth: 115 }}
      />
    </>
  );

  const createButton = (
    <Button type="primary" icon={<PlusOutlined />} onClick={(): void => void navigate('/schemas/new')}>
      Create Schema
    </Button>
  );

  const renderTable = (): React.JSX.Element => {
    if (initialLoad) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      );
    }

    if (items.length === 0) {
      const hasFilters = nameFilter || idFilter || statusFilter !== 'active';
      return (
        <Result
          icon={hasFilters ? <FilterOutlined /> : <SearchOutlined />}
          title={hasFilters ? 'No matching results' : 'No schemas found'}
          subTitle={hasFilters ? 'Try adjusting your filters.' : 'Create your first schema to get started.'}
          extra={
            !hasFilters ? (
              <Button type="primary" onClick={(): void => void navigate('/schemas/new')}>
                Create Schema
              </Button>
            ) : undefined
          }
        />
      );
    }

    return (
      <table className="pokey-schema-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((schema) => (
            <tr key={schema.id} className="pokey-schema-row" onClick={(): void => void navigate(`/schemas/${schema.id}`)}>
              <td className="pokey-schema-id">{schema.id}</td>
              <td className="pokey-schema-name">{schema.name}</td>
              <td className={`pokey-schema-status pokey-schema-status--${schema.status}`}>{schema.status}</td>
              <td>{schema.createdAt}</td>
              <td>{schema.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
