import React, { useCallback } from 'react';
import { FormGroup, InputGroup, NumericInput, Switch, TextArea, HTMLSelect, Card, Icon } from '@blueprintjs/core';
import { ArrayField } from './ArrayField';
import { resolveFieldControl } from '../../utils/config/field-renderer';

type JsonSchema = Record<string, unknown>;

interface DynamicFormRendererProps {
  schema: JsonSchema;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  errors: Map<string, string>;
  path?: string;
}

export const DynamicFormRenderer = React.memo(function DynamicFormRenderer({
  schema,
  data,
  onChange,
  errors,
  path = '',
}: DynamicFormRendererProps): React.JSX.Element {
  const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
  const requiredFields = new Set((schema.required ?? []) as string[]);

  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown): void => {
      onChange({ ...data, [fieldName]: value });
    },
    [data, onChange],
  );

  const propertyEntries = Object.entries(properties);

  if (propertyEntries.length === 0) {
    return <p style={{ opacity: 0.5 }}>No properties defined in schema.</p>;
  }

  return (
    <div className="pokey-dynamic-form">
      {propertyEntries.map(([fieldName, fieldSchema]) => {
        const fieldPath = path ? `${path}/${fieldName}` : `/${fieldName}`;
        const isRequired = requiredFields.has(fieldName);
        const fieldError = errors.get(fieldPath);
        const fieldValue = data[fieldName];

        return (
          <FieldRenderer
            key={fieldName}
            fieldName={fieldName}
            fieldSchema={fieldSchema}
            value={fieldValue}
            isRequired={isRequired}
            error={fieldError}
            path={fieldPath}
            errors={errors}
            onChange={(value): void => {
              handleFieldChange(fieldName, value);
            }}
          />
        );
      })}
    </div>
  );
});

interface FieldRendererProps {
  fieldName: string;
  fieldSchema: JsonSchema;
  value: unknown;
  isRequired: boolean;
  error: string | undefined;
  path: string;
  errors: Map<string, string>;
  onChange: (value: unknown) => void;
}

const FieldRenderer = React.memo(function FieldRenderer({
  fieldName,
  fieldSchema,
  value,
  isRequired,
  error,
  path,
  errors,
  onChange,
}: FieldRendererProps): React.JSX.Element {
  const controlType = resolveFieldControl(fieldSchema, fieldName);
  const enumValues = fieldSchema.enum as unknown[] | undefined;
  const description = fieldSchema.description as string | undefined;
  const defaultValue = fieldSchema.default;

  const displayLabel = typeof fieldSchema.title === 'string' ? fieldSchema.title : fieldName;
  const label = (
    <span>
      {displayLabel}
      {isRequired && <span style={{ color: '#db3737', marginLeft: 4 }}>*</span>}
    </span>
  );

  if (controlType === 'enum-select') {
    return (
      <FormGroup label={label} helperText={error ?? description} intent={error ? 'danger' : undefined}>
        <HTMLSelect
          value={typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : ''}
          onChange={(e): void => {
            onChange(e.target.value || undefined);
          }}
          aria-label={fieldName}
        >
          <option value="">Select...</option>
          {enumValues.map((v) => (
            <option key={String(v)} value={String(v)}>
              {String(v)}
            </option>
          ))}
        </HTMLSelect>
      </FormGroup>
    );
  }

  if (controlType === 'date-input' || controlType === 'textarea' || controlType === 'text-input') {
    if (controlType === 'date-input') {
      return (
        <FormGroup label={label} helperText={error ?? description} intent={error ? 'danger' : undefined}>
          <InputGroup
            type="datetime-local"
            value={typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : ''}
            onChange={(e): void => {
              onChange(e.target.value || undefined);
            }}
            intent={error ? 'danger' : undefined}
            aria-label={fieldName}
          />
        </FormGroup>
      );
    }

    return (
      <FormGroup label={label} helperText={error ?? description} intent={error ? 'danger' : undefined}>
        {controlType === 'textarea' ? (
          <TextArea
            value={typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : ''}
            onChange={(e): void => {
              onChange(e.target.value);
            }}
            fill
            intent={error ? 'danger' : undefined}
            aria-label={fieldName}
          />
        ) : (
          <InputGroup
            value={typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : ''}
            onChange={(e): void => {
              onChange(e.target.value);
            }}
            intent={error ? 'danger' : undefined}
            aria-label={fieldName}
          />
        )}
      </FormGroup>
    );
  }

  if (controlType === 'numeric-input') {
    const fieldType = fieldSchema.type as string | undefined;
    const min = fieldSchema.minimum as number | undefined;
    const max = fieldSchema.maximum as number | undefined;
    const step = fieldType === 'integer' ? 1 : undefined;

    return (
      <FormGroup label={label} helperText={error ?? description} intent={error ? 'danger' : undefined}>
        <NumericInput
          value={typeof value === 'number' ? value : typeof defaultValue === 'number' ? defaultValue : undefined}
          onValueChange={(v): void => {
            onChange(Number.isNaN(v) ? undefined : v);
          }}
          min={min}
          max={max}
          stepSize={step}
          intent={error ? 'danger' : undefined}
          aria-label={fieldName}
        />
      </FormGroup>
    );
  }

  if (controlType === 'boolean-switch') {
    const boolValue = typeof value === 'boolean' ? value : typeof defaultValue === 'boolean' ? defaultValue : false;
    return (
      <FormGroup helperText={error ?? description} intent={error ? 'danger' : undefined}>
        <Switch
          checked={boolValue}
          label={displayLabel}
          onChange={(): void => {
            onChange(!boolValue);
          }}
          aria-label={fieldName}
        />
      </FormGroup>
    );
  }

  if (controlType === 'object-fieldset') {
    const objectValue = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
    return (
      <Card className="pokey-form-object-card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Icon icon="folder-open" size={14} />
          <strong>{displayLabel}</strong>
          {isRequired && <span style={{ color: '#db3737' }}>*</span>}
        </div>
        {description && <p style={{ opacity: 0.5, fontSize: 12, marginBottom: 8 }}>{description}</p>}
        {error && <p style={{ color: '#db3737', fontSize: 12 }}>{error}</p>}
        <DynamicFormRenderer
          schema={fieldSchema}
          data={objectValue}
          onChange={(newData): void => {
            onChange(newData);
          }}
          errors={errors}
          path={path}
        />
      </Card>
    );
  }

  if (controlType === 'array-field') {
    const arrayValue = (Array.isArray(value) ? value : []) as unknown[];
    const itemsSchema = fieldSchema.items as JsonSchema | undefined;

    return (
      <ArrayField
        fieldName={displayLabel}
        itemSchema={itemsSchema ?? {}}
        items={arrayValue}
        onChange={(newItems): void => {
          onChange(newItems);
        }}
        minItems={fieldSchema.minItems as number | undefined}
        maxItems={fieldSchema.maxItems as number | undefined}
        errors={errors}
        path={path}
        isRequired={isRequired}
        description={description}
      />
    );
  }

  return (
    <FormGroup label={label} helperText={error ?? description ?? `Unsupported field type`} intent={error ? 'danger' : undefined}>
      <InputGroup
        value={typeof value === 'string' ? value : JSON.stringify(value ?? '')}
        onChange={(e): void => {
          onChange(e.target.value);
        }}
        aria-label={fieldName}
      />
    </FormGroup>
  );
});
