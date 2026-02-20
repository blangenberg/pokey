import { describe, it, expect } from 'vitest';
import { schemaReducer, findNode, getAncestorIds, hasProperties } from './schema-reducer';
import { createEmptyNode, createRootNode } from './schema-types';
import type { SchemaEditorState } from './schema-types';

function buildTestState(): SchemaEditorState {
  const root = createRootNode();
  const child1 = createEmptyNode('string', 'firstName');
  const child2 = createEmptyNode('number', 'age');
  const nested = createEmptyNode('object', 'address');
  const street = createEmptyNode('string', 'street');
  nested.children = [street];
  root.children = [child1, child2, nested];

  return { root, selectedNodeId: null };
}

describe('schemaReducer', () => {
  describe('SET_TREE', () => {
    it('replaces the entire tree and clears selection', () => {
      const state = buildTestState();
      state.selectedNodeId = state.root.children[0]!.id;

      const newRoot = createRootNode();
      const result = schemaReducer(state, { type: 'SET_TREE', payload: newRoot });

      expect(result.root.id).toBe(newRoot.id);
      expect(result.selectedNodeId).toBeNull();
    });
  });

  describe('SELECT_NODE', () => {
    it('sets the selected node id', () => {
      const state = buildTestState();
      const targetId = state.root.children[0]!.id;

      const result = schemaReducer(state, { type: 'SELECT_NODE', payload: targetId });
      expect(result.selectedNodeId).toBe(targetId);
    });
  });

  describe('ADD_NODE', () => {
    it('appends a child to the target parent and auto-selects it', () => {
      const state = buildTestState();
      const newNode = createEmptyNode('boolean', 'isActive');

      const result = schemaReducer(state, {
        type: 'ADD_NODE',
        payload: { parentId: state.root.id, node: newNode },
      });

      expect(result.root.children).toHaveLength(4);
      expect(result.root.children[3]!.name).toBe('isActive');
      expect(result.selectedNodeId).toBe(newNode.id);
    });

    it('adds a child to a nested parent', () => {
      const state = buildTestState();
      const addressNode = state.root.children[2]!;
      const newNode = createEmptyNode('string', 'city');

      const result = schemaReducer(state, {
        type: 'ADD_NODE',
        payload: { parentId: addressNode.id, node: newNode },
      });

      const updatedAddress = findNode(result.root, addressNode.id)!;
      expect(updatedAddress.children).toHaveLength(2);
      expect(updatedAddress.children[1]!.name).toBe('city');
    });
  });

  describe('DELETE_NODE', () => {
    it('removes the target node from its parent', () => {
      const state = buildTestState();
      const toDelete = state.root.children[0]!.id;

      const result = schemaReducer(state, { type: 'DELETE_NODE', payload: toDelete });
      expect(result.root.children).toHaveLength(2);
      expect(findNode(result.root, toDelete)).toBeUndefined();
    });

    it('clears selection when the deleted node was selected', () => {
      const state = buildTestState();
      const toDelete = state.root.children[0]!.id;
      state.selectedNodeId = toDelete;

      const result = schemaReducer(state, { type: 'DELETE_NODE', payload: toDelete });
      expect(result.selectedNodeId).toBeNull();
    });

    it('preserves selection when a different node is deleted', () => {
      const state = buildTestState();
      state.selectedNodeId = state.root.children[1]!.id;

      const result = schemaReducer(state, {
        type: 'DELETE_NODE',
        payload: state.root.children[0]!.id,
      });
      expect(result.selectedNodeId).toBe(state.root.children[1]!.id);
    });

    it('removes deeply nested nodes', () => {
      const state = buildTestState();
      const streetId = state.root.children[2]!.children[0]!.id;

      const result = schemaReducer(state, { type: 'DELETE_NODE', payload: streetId });
      const address = findNode(result.root, state.root.children[2]!.id)!;
      expect(address.children).toHaveLength(0);
    });
  });

  describe('UPDATE_NODE', () => {
    it('updates properties on the target node', () => {
      const state = buildTestState();
      const targetId = state.root.children[0]!.id;

      const result = schemaReducer(state, {
        type: 'UPDATE_NODE',
        payload: { id: targetId, updates: { displayName: 'Given Name', required: true } },
      });

      const updated = findNode(result.root, targetId)!;
      expect(updated.displayName).toBe('Given Name');
      expect(updated.required).toBe(true);
    });

    it('does not affect other nodes', () => {
      const state = buildTestState();

      const result = schemaReducer(state, {
        type: 'UPDATE_NODE',
        payload: { id: state.root.children[0]!.id, updates: { required: true } },
      });

      expect(findNode(result.root, state.root.children[1]!.id)!.required).toBe(false);
    });
  });

  describe('TOGGLE_EXPAND', () => {
    it('toggles expanded from true to false', () => {
      const state = buildTestState();
      const addressId = state.root.children[2]!.id;

      const result = schemaReducer(state, { type: 'TOGGLE_EXPAND', payload: addressId });
      expect(findNode(result.root, addressId)!.expanded).toBe(false);
    });

    it('toggles expanded from false to true', () => {
      const state = buildTestState();
      const addressId = state.root.children[2]!.id;
      state.root.children[2]!.expanded = false;

      const result = schemaReducer(state, { type: 'TOGGLE_EXPAND', payload: addressId });
      expect(findNode(result.root, addressId)!.expanded).toBe(true);
    });
  });

  describe('MOVE_NODE', () => {
    it('moves a node to a new parent at a specific index', () => {
      const state = buildTestState();
      const ageId = state.root.children[1]!.id;
      const addressId = state.root.children[2]!.id;

      const result = schemaReducer(state, {
        type: 'MOVE_NODE',
        payload: { nodeId: ageId, targetParentId: addressId, targetIndex: 0 },
      });

      expect(result.root.children).toHaveLength(2);
      const address = findNode(result.root, addressId)!;
      expect(address.children[0]!.id).toBe(ageId);
    });

    it('returns unchanged state when node is not found', () => {
      const state = buildTestState();
      const result = schemaReducer(state, {
        type: 'MOVE_NODE',
        payload: { nodeId: 'nonexistent', targetParentId: state.root.id, targetIndex: 0 },
      });
      expect(result).toBe(state);
    });
  });

  describe('unknown action', () => {
    it('returns unchanged state', () => {
      const state = buildTestState();
      const result = schemaReducer(state, { type: 'UNKNOWN' } as never);
      expect(result).toBe(state);
    });
  });
});

