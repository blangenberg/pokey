import { useState, useCallback } from 'react';
import { Modal, Button, Input, Alert } from 'antd';
import { validateSchema } from '../../utils/schema/schema-validation';

type JsonSchema = Record<string, unknown>;

interface EditJsonModalProps {
  isOpen: boolean;
  schema: JsonSchema;
  onAccept: (schema: JsonSchema) => void;
  onCancel: () => void;
}

export function EditJsonModal({ isOpen, schema, onAccept, onCancel }: EditJsonModalProps): React.JSX.Element {
  const [jsonText, setJsonText] = useState(JSON.stringify(schema, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback((): void => {
    setJsonText(JSON.stringify(schema, null, 2));
    setError(null);
  }, [schema]);

  const handleOk = useCallback((): void => {
    let parsed: JsonSchema;
    try {
      parsed = JSON.parse(jsonText) as JsonSchema;
    } catch {
      setError('Invalid JSON. Please check your syntax.');
      return;
    }

    const result = validateSchema(parsed);
    if (!result.valid) {
      setError(`Invalid JSON Schema: ${result.error ?? 'Unknown validation error.'}`);
      return;
    }

    setError(null);
    onAccept(parsed);
  }, [jsonText, onAccept]);

  const handleAfterOpenChange = useCallback(
    (open: boolean): void => {
      if (open) {
        handleOpen();
      }
    },
    [handleOpen],
  );

  const footer = (
    <>
      <Button onClick={onCancel}>Cancel</Button>
      <Button type="primary" onClick={handleOk}>
        OK
      </Button>
    </>
  );

  return (
    <Modal
      open={isOpen}
      title="Edit JSON Schema"
      onCancel={onCancel}
      afterOpenChange={handleAfterOpenChange}
      width={700}
      mask={{ closable: false }}
      footer={footer}
      destroyOnHidden
    >
      <Input.TextArea
        value={jsonText}
        onChange={(e): void => {
          setJsonText(e.target.value);
          setError(null);
        }}
        style={{ fontFamily: '"Roboto Mono", monospace', fontSize: 13, minHeight: 400, width: '100%' }}
        aria-label="JSON Schema editor"
      />
      {error && <Alert type="error" showIcon style={{ marginTop: 10 }} title={error} />}
    </Modal>
  );
}
