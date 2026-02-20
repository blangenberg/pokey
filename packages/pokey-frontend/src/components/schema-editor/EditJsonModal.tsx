import { useState, useCallback } from 'react';
import { Dialog, DialogBody, DialogFooter, Button, TextArea, Callout } from '@blueprintjs/core';
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

  return (
    <Dialog
      isOpen={isOpen}
      title="Edit JSON Schema"
      onOpening={handleOpen}
      onClose={onCancel}
      style={{ width: 700, minHeight: 500 }}
      canOutsideClickClose={false}
    >
      <DialogBody>
        <TextArea
          value={jsonText}
          onChange={(e): void => {
            setJsonText(e.target.value);
            setError(null);
          }}
          fill
          style={{ fontFamily: '"Roboto Mono", monospace', fontSize: 13, minHeight: 400 }}
          aria-label="JSON Schema editor"
        />
        {error && (
          <Callout intent="danger" style={{ marginTop: 10 }}>
            {error}
          </Callout>
        )}
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Cancel" onClick={onCancel} />
            <Button intent="primary" text="OK" onClick={handleOk} />
          </>
        }
      />
    </Dialog>
  );
}
