import { TreeNodeComponent } from './TreeNode';
import { createRootNode, createEmptyNode } from '../../utils/schema/schema-types';
import type { Story } from '@ladle/react';

const sampleRoot = createRootNode();
const stringChild = createEmptyNode('string', 'userName');
stringChild.displayName = 'User Name';
stringChild.required = true;

const numberChild = createEmptyNode('number', 'age');
numberChild.displayName = 'Age';

const objectChild = createEmptyNode('object', 'address');
objectChild.displayName = 'Address';
const streetChild = createEmptyNode('string', 'street');
streetChild.displayName = 'Street';
objectChild.children = [streetChild];

sampleRoot.children = [stringChild, numberChild, objectChild];

export const Default: Story = (): React.JSX.Element => (
  <div role="tree" style={{ padding: 16 }}>
    <TreeNodeComponent
      node={sampleRoot}
      depth={0}
      isSelected={false}
      isAncestor={false}
      onSelect={(): void => undefined}
      onToggleExpand={(): void => undefined}
      onDelete={(): void => undefined}
      ancestorIds={new Set()}
    />
  </div>
);

export const WithSelection: Story = (): React.JSX.Element => (
  <div role="tree" style={{ padding: 16 }}>
    <TreeNodeComponent
      node={sampleRoot}
      depth={0}
      isSelected={false}
      isAncestor
      onSelect={(): void => undefined}
      onToggleExpand={(): void => undefined}
      onDelete={(): void => undefined}
      ancestorIds={new Set([sampleRoot.id])}
    />
  </div>
);
