import { useState } from 'react';
import { StatusToggle } from './StatusToggle';
import type { Story } from '@ladle/react';

export const Active: Story = (): React.JSX.Element => {
  const [status, setStatus] = useState('active');
  return (
    <StatusToggle
      status={status}
      onToggle={async (newStatus): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setStatus(newStatus);
      }}
    />
  );
};

export const Disabled: Story = (): React.JSX.Element => {
  const [status, setStatus] = useState('disabled');
  return (
    <StatusToggle
      status={status}
      onToggle={async (newStatus): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setStatus(newStatus);
      }}
    />
  );
};

export const ToggleDisabled: Story = (): React.JSX.Element => (
  <StatusToggle status="active" onToggle={(): Promise<void> => Promise.resolve()} disabled />
);

export const FailsOnToggle: Story = (): React.JSX.Element => (
  <StatusToggle
    status="active"
    onToggle={async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      throw new Error('API failure');
    }}
  />
);
