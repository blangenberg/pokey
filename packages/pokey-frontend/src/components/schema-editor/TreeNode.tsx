import React, { useCallback } from 'react';
import { Icon, Button } from '@blueprintjs/core';
import type { SchemaNode, SchemaNodeType, CompositionKind } from '../../utils/schema/schema-types';
import type { IconName } from '@blueprintjs/icons';

interface TreeNodeProps {
  node: SchemaNode;
  depth: number;
  isSelected: boolean;
  isAncestor: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  ancestorIds: Set<string>;
}

function getTypeIcon(type?: SchemaNodeType, compositionKind?: CompositionKind): IconName {
  if (compositionKind) return 'help';
  switch (type) {
    case 'object':
      return 'folder-open';
    case 'array':
      return 'list';
    case 'string':
      return 'font';
    case 'number':
    case 'integer':
      return 'numerical';
    case 'boolean':
      return 'segmented-control';
    default:
      return 'help';
  }
}

function getTypeLabel(type?: SchemaNodeType, compositionKind?: CompositionKind): string {
  if (compositionKind) {
    const labels: Record<CompositionKind, string> = {
      allOf: 'All Of',
      anyOf: 'Any Of',
      oneOf: 'One Of',
      not: 'Not',
      'if/then/else': 'Conditional',
    };
    return labels[compositionKind];
  }
  switch (type) {
    case 'string':
      return 'Text';
    case 'number':
      return 'Number';
    case 'integer':
      return 'Integer';
    case 'boolean':
      return 'True / False';
    case 'object':
      return 'Object';
    case 'array':
      return 'List';
    default:
      return 'Unknown';
  }
}

const EXPANDABLE_TYPES = new Set<string | undefined>(['object', 'array']);

function isExpandable(node: SchemaNode): boolean {
  return EXPANDABLE_TYPES.has(node.type) || Boolean(node.compositionKind) || node.children.length > 0;
}

export const TreeNodeComponent = React.memo(function TreeNodeComponent({
  node,
  depth,
  isSelected,
  isAncestor,
  onSelect,
  onToggleExpand,
  onDelete,
  ancestorIds,
}: TreeNodeProps): React.JSX.Element {
  const handleSelect = useCallback((): void => {
    onSelect(node.id);
  }, [onSelect, node.id]);

  const handleToggle = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      onToggleExpand(node.id);
    },
    [onToggleExpand, node.id],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      onDelete(node.id);
    },
    [onDelete, node.id],
  );

  const expandable = isExpandable(node);
  const isRoot = depth === 0;

  return (
    <div className="pokey-tree-node-container">
      <div
        className={`pokey-tree-node ${isSelected ? 'pokey-tree-node--selected' : ''} ${isAncestor ? 'pokey-tree-node--ancestor' : ''}`}
        style={{ paddingLeft: depth * 20 + 4 }}
        onClick={handleSelect}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={expandable ? node.expanded : undefined}
        tabIndex={0}
      >
        {expandable ? (
          <span className="pokey-tree-node-chevron" onClick={handleToggle}>
            <Icon icon={node.expanded ? 'chevron-down' : 'chevron-right'} size={14} />
          </span>
        ) : (
          <span className="pokey-tree-node-chevron pokey-tree-node-chevron--spacer" />
        )}

        <Icon icon={getTypeIcon(node.type, node.compositionKind)} size={14} className="pokey-tree-node-icon" />

        <span className="pokey-tree-node-label">
          {node.displayName}
          <span className="pokey-tree-node-type"> ({getTypeLabel(node.type, node.compositionKind)})</span>
        </span>

        {node.required && (
          <span className="pokey-tree-node-required" title="Required">
            ●
          </span>
        )}

        {!isRoot && (
          <Button
            icon="trash"
            variant="minimal"
            size="small"
            className="pokey-tree-node-delete"
            onClick={handleDelete}
            aria-label={`Delete ${node.displayName}`}
          />
        )}
      </div>

      {expandable && node.expanded && node.children.length > 0 && (
        <div className="pokey-tree-node-children" role="group">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              isSelected={child.id === (isSelected ? node.id : '') /* handled by parent */}
              isAncestor={ancestorIds.has(child.id)}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onDelete={onDelete}
              ancestorIds={ancestorIds}
            />
          ))}
        </div>
      )}
    </div>
  );
});
