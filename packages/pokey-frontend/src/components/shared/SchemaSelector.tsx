import React, { useState, useCallback } from 'react';
import { MenuItem, Spinner } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
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
  const [query, setQuery] = useState('');
  const { results: items, loading, search } = useSchemaSearch({ statusFilter });

  const handleQueryChange = useCallback(
    (newQuery: string): void => {
      setQuery(newQuery);
      search(newQuery);
    },
    [search],
  );

  const handleItemSelect = useCallback(
    (item: SchemaOption): void => {
      onSelect(item);
      setQuery(item.name);
    },
    [onSelect],
  );

  const renderItem = useCallback(
    (
      item: SchemaOption,
      { handleClick, modifiers }: { handleClick: React.MouseEventHandler; modifiers: { active: boolean; matchesPredicate: boolean } },
    ): React.JSX.Element | null => {
      if (!modifiers.matchesPredicate) return null;
      const isDimmed = item.status !== 'active';
      return (
        <MenuItem
          key={item.id}
          text={<span style={{ opacity: isDimmed ? 0.5 : 1 }}>{item.name}</span>}
          label={statusFilter === 'active' ? undefined : item.status}
          active={modifiers.active}
          onClick={handleClick}
        />
      );
    },
    [statusFilter],
  );

  const renderNoResults = useCallback((): React.JSX.Element => {
    if (loading) {
      return <MenuItem disabled text={<Spinner size={16} />} />;
    }
    if (query.length > 0 && query.length < MIN_QUERY_LENGTH) {
      return <MenuItem disabled text="Type at least 3 characters to search" />;
    }
    if (query.length >= MIN_QUERY_LENGTH) {
      return <MenuItem disabled text="No schemas found" />;
    }
    return <MenuItem disabled text="Start typing to search schemas" />;
  }, [loading, query]);

  return (
    <Suggest<SchemaOption>
      items={items}
      itemRenderer={renderItem}
      onItemSelect={handleItemSelect}
      query={query}
      onQueryChange={handleQueryChange}
      selectedItem={value}
      noResults={renderNoResults()}
      inputValueRenderer={(item): string => item.name}
      disabled={disabled}
      resetOnClose={false}
      resetOnSelect={false}
      inputProps={{
        placeholder,
        leftIcon: 'search',
        'aria-label': 'Search schemas',
      }}
      popoverProps={{
        minimal: true,
        matchTargetWidth: true,
      }}
    />
  );
});
