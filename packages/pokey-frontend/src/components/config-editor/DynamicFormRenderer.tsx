import React, { useCallback } from 'react';
import { Input, InputNumber, Switch, Select, Card } from 'antd';
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

function FormFieldWrapper({
  label,
  helperText,
  error,
  children,
}: {
  label: React.ReactNode | null;
  helperText: string | undefined;
  error: string | undefined;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: 16 }}>
      {label != null && <div style={{ marginBottom: 4 }}>{label}</div>}
      {children}
      <div style={{ color: error ? '#ff4d4f' : '#999', fontSize: 12, marginTop: 4 }}>{helperText}</div>
    </div>
  );
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
    const selectValue = typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : '';
    const options = [{ value: '', label: 'Select...' }, ...(enumValues ?? []).map((v) => ({ value: String(v), label: String(v) }))];
    return (
      <FormFieldWrapper label={label} helperText={error ?? description} error={error}>
        <Select
          value={selectValue}
          onChange={(v): void => {
            onChange(v || undefined);
          }}
          options={options}
          aria-label={fieldName}
          style={{ width: '100%' }}
        />
      </FormFieldWrapper>
    );
  }

  if (controlType === 'date-input' || controlType === 'textarea' || controlType === 'text-input') {
    if (controlType === 'date-input') {
      const dateValue = typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : '';
      return (
        <FormFieldWrapper label={label} helperText={error ?? description} error={error}>
          <Input
            type="datetime-local"
            value={dateValue}
            onChange={(e): void => {
              onChange(e.target.value || undefined);
            }}
            status={error ? 'error' : undefined}
            aria-label={fieldName}
          />
        </FormFieldWrapper>
      );
    }

    const textValue = typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : '';
    return (
      <FormFieldWrapper label={label} helperText={error ?? description} error={error}>
        {controlType === 'textarea' ? (
          <Input.TextArea
            value={textValue}
            onChange={(e): void => {
              onChange(e.target.value);
            }}
            style={{ width: '100%' }}
            status={error ? 'error' : undefined}
            aria-label={fieldName}
          />
        ) : (
          <Input
            value={textValue}
            onChange={(e): void => {
              onChange(e.target.value);
            }}
            status={error ? 'error' : undefined}
            aria-label={fieldName}
          />
        )}
      </FormFieldWrapper>
    );
  }

  if (controlType === 'numeric-input') {
    const fieldType = fieldSchema.type as string | undefined;
    const min = fieldSchema.minimum as number | undefined;
    const max = fieldSchema.maximum as number | undefined;
    const step = fieldType === 'integer' ? 1 : undefined;
    const numValue = typeof value === 'number' ? value : typeof defaultValue === 'number' ? defaultValue : undefined;

    return (
      <FormFieldWrapper label={label} helperText={error ?? description} error={error}>
        <InputNumber
          value={numValue}
          onChange={(v): void => {
            onChange(v === null ? undefined : v);
          }}
          min={min}
          max={max}
          step={step}
          status={error ? 'error' : undefined}
          aria-label={fieldName}
          style={{ width: '100%' }}
        />
      </FormFieldWrapper>
    );
  }

  if (controlType === 'boolean-switch') {
    const boolValue = typeof value === 'boolean' ? value : typeof defaultValue === 'boolean' ? defaultValue : false;
    return (
      <FormFieldWrapper label={null} helperText={error ?? description} error={error}>
        <div>
          <Switch
            checked={boolValue}
            onChange={(checked): void => {
              onChange(checked);
            }}
            aria-label={fieldName}
          />
          <span style={{ marginLeft: 8 }}>{displayLabel}</span>
        </div>
      </FormFieldWrapper>
    );
  }

  if (controlType === 'object-fieldset') {
    const objectValue = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
    return (
      <Card className="pokey-form-object-card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontWeight: 'bold', fontSize: 14, fontFamily: 'monospace' }}>{'{}'}</span>
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

  const fallbackValue = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return (
    <FormFieldWrapper label={label} helperText={error ?? description ?? 'Unsupported field type'} error={error}>
      <Input
        value={fallbackValue}
        onChange={(e): void => {
          onChange(e.target.value);
        }}
        aria-label={fieldName}
      />
    </FormFieldWrapper>
  );
});
