import React from 'react';
import { Button, Space } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

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
    <Space.Compact>
      <Button icon={<LeftOutlined />} disabled={!canGoBack || loading} onClick={onBack} aria-label="Previous page">
        Back
      </Button>
      <Button icon={<RightOutlined />} disabled={!canGoNext || loading} onClick={onNext} aria-label="Next page">
        Next
      </Button>
    </Space.Compact>
  );
});
