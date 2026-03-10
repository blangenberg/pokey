import { PaginationControls } from './PaginationControls';
import type { Story } from '@ladle/react';

export const BothDisabled: Story = (): React.JSX.Element => (
  <PaginationControls canGoBack={false} canGoNext={false} onBack={(): void => undefined} onNext={(): void => undefined} />
);

export const BackEnabled: Story = (): React.JSX.Element => (
  <PaginationControls
    canGoBack
    canGoNext={false}
    onBack={(): void => {
      alert('Back');
    }}
    onNext={(): void => undefined}
  />
);

export const NextEnabled: Story = (): React.JSX.Element => (
  <PaginationControls
    canGoBack={false}
    canGoNext
    onBack={(): void => undefined}
    onNext={(): void => {
      alert('Next');
    }}
  />
);

export const BothEnabled: Story = (): React.JSX.Element => (
  <PaginationControls
    canGoBack
    canGoNext
    onBack={(): void => {
      alert('Back');
    }}
    onNext={(): void => {
      alert('Next');
    }}
  />
);

export const Loading: Story = (): React.JSX.Element => (
  <PaginationControls canGoBack canGoNext loading onBack={(): void => undefined} onNext={(): void => undefined} />
);
