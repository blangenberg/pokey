import { UuidUtil } from 'pokey-common';
import type { SchemaNode, SchemaNodeType, CompositionKind } from './schema-types';

type JsonSchema = Record<string, unknown>;

const defaultUuid = new UuidUtil();

const KNOWN_KEYWORDS = new Set([
  'type',
  'enum',
  'const',
  'default',
  'title',
  'description',
  'examples',
  'readOnly',
  'writeOnly',
  '$comment',
  'minLength',
  'maxLength',
  'pattern',
  'format',
  'contentEncoding',
  'contentMediaType',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'items',
  'additionalItems',
  'minItems',
  'maxItems',
  'uniqueItems',
  'contains',
  'properties',
  'required',
  'additionalProperties',
  'patternProperties',
  'propertyNames',
  'minProperties',
  'maxProperties',
  'dependencies',
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'if',
  'then',
  'else',
  '$ref',
  'definitions',
  '$defs',
]);

const STRUCTURAL_KEYWORDS = new Set([
  'type',
  'properties',
  'required',
  'items',
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'if',
  'then',
  'else',
  'additionalItems',
  'contains',
  'additionalProperties',
  'patternProperties',
  'propertyNames',
  'dependencies',
  'definitions',
  '$defs',
]);

function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => (index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join('');
}

export function displayNameToId(displayName: string): string {
  return toCamelCase(displayName);
}

export function jsonSchemaToTree(schema: JsonSchema, name?: string, uuid: UuidUtil = defaultUuid): SchemaNode {
  const schemaType = schema.type as SchemaNodeType | undefined;
  const requiredArray = (schema.required ?? []) as string[];

  const compositionKind = detectCompositionKind(schema);

  const keywords: Record<string, unknown> = {};
  const extraKeywords: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (STRUCTURAL_KEYWORDS.has(key)) continue;
    if (KNOWN_KEYWORDS.has(key)) {
      keywords[key] = value;
    } else {
      extraKeywords[key] = value;
    }
  }

  const children: SchemaNode[] = [];

  if (schema.properties && typeof schema.properties === 'object') {
    const props = schema.properties as Record<string, JsonSchema>;
    for (const [propName, propSchema] of Object.entries(props)) {
      const child = jsonSchemaToTree(propSchema, propName, uuid);
      child.required = requiredArray.includes(propName);
      children.push(child);
    }
  }

  if (compositionKind && !schemaType) {
    const compositionKey = compositionKind === 'if/then/else' ? 'if' : compositionKind;
    if (compositionKind === 'not') {
      const notSchema = schema.not as JsonSchema | undefined;
      if (notSchema) {
        children.push(jsonSchemaToTree(notSchema, 'not', uuid));
      }
    } else if (compositionKind === 'if/then/else') {
      const ifSchema = schema.if as JsonSchema | undefined;
      const thenSchema = schema.then as JsonSchema | undefined;
      const elseSchema = schema.else as JsonSchema | undefined;
      if (ifSchema) children.push(jsonSchemaToTree(ifSchema, 'if', uuid));
      if (thenSchema) children.push(jsonSchemaToTree(thenSchema, 'then', uuid));
      if (elseSchema) children.push(jsonSchemaToTree(elseSchema, 'else', uuid));
    } else {
      const subSchemas = schema[compositionKey] as JsonSchema[] | undefined;
      if (subSchemas) {
        subSchemas.forEach((sub, idx) => {
          children.push(jsonSchemaToTree(sub, `${compositionKey}[${String(idx)}]`, uuid));
        });
      }
    }
  }

  if (schemaType === 'array' && schema.items) {
    if (Array.isArray(schema.items)) {
      (schema.items as JsonSchema[]).forEach((itemSchema, idx) => {
        children.push(jsonSchemaToTree(itemSchema, `items[${String(idx)}]`, uuid));
      });
    } else {
      children.push(jsonSchemaToTree(schema.items as JsonSchema, '(items)', uuid));
    }
  }

  if (schema.contains && typeof schema.contains === 'object') {
    children.push(jsonSchemaToTree(schema.contains as JsonSchema, '(contains)', uuid));
  }

  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    children.push(jsonSchemaToTree(schema.additionalProperties as JsonSchema, '(additionalProperties)', uuid));
  }

  const definitions = (schema.definitions ?? schema.$defs) as Record<string, JsonSchema> | undefined;
  if (definitions) {
    for (const [defName, defSchema] of Object.entries(definitions)) {
      const defNode = jsonSchemaToTree(defSchema, defName, uuid);
      defNode.group = 'definitions';
      children.push(defNode);
    }
  }

  const displayName = name ?? (schema.title as string | undefined) ?? 'Root';

  return {
    id: uuid.generate(),
    name: name ?? 'root',
    displayName,
    type: schemaType,
    compositionKind: compositionKind ?? undefined,
    required: false,
    description: schema.description as string | undefined,
    title: schema.title as string | undefined,
    ref: schema.$ref as string | undefined,
    keywords,
    extraKeywords,
    children,
    expanded: true,
  };
}

