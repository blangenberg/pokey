import React, { useCallback } from 'react';
import {
  FormGroup,
  InputGroup,
  TextArea,
  Switch,
  NumericInput,
  HTMLSelect,
  NonIdealState,
  TagInput,
  Section,
  SectionCard,
} from '@blueprintjs/core';
import type { SchemaNode, SchemaNodeType } from '../../utils/schema/schema-types';
import { displayNameToId } from '../../utils/schema/schema-mapping';

interface PropertyPanelProps {
  node: SchemaNode | null;
  onUpdate: (id: string, updates: Partial<SchemaNode>) => void;
}

const STRING_FORMAT_OPTIONS = [
  '',
  'email',
  'uri',
  'uri-reference',
  'date',
  'date-time',
  'time',
  'hostname',
  'ipv4',
  'ipv6',
  'uuid',
  'json-pointer',
  'relative-json-pointer',
  'regex',
];

export const PropertyPanel = React.memo(function PropertyPanel({ node, onUpdate }: PropertyPanelProps): React.JSX.Element {
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

  if (!node) {
    return (
      <NonIdealState icon="properties" title="No node selected" description="Select a node in the tree to configure its properties." />
    );
  }

  const isRoot = node.name === 'root' && node.type === 'object';

  return (
    <div className="pokey-property-panel">
      <h4 className="pokey-property-panel-header">Configuration: {node.displayName}</h4>

      <Section title="General" collapsible defaultIsOpen>
        <SectionCard>
          <FormGroup label="Display Name">
            <InputGroup value={node.displayName} onChange={handleDisplayNameChange} disabled={isRoot} aria-label="Display Name" />
          </FormGroup>

          <FormGroup label="ID" helperText="Auto-generated from display name">
            <InputGroup value={node.name} readOnly aria-label="Property ID" />
          </FormGroup>

          {node.type && !isRoot && (
            <FormGroup label="Type">
              <InputGroup value={getTypeDisplayLabel(node.type)} readOnly aria-label="Type" />
            </FormGroup>
          )}

          <FormGroup label="Description">
            <TextArea
              value={node.description ?? ''}
              onChange={(e): void => {
                updateField('description', e.target.value || undefined);
              }}
              fill
              aria-label="Description"
            />
          </FormGroup>

          {!isRoot && (
            <Switch
              checked={node.required}
              label="Required Field"
              onChange={(): void => {
                updateField('required', !node.required);
              }}
            />
          )}

          <FormGroup label="Default">
            <InputGroup
              value={typeof node.keywords.default === 'string' ? node.keywords.default : JSON.stringify(node.keywords.default ?? '')}
              onChange={(e): void => {
                updateKeyword('default', e.target.value || undefined);
              }}
              aria-label="Default value"
            />
          </FormGroup>

          <FormGroup label="Enum (allowed values)">
            <TagInput
              values={(node.keywords.enum as string[] | undefined) ?? []}
              onAdd={(values): void => {
                const current = (node.keywords.enum as string[] | undefined) ?? [];
                updateKeyword('enum', [...current, ...values]);
              }}
              onRemove={(_value, index): void => {
                const current = [...((node.keywords.enum as string[] | undefined) ?? [])];
                current.splice(index, 1);
                updateKeyword('enum', current.length > 0 ? current : undefined);
              }}
              placeholder="Add value..."
              aria-label="Enum values"
            />
          </FormGroup>

          <FormGroup label="Const">
            <InputGroup
              value={typeof node.keywords.const === 'string' ? node.keywords.const : JSON.stringify(node.keywords.const ?? '')}
              onChange={(e): void => {
                updateKeyword('const', e.target.value || undefined);
              }}
              aria-label="Const value"
            />
          </FormGroup>

          <FormGroup label="Group">
            <InputGroup
              value={node.group ?? ''}
              onChange={(e): void => {
                updateField('group', e.target.value || undefined);
              }}
              aria-label="Group"
            />
          </FormGroup>
        </SectionCard>
      </Section>

      {renderValidationSection(node.type, node.keywords, updateKeyword)}

      <Section title="Metadata" collapsible defaultIsOpen={false}>
        <SectionCard>
          <FormGroup label="Title">
            <InputGroup
              value={node.title ?? ''}
              onChange={(e): void => {
                updateField('title', e.target.value || undefined);
              }}
              aria-label="Title"
            />
          </FormGroup>

          <FormGroup label="Examples (JSON array)">
            <TextArea
              value={node.keywords.examples ? JSON.stringify(node.keywords.examples) : ''}
              onChange={(e): void => {
                try {
                  const parsed = JSON.parse(e.target.value) as unknown;
                  updateKeyword('examples', parsed);
                } catch {
                  /* allow mid-edit invalid JSON */
                }
              }}
              fill
              aria-label="Examples"
            />
          </FormGroup>

          <Switch
            checked={Boolean(node.keywords.readOnly)}
            label="Read Only"
            onChange={(): void => {
              updateKeyword('readOnly', node.keywords.readOnly ? undefined : true);
            }}
          />

          <Switch
            checked={Boolean(node.keywords.writeOnly)}
            label="Write Only"
            onChange={(): void => {
              updateKeyword('writeOnly', node.keywords.writeOnly ? undefined : true);
            }}
          />

          <FormGroup label="$comment">
            <InputGroup
              value={(node.keywords.$comment as string | undefined) ?? ''}
              onChange={(e): void => {
                updateKeyword('$comment', e.target.value || undefined);
              }}
              aria-label="Comment"
            />
          </FormGroup>
        </SectionCard>
      </Section>

      {Object.keys(node.extraKeywords).length > 0 && (
        <Section title="Advanced (Additional Keywords)" collapsible defaultIsOpen={false}>
          <SectionCard>
            <TextArea
              value={JSON.stringify(node.extraKeywords, null, 2)}
              readOnly
              fill
              style={{ fontFamily: 'monospace', minHeight: 120 }}
              aria-label="Additional keywords"
            />
          </SectionCard>
        </Section>
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
    <SectionCard>
      <FormGroup label="Min Length">
        <NumericInput
          value={keywords.minLength as number | undefined}
          onValueChange={(v): void => {
            updateKeyword('minLength', Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          aria-label="Min Length"
        />
      </FormGroup>
      <FormGroup label="Max Length">
        <NumericInput
          value={keywords.maxLength as number | undefined}
          onValueChange={(v): void => {
            updateKeyword('maxLength', Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          aria-label="Max Length"
        />
      </FormGroup>
      <FormGroup label="Pattern (regex)">
        <InputGroup
          value={(keywords.pattern as string | undefined) ?? ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
            updateKeyword('pattern', e.target.value || undefined);
          }}
          aria-label="Pattern"
        />
      </FormGroup>
      <FormGroup label="Format">
        <HTMLSelect
          value={(keywords.format as string | undefined) ?? ''}
          onChange={(e): void => {
            updateKeyword('format', e.target.value || undefined);
          }}
          aria-label="Format"
        >
          {STRING_FORMAT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt || 'None'}
            </option>
          ))}
        </HTMLSelect>
      </FormGroup>
      <FormGroup label="Content Encoding">
        <InputGroup
          value={(keywords.contentEncoding as string | undefined) ?? ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
            updateKeyword('contentEncoding', e.target.value || undefined);
          }}
          aria-label="Content Encoding"
        />
      </FormGroup>
      <FormGroup label="Content Media Type">
        <InputGroup
          value={(keywords.contentMediaType as string | undefined) ?? ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
            updateKeyword('contentMediaType', e.target.value || undefined);
          }}
          aria-label="Content Media Type"
        />
      </FormGroup>
    </SectionCard>
  );

  const numericFields = (type === 'number' || type === 'integer') && (
    <SectionCard>
      <FormGroup label="Minimum">
        <NumericInput
          value={keywords.minimum as number | undefined}
          onValueChange={(v): void => {
            updateKeyword('minimum', Number.isNaN(v) ? undefined : v);
          }}
          aria-label="Minimum"
        />
      </FormGroup>
      <FormGroup label="Maximum">
        <NumericInput
          value={keywords.maximum as number | undefined}
          onValueChange={(v): void => {
            updateKeyword('maximum', Number.isNaN(v) ? undefined : v);
          }}
          aria-label="Maximum"
        />
      </FormGroup>
      <FormGroup label="Exclusive Minimum">
        <NumericInput
          value={keywords.exclusiveMinimum as number | undefined}
          onValueChange={(v): void => {
            updateKeyword('exclusiveMinimum', Number.isNaN(v) ? undefined : v);
          }}
          aria-label="Exclusive Minimum"
        />
      </FormGroup>
      <FormGroup label="Exclusive Maximum">
        <NumericInput
          value={keywords.exclusiveMaximum as number | undefined}
          onValueChange={(v): void => {
            updateKeyword('exclusiveMaximum', Number.isNaN(v) ? undefined : v);
          }}
          aria-label="Exclusive Maximum"
        />
      </FormGroup>
      <FormGroup label="Multiple Of">
        <NumericInput
          value={keywords.multipleOf as number | undefined}
          onValueChange={(v): void => {
            updateKeyword('multipleOf', Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          aria-label="Multiple Of"
        />
      </FormGroup>
    </SectionCard>
  );

  const arrayFields = type === 'array' && (
    <SectionCard>
      <FormGroup label="Min Items">
        <NumericInput
          value={keywords.minItems as number | undefined}
          onValueChange={(v): void => {
            updateKeyword('minItems', Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          aria-label="Min Items"
        />
      </FormGroup>
      <FormGroup label="Max Items">
        <NumericInput
          value={keywords.maxItems as number | undefined}
          onValueChange={(v): void => {
            updateKeyword('maxItems', Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          aria-label="Max Items"
        />
      </FormGroup>
      <Switch
        checked={Boolean(keywords.uniqueItems)}
        label="Unique Items"
        onChange={(): void => {
          updateKeyword('uniqueItems', keywords.uniqueItems ? undefined : true);
        }}
      />
    </SectionCard>
  );

  const objectFields = type === 'object' && (
    <SectionCard>
      <Switch
        checked={keywords.additionalProperties !== false}
        label="Additional Properties"
        onChange={(): void => {
          updateKeyword('additionalProperties', keywords.additionalProperties === false ? undefined : false);
        }}
      />
      <FormGroup label="Min Properties">
        <NumericInput
          value={keywords.minProperties as number | undefined}
          onValueChange={(v): void => {
            updateKeyword('minProperties', Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          aria-label="Min Properties"
        />
      </FormGroup>
      <FormGroup label="Max Properties">
        <NumericInput
          value={keywords.maxProperties as number | undefined}
          onValueChange={(v): void => {
            updateKeyword('maxProperties', Number.isNaN(v) ? undefined : v);
          }}
          min={0}
          aria-label="Max Properties"
        />
      </FormGroup>
    </SectionCard>
  );

  const content = stringFields || numericFields || arrayFields || objectFields;
  if (!content) return null;

  return (
    <Section title="Validation" collapsible defaultIsOpen>
      {content}
    </Section>
  );
}
