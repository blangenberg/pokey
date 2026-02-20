import { describe, it, expect } from 'vitest';
import { jsonSchemaToTree, treeToJsonSchema, displayNameToId } from './schema-mapping';

describe('displayNameToId', () => {
  it('converts multi-word names to camelCase', () => {
    expect(displayNameToId('Phone Number')).toBe('phoneNumber');
    expect(displayNameToId('User Name')).toBe('userName');
    expect(displayNameToId('First Name Last Name')).toBe('firstNameLastName');
  });

  it('handles single words', () => {
    expect(displayNameToId('title')).toBe('title');
    expect(displayNameToId('Theme')).toBe('theme');
  });

  it('strips special characters', () => {
    expect(displayNameToId('user-name')).toBe('username');
    expect(displayNameToId('page_title')).toBe('pagetitle');
    expect(displayNameToId("it's fine")).toBe('itsFine');
  });

  it('returns empty string for empty input', () => {
    expect(displayNameToId('')).toBe('');
  });
});

describe('jsonSchemaToTree / treeToJsonSchema round-trip', () => {
  it('round-trips a simple flat object schema', () => {
    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 100 },
        count: { type: 'integer', minimum: 0 },
        enabled: { type: 'boolean', default: true },
      },
      required: ['title'],
    };

    const tree = jsonSchemaToTree(schema);
    const output = treeToJsonSchema(tree);

    expect(output.type).toBe('object');
    expect(output.properties).toBeDefined();

    const props = output.properties as Record<string, Record<string, unknown>>;
    expect(props.title?.type).toBe('string');
    expect(props.title?.minLength).toBe(1);
    expect(props.title?.maxLength).toBe(100);
    expect(props.count?.type).toBe('integer');
    expect(props.count?.minimum).toBe(0);
    expect(props.enabled?.type).toBe('boolean');
    expect(props.enabled?.default).toBe(true);
    expect(output.required).toEqual(['title']);
  });

  it('round-trips nested objects', () => {
    const schema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
          },
          required: ['street'],
        },
      },
    };

    const tree = jsonSchemaToTree(schema);
    const output = treeToJsonSchema(tree);

    const address = (output.properties as Record<string, Record<string, unknown>>).address;
    expect(address?.type).toBe('object');
    const innerProps = address!.properties as Record<string, Record<string, unknown>>;
    expect(innerProps.street!.type).toBe('string');
    expect(innerProps.city!.type).toBe('string');
    expect(address?.required).toEqual(['street']);
  });

  it('round-trips array with single items schema', () => {
    const schema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 10,
          uniqueItems: true,
        },
      },
    };

    const tree = jsonSchemaToTree(schema);
    const output = treeToJsonSchema(tree);

    const tags = (output.properties as Record<string, Record<string, unknown>>).tags;
    expect(tags?.type).toBe('array');
    expect((tags!.items as Record<string, unknown>).type).toBe('string');
    expect(tags?.minItems).toBe(1);
    expect(tags?.maxItems).toBe(10);
    expect(tags?.uniqueItems).toBe(true);
  });

  it('round-trips array with object items', () => {
    const schema = {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
            },
          },
        },
      },
    };

    const tree = jsonSchemaToTree(schema);
    const output = treeToJsonSchema(tree);

    const users = (output.properties as Record<string, Record<string, unknown>>).users;
    expect(users?.type).toBe('array');
    const itemsSchema = users?.items as Record<string, unknown>;
    expect(itemsSchema.type).toBe('object');
    const itemProps = itemsSchema.properties as Record<string, Record<string, unknown>>;
    expect(itemProps.name?.type).toBe('string');
    expect(itemProps.age?.type).toBe('number');
  });

  it('round-trips tuple array (array of schemas)', () => {
    const schema = {
      type: 'object',
      properties: {
        coord: {
          type: 'array',
          items: [{ type: 'number' }, { type: 'number' }, { type: 'string' }],
        },
      },
    };

    const tree = jsonSchemaToTree(schema);
    const output = treeToJsonSchema(tree);

    const coord = (output.properties as Record<string, Record<string, unknown>>).coord;
    expect(coord?.type).toBe('array');
    const items = coord?.items as Record<string, unknown>[];
    expect(items).toHaveLength(3);
    expect(items[0]?.type).toBe('number');
    expect(items[1]?.type).toBe('number');
    expect(items[2]?.type).toBe('string');
  });

  it('round-trips string validation keywords', () => {
    const schema = {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          pattern: '^[a-z]+@',
          minLength: 5,
          maxLength: 255,
        },
      },
    };

    const tree = jsonSchemaToTree(schema);
    const output = treeToJsonSchema(tree);

    const email = (output.properties as Record<string, Record<string, unknown>>).email;
    expect(email?.format).toBe('email');
    expect(email?.pattern).toBe('^[a-z]+@');
    expect(email?.minLength).toBe(5);
    expect(email?.maxLength).toBe(255);
  });

  it('round-trips numeric keywords', () => {
    const schema = {
      type: 'object',
      properties: {
        score: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          exclusiveMinimum: -1,
          exclusiveMaximum: 101,
          multipleOf: 0.5,
        },
      },
    };

    const tree = jsonSchemaToTree(schema);
    const output = treeToJsonSchema(tree);

    const score = (output.properties as Record<string, Record<string, unknown>>).score;
    expect(score?.minimum).toBe(0);
    expect(score?.maximum).toBe(100);
    expect(score?.exclusiveMinimum).toBe(-1);
    expect(score?.exclusiveMaximum).toBe(101);
    expect(score?.multipleOf).toBe(0.5);
  });

  it('round-trips enum and const', () => {
    const schema = {
      type: 'object',
      properties: {
        color: { type: 'string', enum: ['red', 'green', 'blue'] },
        version: { type: 'string', const: '1.0.0' },
      },
    };

    const tree = jsonSchemaToTree(schema);
    const output = treeToJsonSchema(tree);

    const props = output.properties as Record<string, Record<string, unknown>>;
    expect(props.color?.enum).toEqual(['red', 'green', 'blue']);
    expect(props.version?.const).toBe('1.0.0');
  });

  it('round-trips metadata keywords', () => {
    const schema = {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          title: 'My Field',
          description: 'A test field',
          examples: ['foo', 'bar'],
          readOnly: true,
          $comment: 'internal note',
        },
      },
    };

    const tree = jsonSchemaToTree(schema);
    const output = treeToJsonSchema(tree);

    const field = (output.properties as Record<string, Record<string, unknown>>).field;
    expect(field?.title).toBe('My Field');
    expect(field?.description).toBe('A test field');
    expect(field?.examples).toEqual(['foo', 'bar']);
    expect(field?.readOnly).toBe(true);
    expect(field?.$comment).toBe('internal note');
  });

  it('preserves unrecognized keywords in extraKeywords', () => {
    const schema = {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          'x-custom-annotation': 'hello',
          'x-deprecated': true,
        },
      },
    };

    const tree = jsonSchemaToTree(schema);
    const fieldNode = tree.children[0];
    expect(fieldNode?.extraKeywords['x-custom-annotation']).toBe('hello');
    expect(fieldNode?.extraKeywords['x-deprecated']).toBe(true);

    const output = treeToJsonSchema(tree);
    const field = (output.properties as Record<string, Record<string, unknown>>).field;
    expect(field?.['x-custom-annotation']).toBe('hello');
    expect(field?.['x-deprecated']).toBe(true);
  });

  it('round-trips definitions', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      definitions: {
        Address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
          },
        },
      },
    };

    const tree = jsonSchemaToTree(schema);

    const defNode = tree.children.find((c) => c.group === 'definitions');
    expect(defNode).toBeDefined();
    expect(defNode?.name).toBe('Address');

    const output = treeToJsonSchema(tree);
    const defs = output.definitions as Record<string, Record<string, unknown>>;
    expect(defs.Address?.type).toBe('object');
  });

  it('round-trips $ref', () => {
    const schema = {
      type: 'object',
      properties: {
        home: { $ref: '#/definitions/Address' },
      },
    };

    const tree = jsonSchemaToTree(schema);
    expect(tree.children[0]?.ref).toBe('#/definitions/Address');

    const output = treeToJsonSchema(tree);
    const home = (output.properties as Record<string, Record<string, unknown>>).home;
    expect(home?.$ref).toBe('#/definitions/Address');
  });

  it('round-trips additionalProperties as schema object', () => {
    const schema = {
      type: 'object',
      additionalProperties: { type: 'string' },
    };

    const tree = jsonSchemaToTree(schema);
    const addPropsChild = tree.children.find((c) => c.name === '(additionalProperties)');
    expect(addPropsChild).toBeDefined();
    expect(addPropsChild?.type).toBe('string');

    const output = treeToJsonSchema(tree);
    expect((output.additionalProperties as Record<string, unknown>).type).toBe('string');
  });
});

