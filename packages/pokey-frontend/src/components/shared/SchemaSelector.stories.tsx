import { useState } from 'react';
import { SchemaSelector } from './SchemaSelector';
import type { Story } from '@ladle/react';

interface SchemaOption {
  id: string;
  name: string;
  status: string;
}

export const Default: Story = (): React.JSX.Element => {
  const [value, setValue] = useState<SchemaOption | null>(null);
  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <p style={{ marginBottom: 8 }}>Note: API calls will fail in Ladle; this demonstrates the input UX.</p>
      <SchemaSelector value={value} onSelect={setValue} placeholder="Search schemas..." />
      <p style={{ marginTop: 12, opacity: 0.6 }}>Selected: {value ? value.name : 'None'}</p>
    </div>
  );
};

export const ActiveOnly: Story = (): React.JSX.Element => {
  const [value, setValue] = useState<SchemaOption | null>(null);
  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <SchemaSelector value={value} onSelect={setValue} statusFilter="active" placeholder="Select active schema..." />
    </div>
  );
};

export const Disabled: Story = (): React.JSX.Element => (
  <div style={{ padding: 20, maxWidth: 400 }}>
    <SchemaSelector value={{ id: 'abc', name: 'Locked Schema', status: 'active' }} onSelect={(): void => undefined} disabled />
  </div>
);