describe('findNode', () => {
  it('finds the root', () => {
    const state = buildTestState();
    expect(findNode(state.root, state.root.id)).toBe(state.root);
  });

  it('finds a deeply nested node', () => {
    const state = buildTestState();
    const streetId = state.root.children[2]!.children[0]!.id;
    const found = findNode(state.root, streetId);
    expect(found?.name).toBe('street');
  });

  it('returns undefined for a missing id', () => {
    const state = buildTestState();
    expect(findNode(state.root, 'nonexistent')).toBeUndefined();
  });
});

describe('getAncestorIds', () => {
  it('returns an empty array for the root itself', () => {
    const state = buildTestState();
    expect(getAncestorIds(state.root, state.root.id)).toEqual([]);
  });

  it('returns the root for a direct child', () => {
    const state = buildTestState();
    const childId = state.root.children[0]!.id;
    const ancestors = getAncestorIds(state.root, childId);
    expect(ancestors).toEqual([state.root.id]);
  });

  it('returns the full path for a deeply nested node', () => {
    const state = buildTestState();
    const streetId = state.root.children[2]!.children[0]!.id;
    const addressId = state.root.children[2]!.id;

    const ancestors = getAncestorIds(state.root, streetId);
    expect(ancestors).toContain(state.root.id);
    expect(ancestors).toContain(addressId);
    expect(ancestors).toHaveLength(2);
  });

  it('returns empty for a nonexistent id', () => {
    const state = buildTestState();
    expect(getAncestorIds(state.root, 'ghost')).toEqual([]);
  });
});

describe('hasProperties', () => {
  it('returns true when root has non-definition children', () => {
    const state = buildTestState();
    expect(hasProperties(state.root)).toBe(true);
  });

  it('returns false for an empty root', () => {
    expect(hasProperties(createRootNode())).toBe(false);
  });

  it('returns false when all children are definitions', () => {
    const root = createRootNode();
    const def = createEmptyNode('object', 'Address');
    def.group = 'definitions';
    root.children = [def];
    expect(hasProperties(root)).toBe(false);
  });
});