export function treeToJsonSchema(node: SchemaNode): JsonSchema {
  const schema: JsonSchema = {};

  if (node.ref) {
    schema.$ref = node.ref;
  }

  if (node.type) {
    schema.type = node.type;
  }

  for (const [key, value] of Object.entries(node.keywords)) {
    if (value !== undefined && value !== '' && value !== null) {
      schema[key] = value;
    }
  }

  if (node.type === 'object') {
    const regularChildren = node.children.filter(
      (c) =>
        c.group !== 'definitions' &&
        !c.name.startsWith('(') &&
        c.name !== 'not' &&
        c.name !== 'if' &&
        c.name !== 'then' &&
        c.name !== 'else',
    );

    if (regularChildren.length > 0) {
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];

      for (const child of regularChildren) {
        properties[child.name] = treeToJsonSchema(child);
        if (child.required) {
          required.push(child.name);
        }
      }

      schema.properties = properties;
      if (required.length > 0) {
        schema.required = required;
      }
    }
  }

  if (node.type === 'array') {
    const itemChildren = node.children.filter((c) => c.name === '(items)' || c.name.startsWith('items['));
    if (itemChildren.length === 1 && itemChildren[0]?.name === '(items)') {
      schema.items = treeToJsonSchema(itemChildren[0]);
    } else if (itemChildren.length > 0) {
      schema.items = itemChildren.map((c) => treeToJsonSchema(c));
    }

    const containsChild = node.children.find((c) => c.name === '(contains)');
    if (containsChild) {
      schema.contains = treeToJsonSchema(containsChild);
    }
  }

  if (node.compositionKind && !node.type) {
    if (node.compositionKind === 'not') {
      const notChild = node.children[0];
      if (notChild) {
        schema.not = treeToJsonSchema(notChild);
      }
    } else if (node.compositionKind === 'if/then/else') {
      for (const child of node.children) {
        if (child.name === 'if' || child.name === 'then' || child.name === 'else') {
          schema[child.name] = treeToJsonSchema(child);
        }
      }
    } else {
      schema[node.compositionKind] = node.children.map((c) => treeToJsonSchema(c));
    }
  }

  const addPropsChild = node.children.find((c) => c.name === '(additionalProperties)');
  if (addPropsChild) {
    schema.additionalProperties = treeToJsonSchema(addPropsChild);
  }

  const defChildren = node.children.filter((c) => c.group === 'definitions');
  if (defChildren.length > 0) {
    const definitions: Record<string, JsonSchema> = {};
    for (const def of defChildren) {
      definitions[def.name] = treeToJsonSchema(def);
    }
    schema.definitions = definitions;
  }

  for (const [key, value] of Object.entries(node.extraKeywords)) {
    schema[key] = value;
  }

  return schema;
}

function detectCompositionKind(schema: JsonSchema): CompositionKind | null {
  if (schema.allOf) return 'allOf';
  if (schema.anyOf) return 'anyOf';
  if (schema.oneOf) return 'oneOf';
  if (schema.not) return 'not';
  if (schema.if) return 'if/then/else';
  return null;
}
