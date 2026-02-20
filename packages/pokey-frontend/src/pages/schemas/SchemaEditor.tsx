import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { Button, InputGroup, Spinner, Alert, Menu, MenuItem, Popover } from '@blueprintjs/core';
import { StatusToggle } from '../../components/shared/StatusToggle';
import { TreeNodeComponent } from '../../components/schema-editor/TreeNode';
import { PropertyPanel } from '../../components/schema-editor/PropertyPanel';
import { EditJsonModal } from '../../components/schema-editor/EditJsonModal';
import { schemaReducer, INITIAL_STATE, findNode, getAncestorIds, hasProperties } from '../../utils/schema/schema-reducer';
import { jsonSchemaToTree, treeToJsonSchema } from '../../utils/schema/schema-mapping';
import { createEmptyNode, createCompositionNode, createRootNode } from '../../utils/schema/schema-types';
import type { SchemaNodeType, CompositionKind, SchemaNode } from '../../utils/schema/schema-types';
import { api } from '../../services/api';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../services/toaster';
import { validateSchema } from '../../utils/schema/schema-validation';
import { statusToAction, statusActionLabel } from '../../utils/status-helpers';
import type { Schema } from 'pokey-common';
import '../../components/schema-editor/schema-editor.scss';

type JsonSchema = Record<string, unknown>;

const DIVIDER_KEY = 'pokey-schema-editor-divider';
const DEFAULT_LEFT_WIDTH = 350;
const MIN_LEFT = 200;
const MIN_RIGHT = 400;

