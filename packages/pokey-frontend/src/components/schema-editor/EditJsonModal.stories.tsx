import { useState } from 'react';
import { Button } from '@blueprintjs/core';
import { EditJsonModal } from './EditJsonModal';
import type { Story } from '@ladle/react';

type JsonSchema = Record<string, unknown>;

const validSchema: JsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer', minimum: 0 },
  },
  required: ['name'],
};

export const Default: Story = (): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(true);
  const [schema, setSchema] = useState<JsonSchema>(validSchema);

  return (
    <div style={{ padding: 16 }}>
      <Button
        text="Open Modal"
        onClick={(): void => {
          setIsOpen(true);
        }}
      />
      <EditJsonModal
        isOpen={isOpen}
        schema={schema}
        onAccept={(s): void => {
          setSchema(s);
          setIsOpen(false);
        }}
        onCancel={(): void => {
          setIsOpen(false);
        }}
      />
      <pre style={{ marginTop: 16 }}>{JSON.stringify(schema, null, 2)}</pre>
    </div>
  );
};

export const EmptySchema: Story = (): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{ padding: 16 }}>
      <Button
        text="Open Modal"
        onClick={(): void => {
          setIsOpen(true);
        }}
      />
      <EditJsonModal
        isOpen={isOpen}
        schema={{}}
        onAccept={(): void => {
          setIsOpen(false);
        }}
        onCancel={(): void => {
          setIsOpen(false);
        }}
      />
    </div>
  );
};
