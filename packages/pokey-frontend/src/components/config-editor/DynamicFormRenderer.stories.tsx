import { useState } from 'react';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import type { Story } from '@ladle/react';

const simpleSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', title: 'Page Title', description: 'The main page title' },
    theme: { type: 'string', title: 'Theme', enum: ['light', 'dark', 'auto'] },
    maxItems: { type: 'integer', title: 'Max Items', minimum: 1, maximum: 100 },
    published: { type: 'boolean', title: 'Published', default: false },
  },
  required: ['title', 'theme'],
};

const nestedSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Config Name' },
    settings: {
      type: 'object',
      title: 'Settings',
      properties: {
        color: { type: 'string', title: 'Primary Color' },
        fontSize: { type: 'number', title: 'Font Size', minimum: 8, maximum: 72 },
      },
    },
    widgets: {
      type: 'array',
      title: 'Widgets',
      items: { type: 'string' },
    },
  },
};

export const SimpleForm: Story = (): React.JSX.Element => {
  const [data, setData] = useState<Record<string, unknown>>({ theme: 'light', published: false });
  return (
    <div style={{ padding: 16, maxWidth: 600 }}>
      <DynamicFormRenderer schema={simpleSchema as Record<string, unknown>} data={data} onChange={setData} errors={new Map()} />
      <pre style={{ marginTop: 16, opacity: 0.6, fontSize: 12 }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export const NestedForm: Story = (): React.JSX.Element => {
  const [data, setData] = useState<Record<string, unknown>>({ settings: {}, widgets: [] });
  return (
    <div style={{ padding: 16, maxWidth: 600 }}>
      <DynamicFormRenderer schema={nestedSchema as Record<string, unknown>} data={data} onChange={setData} errors={new Map()} />
      <pre style={{ marginTop: 16, opacity: 0.6, fontSize: 12 }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export const WithErrors: Story = (): React.JSX.Element => {
  const errors = new Map<string, string>([
    ['/title', 'Title is required'],
    ['/maxItems', 'Must be at least 1'],
  ]);
  return (
    <div style={{ padding: 16, maxWidth: 600 }}>
      <DynamicFormRenderer schema={simpleSchema as Record<string, unknown>} data={{}} onChange={(): void => undefined} errors={errors} />
    </div>
  );
};
