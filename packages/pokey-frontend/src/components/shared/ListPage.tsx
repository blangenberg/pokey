import React from 'react';
import type { ReactNode } from 'react';
import { PaginationControls } from './PaginationControls';
import './ListPage.scss';

interface ListPageProps {
  filterBar: ReactNode;
  createButton: ReactNode;
  table: ReactNode;
  canGoBack: boolean;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
}

export const ListPage = React.memo(function ListPage({
  filterBar,
  createButton,
  table,
  canGoBack,
  canGoNext,
  onBack,
  onNext,
  loading,
}: ListPageProps): React.JSX.Element {
  return (
    <div className="pokey-list-page">
      <div className="pokey-list-page-header">
        <div className="pokey-list-page-filters">{filterBar}</div>
        <div className="pokey-list-page-actions">{createButton}</div>
      </div>

      <div className="pokey-list-page-pagination-top">
        <PaginationControls canGoBack={canGoBack} canGoNext={canGoNext} onBack={onBack} onNext={onNext} loading={loading} />
      </div>

      <div className={`pokey-list-page-table ${loading ? 'pokey-list-page-table--loading' : ''}`}>{table}</div>

      <div className="pokey-list-page-pagination-bottom">
        <PaginationControls canGoBack={canGoBack} canGoNext={canGoNext} onBack={onBack} onNext={onNext} loading={loading} />
      </div>
    </div>
  );
});
