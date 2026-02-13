import type { JsonSchema } from 'pokey-common';

export interface CompatibilityIssue {
  path: string;
  message: string;
  type: 'REQUIRED_ADDED' | 'REQUIRED_REMOVED' | 'TYPE_CHANGED';
}

/**
 * Checks whether updating from `oldSchema` to `newSchema` is backward-compatible.
 *
 * Rules:
 *  - Adding new optional properties is safe.
 *  - Making a required property optional is safe.
 *  - Removing an optional property is safe.
 *  - Making an optional property required is UNSAFE.
 *  - Removing a required property is UNSAFE.
 *  - Changing a property type is UNSAFE.
 */
export function checkSchemaCompatibility(oldSchema: JsonSchema, newSchema: JsonSchema): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  compareSchemas(oldSchema, newSchema, '', issues);
  return issues;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return [];
}

function asPropertyMap(value: unknown): Record<string, Record<string, unknown>> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, Record<string, unknown>>;
  }
  return {};
}

function compareSchemas(
  oldSchema: Record<string, unknown>,
  newSchema: Record<string, unknown>,
  basePath: string,
  issues: CompatibilityIssue[],
): void {
  const oldProperties = asPropertyMap(oldSchema['properties']);
  const newProperties = asPropertyMap(newSchema['properties']);
  const oldRequired = new Set(asStringArray(oldSchema['required']));
  const newRequired = new Set(asStringArray(newSchema['required']));

  // Check each property that exists in the old schema
  for (const [propName, oldPropDef] of Object.entries(oldProperties)) {
    const currentPath = basePath ? `${basePath}.${propName}` : propName;

    if (propName in newProperties) {
      const newPropDef = newProperties[propName] as Record<string, unknown>;

      // Rule: Changing a property type is unsafe
      if (oldPropDef['type'] !== undefined && newPropDef['type'] !== undefined && oldPropDef['type'] !== newPropDef['type']) {
        issues.push({
          path: currentPath,
          message: `Type changed from '${oldPropDef['type'] as string}' to '${newPropDef['type'] as string}'`,
          type: 'TYPE_CHANGED',
        });
      }

      // Rule: Making an optional property required is unsafe
      if (!oldRequired.has(propName) && newRequired.has(propName)) {
        issues.push({
          path: currentPath,
          message: 'Optional property was made required',
          type: 'REQUIRED_ADDED',
        });
      }

      // Rule: Making a required property optional is safe (no issue)

      // Recursively check nested objects
      if (oldPropDef['type'] === 'object' && newPropDef['type'] === 'object') {
        compareSchemas(oldPropDef, newPropDef, currentPath, issues);
      }
    } else {
      // Property was removed from the new schema
      if (oldRequired.has(propName)) {
        // Rule: Removing a required property is unsafe
        issues.push({
          path: currentPath,
          message: 'Required property was removed',
          type: 'REQUIRED_REMOVED',
        });
      }
      // Rule: Removing an optional property is safe (no issue)
    }
  }

  // Check for newly required properties that did not exist before
  for (const propName of newRequired) {
    if (!(propName in oldProperties)) {
      const currentPath = basePath ? `${basePath}.${propName}` : propName;
      issues.push({
        path: currentPath,
        message: 'New required property was added',
        type: 'REQUIRED_ADDED',
      });
    }
  }

  // Rule: Adding new optional properties is safe (no issue)
}
