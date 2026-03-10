import React, { useState, useCallback, useEffect } from 'react';
import { AutoComplete, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useSchemaSearch } from '../../hooks/use-schema-search';

interface SchemaOption {
  id: string;
  name: string;
  status: string;
}

interface SchemaSelectorProps {
  value: SchemaOption | null;
  onSelect: (schema: SchemaOption | null) => void;
  statusFilter?: 'active' | undefined;
  disabled?: boolean;
  placeholder?: string;
}

const MIN_QUERY_LENGTH = 3;

export const SchemaSelector = React.memo(function SchemaSelector({
  value,
  onSelect,
  statusFilter,
  disabled,
  placeholder = 'Search schemas...',
}: SchemaSelectorProps): React.JSX.Element {
  const [query, setQuery] = useState(value?.name ?? '');
  const { results: items, loading, search } = useSchemaSearch({ statusFilter });

  useEffect((): void => {
    if (value?.name && value.name.length >= MIN_QUERY_LENGTH) {
      setQuery(value.name);
      search(value.name);
    }
  }, [value?.name, search]);

  const handleSearch = useCallback(
    (searchText: string): void => {
      setQuery(searchText);
      search(searchText);
    },
    [search],
  );

  const handleSelect = useCallback(
    (selectedValue: string): void => {
      const item = items.find((i) => i.id === selectedValue);
      if (item) {
        onSelect(item);
        setQuery('');
      }
    },
    [items, onSelect],
  );

  const options = React.useMemo((): { value: string; label: React.ReactNode; disabled?: boolean }[] => {
    if (loading) {
      return [{ value: '__loading', label: <Spin size="small" />, disabled: true }];
    }
    if (query.length > 0 && query.length < MIN_QUERY_LENGTH) {
      return [{ value: '__min', label: 'Type at least 3 characters to search', disabled: true }];
    }
    if (query.length >= MIN_QUERY_LENGTH && items.length === 0) {
      return [{ value: '__none', label: 'No schemas found', disabled: true }];
    }
    if (query.length === 0) {
      return [{ value: '__start', label: 'Start typing to search schemas', disabled: true }];
    }
    return items.map((item) => {
      const isDimmed = item.status !== 'active';
      return {
        value: item.id,
        label: (
          <span>
            <span style={{ opacity: isDimmed ? 0.5 : 1 }}>{item.name}</span>
            {statusFilter !== 'active' && <span style={{ marginLeft: 8, color: '#999' }}>{item.status}</span>}
          </span>
        ),
      };
    });
  }, [loading, query, items, statusFilter]);

  const handleChange = useCallback(
    (inputValue: string): void => {
      handleSearch(inputValue);
      if (inputValue === '' && value) {
        onSelect(null);
      }
    },
    [handleSearch, value, onSelect],
  );

  return (
    <AutoComplete
      value={query}
      options={options}
      onChange={handleChange}
      onSelect={handleSelect}
      disabled={disabled}
      placeholder={placeholder}
      aria-label="Search schemas"
      style={{ width: '100%' }}
      notFoundContent={null}
      showSearch={{ onSearch: handleSearch, filterOption: false }}
      prefix={<SearchOutlined />}
    />
  );
});
