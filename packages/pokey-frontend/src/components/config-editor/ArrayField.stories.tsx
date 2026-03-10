import { useState } from 'react';
import { ArrayField } from './ArrayField';
import type { Story } from '@ladle/react';

export const StringArray: Story = (): React.JSX.Element => {
  const [items, setItems] = useState<unknown[]>(['widget-a', 'widget-b']);
  return (
    <div style={{ padding: 16, maxWidth: 500 }}>
      <ArrayField
        fieldName="Widgets"
        itemSchema={{ type: 'string' }}
        items={items}
        onChange={setItems}
        errors={new Map()}
        path="/widgets"
      />
      <pre style={{ marginTop: 16, opacity: 0.6, fontSize: 12 }}>{JSON.stringify(items, null, 2)}</pre>
    </div>
  );
};

export const NumberArray: Story = (): React.JSX.Element => {
  const [items, setItems] = useState<unknown[]>([10, 20, 30]);
  return (
    <div style={{ padding: 16, maxWidth: 500 }}>
      <ArrayField
        fieldName="Scores"
        itemSchema={{ type: 'number', minimum: 0, maximum: 100 }}
        items={items}
        onChange={setItems}
        errors={new Map()}
        path="/scores"
      />
    </div>
  );
};

export const WithMinMax: Story = (): React.JSX.Element => {
  const [items, setItems] = useState<unknown[]>(['a', 'b']);
  return (
    <div style={{ padding: 16, maxWidth: 500 }}>
      <ArrayField
        fieldName="Tags"
        itemSchema={{ type: 'string' }}
        items={items}
        onChange={setItems}
        minItems={1}
        maxItems={5}
        errors={new Map()}
        path="/tags"
        isRequired
      />
    </div>
  );
};

export const Empty: Story = (): React.JSX.Element => {
  const [items, setItems] = useState<unknown[]>([]);
  return (
    <div style={{ padding: 16, maxWidth: 500 }}>
      <ArrayField
        fieldName="Items"
        itemSchema={{ type: 'string' }}
        items={items}
        onChange={setItems}
        errors={new Map()}
        path="/items"
        description="Add items to get started."
      />
    </div>
  );
};
