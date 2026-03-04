import React, { useCallback } from 'react';
import { Button, Tooltip } from 'antd';
import {
  UnorderedListOutlined,
  FontSizeOutlined,
  NumberOutlined,
  CheckSquareOutlined,
  QuestionCircleOutlined,
  DownOutlined,
  RightOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { SchemaNode, SchemaNodeType, CompositionKind } from '../../utils/schema/schema-types';

interface TreeNodeProps {
  node: SchemaNode;
  depth: number;
  selectedNodeId: string | null;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  ancestorIds: Set<string>;
}

function getTypeIcon(type?: SchemaNodeType, compositionKind?: CompositionKind): React.ReactNode {
  if (compositionKind) return <QuestionCircleOutlined />;
  switch (type) {
    case 'object':
      return <span style={{ fontWeight: 'bold', fontSize: 14, fontFamily: 'monospace' }}>{'{}'}</span>;
    case 'array':
      return <UnorderedListOutlined />;
    case 'string':
      return <FontSizeOutlined />;
    case 'number':
    case 'integer':
      return <NumberOutlined />;
    case 'boolean':
      return <CheckSquareOutlined />;
    default:
      return <QuestionCircleOutlined />;
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
  selectedNodeId,
  onSelect,
  onToggleExpand,
  onDelete,
  ancestorIds,
}: TreeNodeProps): React.JSX.Element {
  const isSelected = node.id === selectedNodeId;
  const isAncestor = ancestorIds.has(node.id);
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
            <span style={{ fontSize: 14 }}>{node.expanded ? <DownOutlined /> : <RightOutlined />}</span>
          </span>
        ) : (
          <span className="pokey-tree-node-chevron pokey-tree-node-chevron--spacer" />
        )}

        <span className="pokey-tree-node-icon" style={{ fontSize: 14 }}>
          {getTypeIcon(node.type, node.compositionKind)}
        </span>

        <span className="pokey-tree-node-label">
          {node.name === '(items)' ? 'List Type' : node.displayName}
          <span className="pokey-tree-node-type"> ({getTypeLabel(node.type, node.compositionKind)})</span>
        </span>

        {node.required && (
          <Tooltip title="Required" mouseEnterDelay={0.15}>
            <span className="pokey-tree-node-required">●</span>
          </Tooltip>
        )}

        {!isRoot && (
          <Button
            icon={<DeleteOutlined />}
            type="text"
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
              selectedNodeId={selectedNodeId}
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
