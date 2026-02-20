import { ErrorBoundary } from './ErrorBoundary';
import type { Story } from '@ladle/react';

function ThrowingComponent(): React.JSX.Element {
  throw new Error('Test error for ErrorBoundary story');
}

export const WithError: Story = (): React.JSX.Element => (
  <ErrorBoundary>
    <ThrowingComponent />
  </ErrorBoundary>
);

export const WithContent: Story = (): React.JSX.Element => (
  <ErrorBoundary>
    <p>Normal content renders fine.</p>
  </ErrorBoundary>
);