export function SchemaEditor(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [schemaName, setSchemaName] = useState('');
  const [schemaStatus, setSchemaStatus] = useState('active');
  const [state, dispatch] = useReducer(schemaReducer, INITIAL_STATE);
  const [savedState, setSavedState] = useState<string>('');
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [leftWidth, setLeftWidth] = useState((): number => {
    const stored = localStorage.getItem(DIVIDER_KEY);
    return stored ? Number(stored) : DEFAULT_LEFT_WIDTH;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const currentJson = useMemo(() => JSON.stringify(treeToJsonSchema(state.root)), [state.root]);
  const isDirty = currentJson !== savedState || (!isEditMode && schemaName !== '');

  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (!isEditMode) {
      const root = createRootNode();
      dispatch({ type: 'SET_TREE', payload: root });
      setSavedState(JSON.stringify(treeToJsonSchema(root)));
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    void (async (): Promise<void> => {
      try {
        const schema = await api.get(`schemas/${id as string}`, { signal: controller.signal }).json<Schema>();
        setSchemaName(schema.name);
        setSchemaStatus(schema.status);
        const tree = jsonSchemaToTree(schema.schemaData as JsonSchema);
        dispatch({ type: 'SET_TREE', payload: tree });
        setSavedState(JSON.stringify(schema.schemaData));
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        void showErrorToast('Failed to load schema.');
        void navigate('/schemas', { replace: true });
      } finally {
        setLoading(false);
      }
    })();

    return (): void => {
      controller.abort();
    };
  }, [id, isEditMode, navigate]);

  const handleSave = useCallback(async (): Promise<void> => {
    const schemaData = treeToJsonSchema(state.root);

    const validation = validateSchema(schemaData);
    if (!validation.valid) {
      void showErrorToast(`Schema is malformed: ${validation.error ?? 'Unknown error.'}`);
      return;
    }

    setSaving(true);

    try {
      if (isEditMode) {
        await api.put(`schemas/${id as string}`, { json: { schemaData } });
        setSavedState(JSON.stringify(schemaData));
        void showSuccessToast('Schema updated successfully.');
      } else {
        const result = await api.post('schemas', { json: { name: schemaName, schemaData } }).json<Schema>();
        setSavedState(JSON.stringify(schemaData));
        void showSuccessToast('Schema created successfully.');
        void navigate(`/schemas/${result.id}`, { replace: true });
      }
    } catch (error: unknown) {
      await handleSaveError(error);
    } finally {
      setSaving(false);
    }
  }, [state.root, isEditMode, id, schemaName, navigate]);

  const handleStatusToggle = useCallback(
    async (newStatus: string): Promise<void> => {
      const action = statusToAction(newStatus);
      await api.post(`schemas/${id as string}/${action}`);
      setSchemaStatus(newStatus);
      void showSuccessToast(`Schema ${statusActionLabel(action)}.`);
    },
    [id],
  );

  const handleValidate = useCallback((): void => {
    const schemaData = treeToJsonSchema(state.root);
    const result = validateSchema(schemaData);
    if (result.valid) {
      void showSuccessToast('Schema is valid.');
    } else {
      void showErrorToast(`Validation failed: ${result.error ?? 'Unknown error.'}`);
    }
  }, [state.root]);

  const handleJsonAccept = useCallback((schema: JsonSchema): void => {
    const tree = jsonSchemaToTree(schema);
    dispatch({ type: 'SET_TREE', payload: tree });
    setJsonModalOpen(false);
  }, []);

  const handleAddNode = useCallback(
    (type: SchemaNodeType): void => {
      const parentId = state.selectedNodeId ?? state.root.id;
      const parent = findNode(state.root, parentId);
      if (!parent || (parent.type !== 'object' && parent.type !== 'array' && !parent.compositionKind)) {
        const node = createEmptyNode(type, `new${type.charAt(0).toUpperCase()}${type.slice(1)}`);
        dispatch({ type: 'ADD_NODE', payload: { parentId: state.root.id, node } });
        return;
      }
      const node = createEmptyNode(type, `new${type.charAt(0).toUpperCase()}${type.slice(1)}`);
      dispatch({ type: 'ADD_NODE', payload: { parentId, node } });
    },
    [state.selectedNodeId, state.root],
  );

  const handleAddComposition = useCallback(
    (kind: CompositionKind): void => {
      const parentId = state.selectedNodeId ?? state.root.id;
      const node = createCompositionNode(kind, kind);
      dispatch({ type: 'ADD_NODE', payload: { parentId, node } });
    },
    [state.selectedNodeId, state.root.id],
  );

  const handleSelect = useCallback((nodeId: string): void => {
    dispatch({ type: 'SELECT_NODE', payload: nodeId });
  }, []);

  const handleToggleExpand = useCallback((nodeId: string): void => {
    dispatch({ type: 'TOGGLE_EXPAND', payload: nodeId });
  }, []);

  const handleDeleteNode = useCallback((nodeId: string): void => {
    dispatch({ type: 'DELETE_NODE', payload: nodeId });
  }, []);

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<SchemaNode>): void => {
    dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates } });
  }, []);

  const handleMouseDown = useCallback((): void => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent): void {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const newLeft = Math.max(MIN_LEFT, Math.min(e.clientX - rect.left, containerWidth - MIN_RIGHT));
      setLeftWidth(newLeft);
    }

    function handleMouseUp(): void {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        localStorage.setItem(DIVIDER_KEY, String(leftWidth));
      }
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return (): void => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [leftWidth]);

  const ancestorIds = useMemo((): Set<string> => {
    if (!state.selectedNodeId) return new Set();
    return new Set(getAncestorIds(state.root, state.selectedNodeId));
  }, [state.root, state.selectedNodeId]);

  const selectedNode = state.selectedNodeId ? (findNode(state.root, state.selectedNodeId) ?? null) : null;

  const canSave = schemaName.trim().length > 0 && hasProperties(state.root) && !saving;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spinner size={50} />
      </div>
    );
  }

  const addMenu = (
    <Menu>
      <MenuItem
        text="Text (String)"
        icon="font"
        onClick={(): void => {
          handleAddNode('string');
        }}
      />
      <MenuItem
        text="Number"
        icon="numerical"
        onClick={(): void => {
          handleAddNode('number');
        }}
      />
      <MenuItem
        text="True / False (Boolean)"
        icon="segmented-control"
        onClick={(): void => {
          handleAddNode('boolean');
        }}
      />
      <MenuItem
        text="Object"
        icon="folder-open"
        onClick={(): void => {
          handleAddNode('object');
        }}
      />
      <MenuItem
        text="List (Array)"
        icon="list"
        onClick={(): void => {
          handleAddNode('array');
        }}
      />
      <MenuItem
        text="All Of"
        icon="help"
        onClick={(): void => {
          handleAddComposition('allOf');
        }}
      />
      <MenuItem
        text="Any Of"
        icon="help"
        onClick={(): void => {
          handleAddComposition('anyOf');
        }}
      />
      <MenuItem
        text="One Of"
        icon="help"
        onClick={(): void => {
          handleAddComposition('oneOf');
        }}
      />
    </Menu>
  );

  return (
    <div className="pokey-schema-editor">
      <div className="pokey-schema-editor-topbar">
        <div className="pokey-schema-editor-topbar-left">
          <InputGroup
            value={schemaName}
            onChange={(e): void => {
              setSchemaName(e.target.value);
            }}
            placeholder="Schema name..."
            readOnly={isEditMode}
            aria-label="Schema name"
            style={{ maxWidth: 300 }}
          />
          {isEditMode && <StatusToggle status={schemaStatus} onToggle={handleStatusToggle} />}
        </div>
        <div className="pokey-schema-editor-topbar-right">
          <Button text="Validate" icon="tick" onClick={handleValidate} />
          <Button
            text="Edit JSON"
            icon="code"
            onClick={(): void => {
              setJsonModalOpen(true);
            }}
          />
          <Button
            intent="success"
            text={saving ? 'Saving...' : 'Save Schema'}
            icon="floppy-disk"
            disabled={!canSave}
            loading={saving}
            onClick={(): void => {
              void handleSave();
            }}
          />
          <Button variant="minimal" text="Cancel" onClick={(): void => void navigate('/schemas')} />
        </div>
      </div>

      <div className="pokey-schema-editor-body" ref={containerRef}>
        <div className="pokey-schema-editor-left" style={{ width: leftWidth }}>
          <div className="pokey-schema-editor-tree-header">
            <Popover content={addMenu} placement="bottom-start">
              <Button icon="plus" size="small" aria-label="Add property" />
            </Popover>
          </div>
          <div className="pokey-schema-editor-tree" role="tree">
            <TreeNodeComponent
              node={state.root}
              depth={0}
              isSelected={state.root.id === state.selectedNodeId}
              isAncestor={ancestorIds.has(state.root.id)}
              onSelect={handleSelect}
              onToggleExpand={handleToggleExpand}
              onDelete={handleDeleteNode}
              ancestorIds={ancestorIds}
            />
          </div>
        </div>

        <div className="pokey-schema-editor-divider" onMouseDown={handleMouseDown} />

        <div className="pokey-schema-editor-right">
          <PropertyPanel node={selectedNode} onUpdate={handleUpdateNode} />
        </div>
      </div>

      <EditJsonModal
        isOpen={jsonModalOpen}
        schema={treeToJsonSchema(state.root)}
        onAccept={handleJsonAccept}
        onCancel={(): void => {
          setJsonModalOpen(false);
        }}
      />

      <Alert
        isOpen={blocker.state === 'blocked'}
        confirmButtonText="Leave"
        cancelButtonText="Stay"
        intent="warning"
        icon="warning-sign"
        onConfirm={(): void => blocker.proceed?.()}
        onCancel={(): void => blocker.reset?.()}
      >
        <p>You have unsaved changes. Leave without saving?</p>
      </Alert>
    </div>
  );
}

async function handleSaveError(error: unknown): Promise<void> {
  if (error && typeof error === 'object' && 'response' in error) {
    const httpError = error as { response: Response };
    const status = httpError.response.status;

    try {
      const body = (await httpError.response.json()) as { error?: string; details?: string };
      const details = body.details ?? body.error ?? '';

      if (status === 409) {
        void showWarningToast('A schema with this name already exists.');
      } else if (status === 400) {
        void showWarningToast(`Schema update is not backward-compatible: ${details}`);
      } else if (status === 422) {
        void showErrorToast(`Schema is malformed: ${details}`);
      } else if (status >= 500) {
        void showErrorToast('Server error — please try again.');
      } else {
        void showErrorToast(details || 'An unexpected error occurred.');
      }
    } catch {
      void showErrorToast('Server error — please try again.');
    }
  } else if (error instanceof TypeError) {
    void showErrorToast('Unable to reach the server. Check your connection.');
  } else {
    void showErrorToast('An unexpected error occurred.');
  }
}
