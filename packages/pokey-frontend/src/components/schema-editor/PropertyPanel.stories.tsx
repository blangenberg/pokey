import { PropertyPanel } from './PropertyPanel';
import { createEmptyNode, createRootNode } from '../../utils/schema/schema-types';
import type { Story } from '@ladle/react';

export const NoSelection: Story = (): React.JSX.Element => (
  <div style={{ width: 400, padding: 16 }}>
    <PropertyPanel node={null} onUpdate={(): void => undefined} />
  </div>
);

const stringNode = createEmptyNode('string', 'email');
stringNode.displayName = 'Email Address';
stringNode.description = 'The user email';
stringNode.required = true;
stringNode.keywords = { format: 'email', minLength: 5, maxLength: 254 };

export const StringNode: Story = (): React.JSX.Element => (
  <div style={{ width: 400, padding: 16 }}>
    <PropertyPanel node={stringNode} onUpdate={(): void => undefined} />
  </div>
);

const rootNode = createRootNode();
rootNode.children = [createEmptyNode('string', 'name'), createEmptyNode('number', 'age')];

export const ObjectRoot: Story = (): React.JSX.Element => (
  <div style={{ width: 400, padding: 16 }}>
    <PropertyPanel node={rootNode} onUpdate={(): void => undefined} />
  </div>
);
