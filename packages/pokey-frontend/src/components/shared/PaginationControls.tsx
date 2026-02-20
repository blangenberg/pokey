import React from 'react';
import { Button, ButtonGroup } from '@blueprintjs/core';

interface PaginationControlsProps {
  canGoBack: boolean;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
}

export const PaginationControls = React.memo(function PaginationControls({
  canGoBack,
  canGoNext,
  onBack,
  onNext,
  loading,
}: PaginationControlsProps): React.JSX.Element {
  return (
    <ButtonGroup>
      <Button icon="chevron-left" text="Back" disabled={!canGoBack || loading} onClick={onBack} aria-label="Previous page" />
      <Button icon="chevron-right" text="Next" disabled={!canGoNext || loading} onClick={onNext} aria-label="Next page" />
    </ButtonGroup>
  );
});
