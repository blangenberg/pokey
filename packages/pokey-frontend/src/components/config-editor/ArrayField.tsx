import React, { useCallback } from 'react';
import { Button, Card, Input, InputNumber, Select, Switch } from 'antd';
import { PlusOutlined, MinusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { DynamicFormRenderer } from './DynamicFormRenderer';

type JsonSchema = Record<string, unknown>;

interface ArrayFieldProps {
  fieldName: string;
  itemSchema: JsonSchema;
  items: unknown[];
  onChange: (items: unknown[]) => void;
  minItems?: number;
  maxItems?: number;
  errors: Map<string, string>;
  path: string;
  isRequired?: boolean;
  description?: string;
}

export const ArrayField = React.memo(function ArrayField({
  fieldName,
  itemSchema,
  items,
  onChange,
  minItems,
  maxItems,
  errors,
  path,
  isRequired,
  description,
}: ArrayFieldProps): React.JSX.Element {
  const itemType = itemSchema.type as string | undefined;

  const handleAdd = useCallback((): void => {
    const defaultItem = getDefaultForSchema(itemSchema);
    onChange([...items, defaultItem]);
  }, [items, onChange, itemSchema]);

  const handleRemove = useCallback(
    (index: number): void => {
      const newItems = [...items];
      newItems.splice(index, 1);
      onChange(newItems);
    },
    [items, onChange],
  );

  const handleItemChange = useCallback(
    (index: number, value: unknown): void => {
      const newItems = [...items];
      newItems[index] = value;
      onChange(newItems);
    },
    [items, onChange],
  );

  const canAdd = maxItems === undefined || items.length < maxItems;
  const canRemove = minItems === undefined || items.length > minItems;
  const fieldError = errors.get(path);

  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UnorderedListOutlined style={{ fontSize: 14 }} />
          <strong>{fieldName}</strong>
          {isRequired && <span style={{ color: '#db3737' }}>*</span>}
          <span style={{ opacity: 0.5, fontSize: 12 }}>({String(items.length)} items)</span>
        </div>
        <Button icon={<PlusOutlined />} size="small" onClick={handleAdd} disabled={!canAdd} aria-label={`Add ${fieldName} item`}>
          Add Item
        </Button>
      </div>

      {description && <p style={{ opacity: 0.5, fontSize: 12, marginBottom: 8 }}>{description}</p>}
      {fieldError && <p style={{ color: '#db3737', fontSize: 12 }}>{fieldError}</p>}

      {items.length === 0 && <p style={{ opacity: 0.4, fontStyle: 'italic', fontSize: 13 }}>No items. Click "Add Item" to begin.</p>}

      {items.map((item, index) => {
        const itemPath = `${path}/${String(index)}`;
        const itemError = errors.get(itemPath);

        return (
          <div key={`item-${String(index)}`} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <span style={{ opacity: 0.4, fontSize: 12, marginTop: 8, minWidth: 24 }}>#{String(index + 1)}</span>

            <div style={{ flex: 1 }}>
              {itemType === 'object' ? (
                <DynamicFormRenderer
                  schema={itemSchema}
                  data={(typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>}
                  onChange={(newData): void => {
                    handleItemChange(index, newData);
                  }}
                  errors={errors}
                  path={itemPath}
                />
              ) : (
                <div>
                  {renderPrimitiveItem(item, itemSchema, itemError, (value): void => {
                    handleItemChange(index, value);
                  })}
                </div>
              )}
            </div>

            <Button
              icon={<MinusOutlined />}
              size="small"
              danger
              type="text"
              onClick={(): void => {
                handleRemove(index);
              }}
              disabled={!canRemove}
              aria-label={`Remove ${fieldName} item ${String(index + 1)}`}
            />
          </div>
        );
      })}
    </Card>
  );
});

function renderPrimitiveItem(
  value: unknown,
  schema: JsonSchema,
  error: string | undefined,
  onChange: (value: unknown) => void,
): React.JSX.Element {
  const type = schema.type as string | undefined;
  const enumValues = schema.enum as unknown[] | undefined;

  if (enumValues) {
    const selectValue = typeof value === 'string' ? value : undefined;
    const options = [{ value: '', label: 'Select...' }, ...enumValues.map((v) => ({ value: String(v), label: String(v) }))];
    return (
      <Select
        value={selectValue ?? ''}
        onChange={(v): void => {
          onChange(v || undefined);
        }}
        options={options}
        style={{ width: '100%' }}
        status={error ? 'error' : undefined}
      />
    );
  }

  if (type === 'string') {
    return (
      <Input
        value={typeof value === 'string' ? value : ''}
        onChange={(e): void => {
          onChange(e.target.value);
        }}
        style={{ width: '100%' }}
        status={error ? 'error' : undefined}
      />
    );
  }

  if (type === 'number' || type === 'integer') {
    const numValue = typeof value === 'number' ? value : undefined;
    return (
      <InputNumber
        value={numValue}
        onChange={(v): void => {
          onChange(v === null ? undefined : v);
        }}
        step={type === 'integer' ? 1 : undefined}
        style={{ width: '100%' }}
        status={error ? 'error' : undefined}
      />
    );
  }

  if (type === 'boolean') {
    return (
      <Switch
        checked={Boolean(value)}
        onChange={(checked): void => {
          onChange(checked);
        }}
      />
    );
  }

  return (
    <Input
      value={typeof value === 'string' ? value : JSON.stringify(value ?? '')}
      onChange={(e): void => {
        onChange(e.target.value);
      }}
      style={{ width: '100%' }}
    />
  );
}

function getDefaultForSchema(schema: JsonSchema): unknown {
  if (schema.default !== undefined) return schema.default;
  const type = schema.type as string | undefined;
  switch (type) {
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'object':
      return {};
    case 'array':
      return [];
    default:
      return '';
  }
}