describe('jsonSchemaToTree — composition schemas', () => {
  it('parses allOf', () => {
    const schema = {
      allOf: [
        { type: 'object', properties: { a: { type: 'string' } } },
        { type: 'object', properties: { b: { type: 'number' } } },
      ],
    };

    const tree = jsonSchemaToTree(schema);
    expect(tree.compositionKind).toBe('allOf');
    expect(tree.children).toHaveLength(2);
  });

  it('parses anyOf', () => {
    const schema = {
      anyOf: [{ type: 'string' }, { type: 'number' }],
    };

    const tree = jsonSchemaToTree(schema);
    expect(tree.compositionKind).toBe('anyOf');
    expect(tree.children).toHaveLength(2);
  });

  it('parses oneOf', () => {
    const schema = {
      oneOf: [{ type: 'string' }, { type: 'integer' }],
    };

    const tree = jsonSchemaToTree(schema);
    expect(tree.compositionKind).toBe('oneOf');
    expect(tree.children).toHaveLength(2);
  });

  it('parses not', () => {
    const schema = {
      not: { type: 'string' },
    };

    const tree = jsonSchemaToTree(schema);
    expect(tree.compositionKind).toBe('not');
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]?.type).toBe('string');
  });

  it('parses if/then/else', () => {
    const schema = {
      if: { properties: { country: { const: 'US' } } },
      then: { properties: { state: { type: 'string' } } },
      else: { properties: { province: { type: 'string' } } },
    };

    const tree = jsonSchemaToTree(schema);
    expect(tree.compositionKind).toBe('if/then/else');
    expect(tree.children).toHaveLength(3);
    expect(tree.children.map((c) => c.name)).toEqual(['if', 'then', 'else']);
  });
});

