import type { SchemaEditorState, SchemaTreeAction, SchemaNode } from './schema-types';
import { createRootNode } from './schema-types';

export const INITIAL_STATE: SchemaEditorState = {
  root: createRootNode(),
  selectedNodeId: null,
};

export function schemaReducer(state: SchemaEditorState, action: SchemaTreeAction): SchemaEditorState {
  switch (action.type) {
    case 'SET_TREE':
      return { root: action.payload, selectedNodeId: null };

    case 'SELECT_NODE':
      return { ...state, selectedNodeId: action.payload };

    case 'ADD_NODE':
      return {
        ...state,
        root: addNodeToTree(state.root, action.payload.parentId, action.payload.node),
        selectedNodeId: action.payload.node.id,
      };

    case 'DELETE_NODE': {
      const newRoot = deleteNodeFromTree(state.root, action.payload);
      const newSelected = state.selectedNodeId === action.payload ? null : state.selectedNodeId;
      return { root: newRoot, selectedNodeId: newSelected };
    }

    case 'UPDATE_NODE':
      return {
        ...state,
        root: updateNodeInTree(state.root, action.payload.id, action.payload.updates),
      };

    case 'TOGGLE_EXPAND':
      return {
        ...state,
        root: updateNodeInTree(state.root, action.payload, { expanded: !findNode(state.root, action.payload)?.expanded }),
      };

    case 'MOVE_NODE': {
      const node = findNode(state.root, action.payload.nodeId);
      if (!node) return state;
      const afterDelete = deleteNodeFromTree(state.root, action.payload.nodeId);
      return {
        ...state,
        root: insertNodeInTree(afterDelete, action.payload.targetParentId, node, action.payload.targetIndex),
      };
    }

    default:
      return state;
  }
}

function addNodeToTree(root: SchemaNode, parentId: string, node: SchemaNode): SchemaNode {
  if (root.id === parentId) {
    return { ...root, children: [...root.children, node] };
  }
  return {
    ...root,
    children: root.children.map((child) => addNodeToTree(child, parentId, node)),
  };
}

function deleteNodeFromTree(root: SchemaNode, nodeId: string): SchemaNode {
  return {
    ...root,
    children: root.children.filter((child) => child.id !== nodeId).map((child) => deleteNodeFromTree(child, nodeId)),
  };
}

function updateNodeInTree(root: SchemaNode, nodeId: string, updates: Partial<SchemaNode>): SchemaNode {
  if (root.id === nodeId) {
    return { ...root, ...updates };
  }
  return {
    ...root,
    children: root.children.map((child) => updateNodeInTree(child, nodeId, updates)),
  };
}

function insertNodeInTree(root: SchemaNode, parentId: string, node: SchemaNode, index: number): SchemaNode {
  if (root.id === parentId) {
    const newChildren = [...root.children];
    newChildren.splice(index, 0, node);
    return { ...root, children: newChildren };
  }
  return {
    ...root,
    children: root.children.map((child) => insertNodeInTree(child, parentId, node, index)),
  };
}

export function findNode(root: SchemaNode, nodeId: string): SchemaNode | undefined {
  if (root.id === nodeId) return root;
  for (const child of root.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }
  return undefined;
}

export function getAncestorIds(root: SchemaNode, targetId: string): string[] {
  const path: string[] = [];

  function walk(node: SchemaNode): boolean {
    if (node.id === targetId) return true;
    for (const child of node.children) {
      if (walk(child)) {
        path.push(node.id);
        return true;
      }
    }
    return false;
  }

  walk(root);
  return path;
}

export function hasProperties(root: SchemaNode): boolean {
  return root.children.filter((c) => c.group !== 'definitions').length > 0;
}
