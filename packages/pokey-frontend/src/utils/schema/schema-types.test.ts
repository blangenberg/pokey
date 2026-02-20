import { describe, it, expect, vi } from 'vitest';
import { createEmptyNode, createCompositionNode, createRootNode } from './schema-types';
import type { UuidUtil } from 'pokey-common';

function createMockUuid(ids: string[]): UuidUtil {
  let index = 0;
  return {
    generate: vi.fn(() => {
      const id = ids[index % ids.length]!;
      index++;
      return id;
    }),
  } as unknown as UuidUtil;
}

describe('createEmptyNode', () => {
  it('produces correct structure with injected UUID', () => {
    const mockUuid = createMockUuid(['test-id-001']);
    const node = createEmptyNode('string', 'userName', mockUuid);

    expect(node.id).toBe('test-id-001');
    expect(node.name).toBe('userName');
    expect(node.displayName).toBe('userName');
    expect(node.type).toBe('string');
    expect(node.required).toBe(false);
    expect(node.keywords).toEqual({});
    expect(node.extraKeywords).toEqual({});
    expect(node.children).toEqual([]);
    expect(node.expanded).toBe(true);
  });

  it('creates object nodes with empty children array', () => {
    const mockUuid = createMockUuid(['obj-id']);
    const node = createEmptyNode('object', 'address', mockUuid);

    expect(node.type).toBe('object');
    expect(node.children).toEqual([]);
  });

  it('produces a valid UUID when using default UuidUtil', () => {
    const node = createEmptyNode('boolean', 'isActive');
    expect(node.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});

describe('createCompositionNode', () => {
  it('maps allOf to "All Of"', () => {
    const mockUuid = createMockUuid(['comp-id']);
    const node = createCompositionNode('allOf', 'allOf', mockUuid);

    expect(node.id).toBe('comp-id');
    expect(node.displayName).toBe('All Of');
    expect(node.compositionKind).toBe('allOf');
    expect(node.type).toBeUndefined();
  });

  it('maps anyOf to "Any Of"', () => {
    const mockUuid = createMockUuid(['id']);
    const node = createCompositionNode('anyOf', 'anyOf', mockUuid);
    expect(node.displayName).toBe('Any Of');
  });

  it('maps oneOf to "One Of"', () => {
    const mockUuid = createMockUuid(['id']);
    const node = createCompositionNode('oneOf', 'oneOf', mockUuid);
    expect(node.displayName).toBe('One Of');
  });

  it('maps not to "Not"', () => {
    const mockUuid = createMockUuid(['id']);
    const node = createCompositionNode('not', 'not', mockUuid);
    expect(node.displayName).toBe('Not');
  });

  it('maps if/then/else to "If / Then / Else"', () => {
    const mockUuid = createMockUuid(['id']);
    const node = createCompositionNode('if/then/else', 'conditional', mockUuid);
    expect(node.displayName).toBe('If / Then / Else');
  });
});

describe('createRootNode', () => {
  it('produces a root node with object type and empty children', () => {
    const mockUuid = createMockUuid(['root-id']);
    const node = createRootNode(mockUuid);

    expect(node.id).toBe('root-id');
    expect(node.name).toBe('root');
    expect(node.displayName).toBe('Root');
    expect(node.type).toBe('object');
    expect(node.children).toEqual([]);
    expect(node.expanded).toBe(true);
  });

  it('produces a valid UUID when using default UuidUtil', () => {
    const node = createRootNode();
    expect(node.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
