import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams, useBlocker, useLocation } from 'react-router-dom';
import { Button, Input, Spin, Modal, Dropdown } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  CodeOutlined,
  CopyOutlined,
  FileAddOutlined,
  SaveOutlined,
  PlusOutlined,
  FontSizeOutlined,
  NumberOutlined,
  CheckSquareOutlined,
  UnorderedListOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { StatusToggle } from '../../components/shared/StatusToggle';
import { TreeNodeComponent } from '../../components/schema-editor/TreeNode';
import { PropertyPanel } from '../../components/schema-editor/PropertyPanel';
import { EditJsonModal } from '../../components/schema-editor/EditJsonModal';
import {
  schemaReducer,
  INITIAL_STATE,
  findNode,
  findParent,
  getAncestorIds,
  getNodePath,
  hasProperties,
  hasDuplicateSiblingNames,
  getUniqueSiblingName,
} from '../../utils/schema/schema-reducer';
import { jsonSchemaToTree, treeToJsonSchema, displayNameToId } from '../../utils/schema/schema-mapping';
import { createEmptyNode, createCompositionNode, createRootNode, getTypeDisplayName } from '../../utils/schema/schema-types';
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
  const location = useLocation();
  const isEditMode = Boolean(id);

  const [schemaName, setSchemaName] = useState('');
  const [schemaStatus, setSchemaStatus] = useState('active');
  const [state, dispatch] = useReducer(schemaReducer, INITIAL_STATE);
  const [savedState, setSavedState] = useState<string>(() => (isEditMode ? '' : JSON.stringify(treeToJsonSchema(INITIAL_STATE.root))));
  const [savedSchemaName, setSavedSchemaName] = useState('');
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
  const skipBlockRef = useRef(false);

  const currentJson = useMemo(() => JSON.stringify(treeToJsonSchema(state.root)), [state.root]);
  const isDirty = currentJson !== savedState || schemaName !== savedSchemaName;

  const blocker = useBlocker((): boolean => {
    if (skipBlockRef.current) {
      skipBlockRef.current = false;
      return false;
    }
    return !loading && isDirty;
  });

  useEffect(() => {
    if (!isEditMode) {
      const cloneData = (location.state as { cloneSchema?: JsonSchema; cloneName?: string } | null) ?? {};
      if (cloneData.cloneSchema) {
        const tree = jsonSchemaToTree(cloneData.cloneSchema);
        dispatch({ type: 'SET_TREE', payload: tree });
        setSavedState(JSON.stringify(treeToJsonSchema(tree)));
        setSchemaName(cloneData.cloneName ? `${cloneData.cloneName} (copy)` : '');
      } else {
        const root = createRootNode();
        dispatch({ type: 'SET_TREE', payload: root });
        setSavedState(JSON.stringify(treeToJsonSchema(root)));
      }
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
        setSavedState(JSON.stringify(treeToJsonSchema(tree)));
        setSavedSchemaName(schema.name);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        showErrorToast('Failed to load schema.');
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
    if (hasDuplicateSiblingNames(state.root)) {
      showErrorToast('Duplicate property names found at the same level. Rename them before saving.');
      return;
    }

    const schemaData = treeToJsonSchema(state.root);

    const validation = validateSchema(schemaData);
    if (!validation.valid) {
      showErrorToast(`Schema is malformed: ${validation.error ?? 'Unknown error.'}`);
      return;
    }

    setSaving(true);

    try {
      if (isEditMode) {
        await api.put(`schemas/${id as string}`, { json: { name: schemaName, schemaData } });
        setSavedState(JSON.stringify(schemaData));
        setSavedSchemaName(schemaName);
        showSuccessToast('Schema updated successfully.');
      } else {
        const result = await api.post('schemas', { json: { name: schemaName, schemaData } }).json<Schema>();
        setSavedState(JSON.stringify(schemaData));
        setSavedSchemaName(schemaName);
        showSuccessToast('Schema created successfully.');
        skipBlockRef.current = true;
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
      showSuccessToast(`Schema ${statusActionLabel(action)}.`);
    },
    [id],
  );

  const handleValidate = useCallback((): void => {
    const schemaData = treeToJsonSchema(state.root);
    const result = validateSchema(schemaData);
    if (result.valid) {
      showSuccessToast('Schema is valid.');
    } else {
      showErrorToast(`Validation failed: ${result.error ?? 'Unknown error.'}`);
    }
  }, [state.root]);

  const handleJsonAccept = useCallback((schema: JsonSchema): void => {
    const tree = jsonSchemaToTree(schema);
    dispatch({ type: 'SET_TREE', payload: tree });
    setJsonModalOpen(false);
  }, []);

  const handleAddNode = useCallback(
    (type: SchemaNodeType): void => {
      let parentId = state.selectedNodeId ?? state.root.id;
      const parent = findNode(state.root, parentId);
      if (!parent || (parent.type !== 'object' && parent.type !== 'array' && !parent.compositionKind)) {
        parentId = state.root.id;
      }
      const actualParent = findNode(state.root, parentId) ?? state.root;

      if (actualParent.type === 'array') {
        const hasItems = actualParent.children.some((c) => c.name === '(items)');
        if (hasItems) {
          showWarningToast('This list already has an item schema defined. Remove it first to change the item type.');
          return;
        }
        const node = createEmptyNode(type, '(items)', 'List Type');
        node.required = false;
        dispatch({ type: 'ADD_NODE', payload: { parentId, node } });
        return;
      }

      const baseDisplayName = `New ${getTypeDisplayName(type)}`;
      const baseId = displayNameToId(baseDisplayName);
      const uniqueId = getUniqueSiblingName(baseId, actualParent.children);
      const node = createEmptyNode(type, uniqueId, baseDisplayName);
      dispatch({ type: 'ADD_NODE', payload: { parentId, node } });
    },
    [state.selectedNodeId, state.root],
  );

  const handleAddComposition = useCallback(
    (kind: CompositionKind): void => {
      const parentId = state.selectedNodeId ?? state.root.id;
      const actualParent = findNode(state.root, parentId) ?? state.root;
      const uniqueName = getUniqueSiblingName(kind, actualParent.children);
      const node = createCompositionNode(kind, uniqueName);
      dispatch({ type: 'ADD_NODE', payload: { parentId, node } });
    },
    [state.selectedNodeId, state.root],
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

  const nodePath = useMemo((): SchemaNode[] => {
    if (!state.selectedNodeId) return [];
    return getNodePath(state.root, state.selectedNodeId);
  }, [state.root, state.selectedNodeId]);

  const siblingNames = useMemo((): Set<string> => {
    if (!state.selectedNodeId) return new Set();
    const parent = findParent(state.root, state.selectedNodeId);
    if (!parent) return new Set();
    return new Set(parent.children.filter((c) => c.id !== state.selectedNodeId).map((c) => c.name));
  }, [state.root, state.selectedNodeId]);

  const canSave = schemaName.trim().length > 0 && hasProperties(state.root) && !saving;

  const addMenuItems: MenuProps['items'] = [
    {
      key: 'string',
      label: 'Text (String)',
      icon: <FontSizeOutlined />,
      onClick: (): void => {
        handleAddNode('string');
      },
    },
    {
      key: 'number',
      label: 'Number',
      icon: <NumberOutlined />,
      onClick: (): void => {
        handleAddNode('number');
      },
    },
    {
      key: 'boolean',
      label: 'True / False (Boolean)',
      icon: <CheckSquareOutlined />,
      onClick: (): void => {
        handleAddNode('boolean');
      },
    },
    {
      key: 'object',
      label: 'Object',
      icon: <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{'{}'}</span>,
      onClick: (): void => {
        handleAddNode('object');
      },
    },
    {
      key: 'array',
      label: 'List (Array)',
      icon: <UnorderedListOutlined />,
      onClick: (): void => {
        handleAddNode('array');
      },
    },
    {
      key: 'allOf',
      label: 'All Of',
      icon: <QuestionCircleOutlined />,
      onClick: (): void => {
        handleAddComposition('allOf');
      },
    },
    {
      key: 'anyOf',
      label: 'Any Of',
      icon: <QuestionCircleOutlined />,
      onClick: (): void => {
        handleAddComposition('anyOf');
      },
    },
    {
      key: 'oneOf',
      label: 'One Of',
      icon: <QuestionCircleOutlined />,
      onClick: (): void => {
        handleAddComposition('oneOf');
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="pokey-schema-editor">
      <div className="pokey-schema-editor-uuid">{id ?? '\u00A0'}</div>
      <div className="pokey-schema-editor-topbar">
        <div className="pokey-schema-editor-topbar-left">
          <Input
            value={schemaName}
            onChange={(e): void => {
              setSchemaName(e.target.value);
            }}
            placeholder="Enter schema name"
            readOnly={false}
            aria-label="Schema name"
            style={{ maxWidth: 300 }}
          />
          {isEditMode && <StatusToggle status={schemaStatus} onToggle={handleStatusToggle} />}
          <Dropdown menu={{ items: addMenuItems }} placement="bottomLeft">
            <Button icon={<PlusOutlined />}>Add Element</Button>
          </Dropdown>
          {isEditMode && (
            <>
              <Button
                icon={<CopyOutlined />}
                onClick={(): void => {
                  skipBlockRef.current = true;
                  void navigate('/schemas/new', { state: { cloneSchema: treeToJsonSchema(state.root), cloneName: schemaName } });
                }}
              >
                Clone
              </Button>
              <Button
                icon={<FileAddOutlined />}
                onClick={(): void => {
                  skipBlockRef.current = true;
                  void navigate('/configs/new', { state: { schemaId: id, schemaName } });
                }}
              >
                Create Config
              </Button>
            </>
          )}
        </div>
        <div className="pokey-schema-editor-topbar-right">
          <Button icon={<CheckOutlined />} onClick={handleValidate}>
            Validate
          </Button>
          <Button
            icon={<CodeOutlined />}
            onClick={(): void => {
              setJsonModalOpen(true);
            }}
          >
            Edit JSON
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={!canSave}
            loading={saving}
            onClick={(): void => {
              void handleSave();
            }}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            {saving ? 'Saving...' : 'Save Schema'}
          </Button>
          <Button icon={<CloseOutlined />} onClick={(): void => void navigate('/schemas')}>
            Close
          </Button>
        </div>
      </div>
      <div className="pokey-schema-editor-body" ref={containerRef}>
        <div className="pokey-schema-editor-left" style={{ width: leftWidth }}>
          <div className="pokey-schema-editor-tree" role="tree">
            <TreeNodeComponent
              node={state.root}
              depth={0}
              selectedNodeId={state.selectedNodeId}
              onSelect={handleSelect}
              onToggleExpand={handleToggleExpand}
              onDelete={handleDeleteNode}
              ancestorIds={ancestorIds}
            />
          </div>
        </div>

        <div className="pokey-schema-editor-divider" onMouseDown={handleMouseDown} />

        <div className="pokey-schema-editor-right">
          <PropertyPanel
            node={selectedNode}
            onUpdate={handleUpdateNode}
            onSelect={handleSelect}
            siblingNames={siblingNames}
            nodePath={nodePath}
          />
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

      <Modal
        open={blocker.state === 'blocked'}
        title="Unsaved Changes"
        okText="Leave"
        cancelText="Stay"
        onOk={(): void => blocker.proceed?.()}
        onCancel={(): void => blocker.reset?.()}
      >
        <p>You have unsaved changes. Leave without saving?</p>
      </Modal>
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
        showWarningToast('A schema with this name already exists.');
      } else if (status === 400) {
        showWarningToast('Schema update is not backward-compatible.');
      } else if (status === 422) {
        showErrorToast(`Schema is malformed: ${details}`);
      } else if (status >= 500) {
        showErrorToast('Server error — please try again.');
      } else {
        showErrorToast(details || 'An unexpected error occurred.');
      }
    } catch {
      showErrorToast('Server error — please try again.');
    }
  } else if (error instanceof TypeError) {
    showErrorToast('Unable to reach the server. Check your connection.');
  } else {
    showErrorToast('An unexpected error occurred.');
  }
}
