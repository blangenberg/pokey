import { UuidUtil } from 'pokey-common';

export type SchemaNodeType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
export type CompositionKind = 'allOf' | 'anyOf' | 'oneOf' | 'not' | 'if/then/else';

export interface SchemaNode {
  id: string;
  name: string;
  displayName: string;
  type?: SchemaNodeType;
  compositionKind?: CompositionKind;
  required: boolean;
  description?: string;
  title?: string;
  group?: string;
  ref?: string;
  keywords: Record<string, unknown>;
  extraKeywords: Record<string, unknown>;
  children: SchemaNode[];
  expanded?: boolean;
}

export type SchemaTreeAction =
  | { type: 'SET_TREE'; payload: SchemaNode }
  | { type: 'SELECT_NODE'; payload: string }
  | { type: 'ADD_NODE'; payload: { parentId: string; node: SchemaNode } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<SchemaNode> } }
  | { type: 'TOGGLE_EXPAND'; payload: string }
  | { type: 'MOVE_NODE'; payload: { nodeId: string; targetParentId: string; targetIndex: number } };

export interface SchemaEditorState {
  root: SchemaNode;
  selectedNodeId: string | null;
}

const defaultUuid = new UuidUtil();

export function createEmptyNode(type: SchemaNodeType, name: string, uuid: UuidUtil = defaultUuid): SchemaNode {
  return {
    id: uuid.generate(),
    name,
    displayName: name,
    type,
    required: false,
    keywords: {},
    extraKeywords: {},
    children: [],
    expanded: true,
  };
}

export function createCompositionNode(kind: CompositionKind, name: string, uuid: UuidUtil = defaultUuid): SchemaNode {
  const labelMap: Record<CompositionKind, string> = {
    allOf: 'All Of',
    anyOf: 'Any Of',
    oneOf: 'One Of',
    not: 'Not',
    'if/then/else': 'If / Then / Else',
  };

  return {
    id: uuid.generate(),
    name,
    displayName: labelMap[kind],
    compositionKind: kind,
    required: false,
    keywords: {},
    extraKeywords: {},
    children: [],
    expanded: true,
  };
}

export function createRootNode(uuid: UuidUtil = defaultUuid): SchemaNode {
  return {
    id: uuid.generate(),
    name: 'root',
    displayName: 'Root',
    type: 'object',
    required: false,
    keywords: {},
    extraKeywords: {},
    children: [],
    expanded: true,
  };
}
