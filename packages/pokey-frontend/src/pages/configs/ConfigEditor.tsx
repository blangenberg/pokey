import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { Button, Input, Spin, Modal, Result } from 'antd';
import { SaveOutlined, DatabaseOutlined } from '@ant-design/icons';
import { StatusToggle } from '../../components/shared/StatusToggle';
import { SchemaSelector } from '../../components/shared/SchemaSelector';
import { DynamicFormRenderer } from '../../components/config-editor/DynamicFormRenderer';
import { api } from '../../services/api';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../services/toaster';
import { buildDefaults, validateConfigData } from '../../utils/config/config-helpers';
import { statusToAction, statusActionLabel } from '../../utils/status-helpers';
import type { Config, Schema } from 'pokey-common';
import '../../components/config-editor/config-editor.scss';

type JsonSchema = Record<string, unknown>;

interface SchemaOption {
  id: string;
  name: string;
  status: string;
}

export function ConfigEditor(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [configName, setConfigName] = useState('');
  const [configStatus, setConfigStatus] = useState('active');
  const [selectedSchema, setSelectedSchema] = useState<SchemaOption | null>(null);
  const [schemaData, setSchemaData] = useState<JsonSchema | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [savedState, setSavedState] = useState<string>(() =>
    isEditMode ? '' : JSON.stringify({ name: '', schemaId: undefined, data: {} }),
  );
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const skipBlockRef = useRef(false);

  const currentState = useMemo(
    () => JSON.stringify({ name: configName, schemaId: selectedSchema?.id, data: formData }),
    [configName, selectedSchema, formData],
  );
  const isDirty = currentState !== savedState;

  const blocker = useBlocker((): boolean => {
    if (skipBlockRef.current) {
      skipBlockRef.current = false;
      return false;
    }
    return !loading && isDirty;
  });

  useEffect(() => {
    if (!isEditMode) {
      setSavedState(JSON.stringify({ name: '', schemaId: undefined, data: {} }));
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    void (async (): Promise<void> => {
      try {
        const config = await api.get(`configs/${id as string}`, { signal: controller.signal }).json<Config>();
        setConfigName(config.name);
        setConfigStatus(config.status);
        setFormData(config.configData);

        try {
          const schema = await api.get(`schemas/${config.schemaId}`, { signal: controller.signal }).json<Schema>();
          setSelectedSchema({ id: schema.id, name: schema.name, status: schema.status });
          setSchemaData(schema.schemaData as JsonSchema);
        } catch {
          setSelectedSchema({ id: config.schemaId, name: config.schemaId, status: 'unknown' });
        }

        setSavedState(JSON.stringify({ name: config.name, schemaId: config.schemaId, data: config.configData }));
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        showErrorToast('Failed to load config.');
        void navigate('/configs', { replace: true });
      } finally {
        setLoading(false);
      }
    })();

    return (): void => {
      controller.abort();
    };
  }, [id, isEditMode, navigate]);

  const handleSchemaSelect = useCallback(async (schema: SchemaOption | null): Promise<void> => {
    setSelectedSchema(schema);
    if (!schema) {
      setSchemaData(null);
      setFormData({});
      return;
    }

    try {
      const fullSchema = await api.get(`schemas/${schema.id}`).json<Schema>();
      setSchemaData(fullSchema.schemaData as JsonSchema);
      setFormData(buildDefaults(fullSchema.schemaData as JsonSchema));
      setValidationErrors(new Map());
    } catch {
      showErrorToast('Failed to load schema details.');
    }
  }, []);

  const runValidation = useCallback((): boolean => {
    if (!schemaData) return false;

    const errors = validateConfigData(schemaData, formData);
    if (errors.size > 0) {
      setValidationErrors(errors);
      return false;
    }

    setValidationErrors(new Map());
    return true;
  }, [schemaData, formData]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!runValidation()) {
      showWarningToast(`Fix ${String(validationErrors.size)} validation error(s) before saving.`);
      return;
    }

    if (!selectedSchema) return;

    setSaving(true);

    try {
      if (isEditMode) {
        await api.put(`configs/${id as string}`, {
          json: { schemaId: selectedSchema.id, configData: formData },
        });
        setSavedState(JSON.stringify({ name: configName, schemaId: selectedSchema.id, data: formData }));
        showSuccessToast('Config updated successfully.');
      } else {
        const result = await api
          .post('configs', {
            json: { name: configName, schemaId: selectedSchema.id, configData: formData },
          })
          .json<Config>();
        setSavedState(JSON.stringify({ name: configName, schemaId: selectedSchema.id, data: formData }));
        showSuccessToast('Config created successfully.');
        skipBlockRef.current = true;
        void navigate(`/configs/${result.id}`, { replace: true });
      }
    } catch (error: unknown) {
      await handleSaveError(error);
    } finally {
      setSaving(false);
    }
  }, [runValidation, validationErrors, selectedSchema, isEditMode, id, configName, formData, navigate]);

  const handleStatusToggle = useCallback(
    async (newStatus: string): Promise<void> => {
      const action = statusToAction(newStatus);
      await api.post(`configs/${id as string}/${action}`);
      setConfigStatus(newStatus);
      showSuccessToast(`Config ${statusActionLabel(action)}.`);
    },
    [id],
  );

  const handleFormChange = useCallback((newData: Record<string, unknown>): void => {
    setFormData(newData);
  }, []);

  const canSave = configName.trim().length > 0 && selectedSchema !== null && !saving;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="pokey-config-editor">
      <div className="pokey-config-editor-topbar">
        <div className="pokey-config-editor-topbar-left">
          <Input
            value={configName}
            onChange={(e): void => {
              setConfigName(e.target.value);
            }}
            placeholder="Config name..."
            readOnly={isEditMode}
            aria-label="Config name"
            style={{ maxWidth: 300 }}
          />
          {isEditMode ? (
            <Input
              value={selectedSchema?.name ?? ''}
              readOnly
              prefix={<DatabaseOutlined />}
              aria-label="Schema"
              style={{ maxWidth: 250 }}
            />
          ) : (
            <SchemaSelector
              value={selectedSchema}
              onSelect={(schema): void => {
                void handleSchemaSelect(schema);
              }}
              statusFilter="active"
              placeholder="Select schema..."
            />
          )}
          {isEditMode && <StatusToggle status={configStatus} onToggle={handleStatusToggle} />}
        </div>
        <div className="pokey-config-editor-topbar-right">
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
            {saving ? 'Saving...' : 'Save Config'}
          </Button>
          <Button
            type="text"
            onClick={(): void => {
              void navigate('/configs');
            }}
          >
            Cancel
          </Button>
        </div>
      </div>

      <div className="pokey-config-editor-body">
        {!schemaData ? (
          <Result icon={<DatabaseOutlined />} title="Select a schema" subTitle="Select a schema to begin configuring." />
        ) : (
          <DynamicFormRenderer schema={schemaData} data={formData} onChange={handleFormChange} errors={validationErrors} />
        )}
      </div>

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

      if (status === 406) {
        showWarningToast(`Config data does not conform to the schema: ${details}`);
      } else if (status === 409) {
        showWarningToast('A config with this name already exists.');
      } else if (status === 422) {
        showErrorToast(`Config data is malformed: ${details}`);
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
