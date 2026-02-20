import React, { useState, useCallback, useEffect } from 'react';
import { Switch } from '@blueprintjs/core';
import { showErrorToast } from '../../services/toaster';

interface StatusToggleProps {
  status: string;
  onToggle: (newStatus: string) => Promise<void>;
  disabled?: boolean;
}

export const StatusToggle = React.memo(function StatusToggle({ status, onToggle, disabled }: StatusToggleProps): React.JSX.Element {
  const [optimisticStatus, setOptimisticStatus] = useState(status);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOptimisticStatus(status);
  }, [status]);

  const handleToggle = useCallback(async (): Promise<void> => {
    const newStatus = optimisticStatus === 'active' ? 'disabled' : 'active';
    setOptimisticStatus(newStatus);
    setLoading(true);

    try {
      await onToggle(newStatus);
    } catch {
      setOptimisticStatus(status);
      void showErrorToast('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [optimisticStatus, onToggle, status]);

  const isActive = optimisticStatus === 'active';

  return (
    <Switch
      checked={isActive}
      label={isActive ? 'Active' : 'Disabled'}
      intent={isActive ? 'success' : 'danger'}
      disabled={disabled || loading}
      onChange={(): void => {
        void handleToggle();
      }}
      aria-label={`Status: ${isActive ? 'active' : 'disabled'}`}
    />
  );
});
