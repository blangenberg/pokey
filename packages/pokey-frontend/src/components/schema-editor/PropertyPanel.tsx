import React, { useCallback, useMemo } from 'react';
import { Input, InputNumber, Switch, Select, Collapse, Result } from 'antd';
import {
  SettingOutlined,
  UnorderedListOutlined,
  FontSizeOutlined,
  NumberOutlined,
  CheckSquareOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import type { SchemaNode, SchemaNodeType } from '../../utils/schema/schema-types';
import { displayNameToId, treeToJsonSchema } from '../../utils/schema/schema-mapping';

interface PropertyPanelProps {
  node: SchemaNode | null;
  onUpdate: (id: string, updates: Partial<SchemaNode>) => void;
  onSelect: (id: string) => void;
  siblingNames?: Set<string>;
  nodePath?: SchemaNode[];
}

function FormField({
  label,
  helperText,
  error,
  children,
}: {
  label: string;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
      {error && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{error}</div>}
      {!error && helperText && <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>{helperText}</div>}
    </div>
  );
}

function SwitchWithLabel({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Switch checked={checked} onChange={onChange} />
      <span>{label}</span>
    </div>
  );
}

function getBreadcrumbLabel(n: SchemaNode): string {
  if (n.name === '(items)') return 'List Type';
  return n.displayName;
}

function getBreadcrumbTypeLabel(n: SchemaNode): string | null {
  if (n.compositionKind) {
    const labels: Record<string, string> = { allOf: 'All Of', anyOf: 'Any Of', oneOf: 'One Of', not: 'Not', 'if/then/else': 'Conditional' };
    return labels[n.compositionKind] ?? null;
  }
  if (!n.type) return null;
  const labels: Record<string, string> = {
    string: 'Text',
    number: 'Number',
    integer: 'Integer',
    boolean: 'True / False',
    object: 'Object',
    array: 'List',
  };
  return labels[n.type] ?? null;
}

function getTypeIcon(type: SchemaNodeType): React.ReactNode {
  switch (type) {
    case 'object':
      return <span style={{ fontWeight: 'bold', fontSize: 14, fontFamily: 'monospace' }}>{'{}'}</span>;
    case 'array':
      return <UnorderedListOutlined />;
    case 'string':
      return <FontSizeOutlined />;
    case 'number':
    case 'integer':
      return <NumberOutlined />;
    case 'boolean':
      return <CheckSquareOutlined />;
    default:
      return <QuestionCircleOutlined />;
  }
}

export const PropertyPanel = React.memo(function PropertyPanel({
  node,
  onUpdate,
  onSelect,
  siblingNames,
  nodePath,
}: PropertyPanelProps): React.JSX.Element {
  const updateKeyword = useCallback(
    (key: string, value: unknown): void => {
      if (!node) return;
      const newKeywords: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node.keywords)) {
        if (k !== key) newKeywords[k] = v;
      }
      if (value !== undefined && value !== '' && value !== null) {
        newKeywords[key] = value;
      }
      onUpdate(node.id, { keywords: newKeywords });
    },
    [node, onUpdate],
  );

  const updateField = useCallback(
    (field: keyof SchemaNode, value: unknown): void => {
      if (!node) return;
      onUpdate(node.id, { [field]: value } as Partial<SchemaNode>);
    },
    [node, onUpdate],
  );

  const handleDisplayNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      if (!node) return;
      const newDisplayName = e.target.value;
      const newName = displayNameToId(newDisplayName);
      onUpdate(node.id, { displayName: newDisplayName, name: newName || node.name });
    },
    [node, onUpdate],
  );

  const rootJsonPreview = useMemo((): string | null => {
    if (!node || node.name !== 'schema' || node.type !== 'object') return null;
    return JSON.stringify(treeToJsonSchema(node), null, 2);
  }, [node]);

  const breadcrumbElements = useMemo((): React.ReactNode => {
    if (!nodePath || nodePath.length === 0 || !node) return null;
    return (
      <div className="pokey-property-panel-breadcrumbs">
        {nodePath.map((n, i) => {
          const isLast = i === nodePath.length - 1;
          const label = getBreadcrumbLabel(n);
          const typeLabel = getBreadcrumbTypeLabel(n);
          return (
            <React.Fragment key={n.id}>
              {i > 0 && <span className="pokey-breadcrumb-separator">&rsaquo;</span>}
              {isLast ? (
                <span className="pokey-breadcrumb-current">
                  {label}
                  {typeLabel ? <span className="pokey-breadcrumb-type"> ({typeLabel})</span> : null}
                </span>
              ) : (
                <span
                  className="pokey-breadcrumb-ancestor"
                  onClick={(): void => {
                    onSelect(n.id);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {label}
                  {typeLabel ? <span className="pokey-breadcrumb-type"> ({typeLabel})</span> : null}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }, [nodePath, node, onSelect]);

  if (!node) {
    return <Result icon={<SettingOutlined />} title="No node selected" subTitle="Select a node in the tree to configure its properties." />;
  }

  if (rootJsonPreview !== null) {
    return (
      <div className="pokey-property-panel">
        {breadcrumbElements}
        <Input.TextArea
          value={rootJsonPreview}
          readOnly
          style={{ fontFamily: '"Roboto Mono", monospace', fontSize: 13, minHeight: 400, width: '100%' }}
          aria-label="JSON Schema preview"
        />
      </div>
    );
  }

  const nameConflict = siblingNames?.has(node.name) === true;
  const isItemsNode = node.name === '(items)';

  return (
    <div className="pokey-property-panel">
      {breadcrumbElements}

      <Collapse
        defaultActiveKey={['general']}
        items={[
          {
            key: 'general',
            label: 'General',
            children: (
              <div>
                {node.type && (
                  <div className="pokey-property-type-badge">
                    <span className="pokey-property-type-badge-icon">{getTypeIcon(node.type)}</span>
                    <span>{getTypeDisplayLabel(node.type)}</span>
                  </div>
                )}

                {!isItemsNode && (
                  <>
                    <FormField label="Display Name">
                      <Input value={node.displayName} onChange={handleDisplayNameChange} aria-label="Display Name" />
                    </FormField>

                    <FormField
                      label="ID"
                      helperText="Auto-generated from display name"
                      error={nameConflict ? `Duplicate property ID "${node.name}" at this level` : undefined}
                    >
                      <Input value={node.name} readOnly aria-label="Property ID" status={nameConflict ? 'error' : undefined} />
                    </FormField>
                  </>
                )}

                <FormField label="Description">
                  <Input.TextArea
                    value={(node.keywords.description as string | undefined) ?? ''}
                    onChange={(e): void => {
                      updateKeyword('description', e.target.value || undefined);
                    }}
                    aria-label="Description"
                    style={{ width: '100%' }}
                  />
                </FormField>

                {!isItemsNode && (
                  <SwitchWithLabel
                    checked={node.required}
                    label="Required Field"
                    onChange={(checked): void => {
                      updateField('required', checked);
                    }}
                  />
                )}

                {node.type === 'boolean' && (
                  <FormField label="Default Value">
                    <Select
                      value={node.keywords.default === false ? 'false' : 'true'}
                      onChange={(v): void => {
                        updateKeyword('default', v === 'true');
                      }}
                      options={[
                        { value: 'true', label: 'True' },
                        { value: 'false', label: 'False' },
                      ]}
                      style={{ width: '100%' }}
                      aria-label="Default value"
                    />
                  </FormField>
                )}

                {node.type === 'string' && (
                  <FormField label="Enum (allowed values)">
                    <Select
                      mode="tags"
                      value={(node.keywords.enum as string[] | undefined) ?? []}
                      onChange={(values: string[]): void => {
                        updateKeyword('enum', values.length > 0 ? values : undefined);
                      }}
                      placeholder="Add value..."
                      style={{ width: '100%' }}
                      aria-label="Enum values"
                    />
                  </FormField>
                )}
              </div>
            ),
          },
        ]}
      />

      {renderValidationSection(node.type, node.keywords, updateKeyword)}

      {Object.keys(node.extraKeywords).length > 0 && (
        <Collapse
          defaultActiveKey={[]}
          items={[
            {
              key: 'advanced',
              label: 'Advanced (Additional Keywords)',
              children: (
                <div>
                  <Input.TextArea
                    value={JSON.stringify(node.extraKeywords, null, 2)}
                    readOnly
                    style={{ fontFamily: 'monospace', minHeight: 120, width: '100%' }}
                    aria-label="Additional keywords"
                  />
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
});

function getTypeDisplayLabel(type: SchemaNodeType): string {
  const labels: Record<SchemaNodeType, string> = {
    string: 'Text',
    number: 'Number',
    integer: 'Integer',
    boolean: 'True / False',
    object: 'Object',
    array: 'List',
  };
  return labels[type];
}

function renderValidationSection(
  type: SchemaNodeType | undefined,
  keywords: Record<string, unknown>,
  updateKeyword: (key: string, value: unknown) => void,
): React.JSX.Element | null {
  if (!type) return null;

  const stringFields = type === 'string' && (
    <div>
      <FormField label="Min Length">
        <InputNumber
          value={keywords.minLength as number | undefined}
          onChange={(v: number | null): void => {
            updateKeyword('minLength', v === null || Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          style={{ width: '100%' }}
          aria-label="Min Length"
        />
      </FormField>
      <FormField label="Max Length">
        <InputNumber
          value={keywords.maxLength as number | undefined}
          onChange={(v: number | null): void => {
            updateKeyword('maxLength', v === null || Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          style={{ width: '100%' }}
          aria-label="Max Length"
        />
      </FormField>
      <FormField label="Pattern (regex)">
        <Input
          value={(keywords.pattern as string | undefined) ?? ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
            updateKeyword('pattern', e.target.value || undefined);
          }}
          aria-label="Pattern"
        />
      </FormField>
    </div>
  );

  const numericFields = (type === 'number' || type === 'integer') && (
    <div>
      <FormField label="Minimum">
        <InputNumber
          value={keywords.minimum as number | undefined}
          onChange={(v: number | null): void => {
            updateKeyword('minimum', v === null || Number.isNaN(v) ? undefined : v);
          }}
          style={{ width: '100%' }}
          aria-label="Minimum"
        />
      </FormField>
      <FormField label="Maximum">
        <InputNumber
          value={keywords.maximum as number | undefined}
          onChange={(v: number | null): void => {
            updateKeyword('maximum', v === null || Number.isNaN(v) ? undefined : v);
          }}
          style={{ width: '100%' }}
          aria-label="Maximum"
        />
      </FormField>
      <FormField label="Exclusive Minimum">
        <InputNumber
          value={keywords.exclusiveMinimum as number | undefined}
          onChange={(v: number | null): void => {
            updateKeyword('exclusiveMinimum', v === null || Number.isNaN(v) ? undefined : v);
          }}
          style={{ width: '100%' }}
          aria-label="Exclusive Minimum"
        />
      </FormField>
      <FormField label="Exclusive Maximum">
        <InputNumber
          value={keywords.exclusiveMaximum as number | undefined}
          onChange={(v: number | null): void => {
            updateKeyword('exclusiveMaximum', v === null || Number.isNaN(v) ? undefined : v);
          }}
          style={{ width: '100%' }}
          aria-label="Exclusive Maximum"
        />
      </FormField>
    </div>
  );

  const arrayFields = type === 'array' && (
    <div>
      <FormField label="Min Items">
        <InputNumber
          value={keywords.minItems as number | undefined}
          onChange={(v: number | null): void => {
            updateKeyword('minItems', v === null || Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          style={{ width: '100%' }}
          aria-label="Min Items"
        />
      </FormField>
      <FormField label="Max Items">
        <InputNumber
          value={keywords.maxItems as number | undefined}
          onChange={(v: number | null): void => {
            updateKeyword('maxItems', v === null || Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          style={{ width: '100%' }}
          aria-label="Max Items"
        />
      </FormField>
      <SwitchWithLabel
        checked={Boolean(keywords.uniqueItems)}
        label="Unique Items"
        onChange={(checked): void => {
          updateKeyword('uniqueItems', checked ? true : undefined);
        }}
      />
    </div>
  );

  const objectFields = type === 'object' && (
    <div>
      <SwitchWithLabel
        checked={keywords.additionalProperties !== false}
        label="Additional Properties"
        onChange={(checked): void => {
          updateKeyword('additionalProperties', checked ? undefined : false);
        }}
      />
      <FormField label="Min Properties">
        <InputNumber
          value={keywords.minProperties as number | undefined}
          onChange={(v: number | null): void => {
            updateKeyword('minProperties', v === null || Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          style={{ width: '100%' }}
          aria-label="Min Properties"
        />
      </FormField>
      <FormField label="Max Properties">
        <InputNumber
          value={keywords.maxProperties as number | undefined}
          onChange={(v: number | null): void => {
            updateKeyword('maxProperties', v === null || Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          style={{ width: '100%' }}
          aria-label="Max Properties"
        />
      </FormField>
    </div>
  );

  const content = stringFields || numericFields || arrayFields || objectFields;
  if (!content) return null;

  return <Collapse defaultActiveKey={['validation']} items={[{ key: 'validation', label: 'Validation', children: content }]} />;
}