describe('jsonSchemaToTree — property attributes', () => {
  it('marks required properties', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name'],
    };

    const tree = jsonSchemaToTree(schema);
    const nameNode = tree.children.find((c) => c.name === 'name');
    const ageNode = tree.children.find((c) => c.name === 'age');
    expect(nameNode?.required).toBe(true);
    expect(ageNode?.required).toBe(false);
  });

  it('uses schema title as displayName when no name is given', () => {
    const schema = {
      type: 'object',
      title: 'My Schema',
    };

    const tree = jsonSchemaToTree(schema);
    expect(tree.displayName).toBe('My Schema');
  });

  it('uses property name as displayName when provided', () => {
    const schema = {
      type: 'object',
      properties: {
        userName: { type: 'string', title: 'User Name' },
      },
    };

    const tree = jsonSchemaToTree(schema);
    expect(tree.children[0]?.displayName).toBe('userName');
    expect(tree.children[0]?.title).toBe('User Name');
  });
});

describe('treeToJsonSchema — edge cases', () => {
  it('omits empty required array', () => {
    const schema = {
      type: 'object',
      properties: {
        a: { type: 'string' },
      },
    };

    const tree = jsonSchemaToTree(schema);
    const output = treeToJsonSchema(tree);
    expect(output.required).toBeUndefined();
  });

  it('omits empty/null keyword values', () => {
    const schema = {
      type: 'object',
      properties: {
        field: { type: 'string' },
      },
    };

    const tree = jsonSchemaToTree(schema);
    tree.children[0]!.keywords.pattern = '';
    tree.children[0]!.keywords.minLength = null;

    const output = treeToJsonSchema(tree);
    const field = (output.properties as Record<string, Record<string, unknown>>).field;
    expect(field?.pattern).toBeUndefined();
    expect(field?.minLength).toBeUndefined();
  });

  it('handles an empty root with no children', () => {
    const schema = { type: 'object' };
    const tree = jsonSchemaToTree(schema);
    const output = treeToJsonSchema(tree);
    expect(output).toEqual({ type: 'object' });
  });
});
