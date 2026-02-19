# Backend Search: List Endpoint Enhancements

## Overview

Enhance the existing schema and config list endpoints to support optional search/filter parameters using DynamoDB `Scan` with `FilterExpression` and `contains()`. This gives case-insensitive substring matching for `id` and `name` (names are already lowercased on write).

## Affected Endpoints

- `GET /api/schemas` — `packages/pokey-backend/src/handlers/schema-handlers/list.ts`
- `GET /api/configs` — `packages/pokey-backend/src/handlers/config-handlers/list.ts`

## New Optional Query Parameters

Both endpoints accept the same three optional filter parameters:

| Parameter | Type   | Match Strategy           | Description                                                                                                                                                     |
| --------- | ------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | string | `contains()` (substring) | Filter items whose `name` contains the given substring. Since names are lowercased on write, the handler should also lowercase the query value before matching. |
| `id`      | string | `contains()` (substring) | Filter items whose `id` contains the given substring. Useful for pasting partial UUIDs.                                                                         |
| `status`  | string | exact match (`=`)        | Filter by exact status value (`active` or `disabled`). Already supported — no change to validation logic.                                                       |

All parameters are optional. When none are provided, the endpoint returns all items (current behavior). When multiple are provided, they combine with `AND` logic in a single DynamoDB Scan/Query call. As a defensive measure, deduplicate results by `id` before returning.

## Implementation Strategy

### Why Scan + FilterExpression

DynamoDB does not support `ILIKE` or substring search on key conditions. The `contains()` function is only available in `FilterExpression`, which requires a `Scan` (or a `Query` with the filter applied post-read). Since Pokey is an internal admin tool with a small dataset (hundreds to low thousands of schemas/configs), a `Scan` with `FilterExpression` is the pragmatic choice. It gives true substring matching with negligible performance cost at this scale.

### Two Code Paths: Query vs. Scan

Currently, the schema list handler has two code paths:

1. **Status filter provided** → `Query` on `schemas-status-index`
2. **No status filter** → `Scan` on the base table

**Keep this branching.** The status-only filter is the default view for both schema and config tables, so the GSI-backed query path should remain the fast path. The logic becomes:

- **Status only (no `name` or `id`)** → `Query` on the status GSI. This is the common case and stays efficient.
- **`name` and/or `id` filters present** → `Scan` with a dynamically built `FilterExpression` combining all active filters (including `status` if provided).

The same approach applies to the config list handler. Currently it requires `schemaId` and queries the `configs-schemaId-index`. After this change, `schemaId` becomes an optional filter (exact match) alongside the new `name`, `id`, and `status` filters. When `schemaId` is the only filter (or combined with `status` only), use the `configs-schemaId-index` query path. When `name` or `id` are present, fall back to `Scan`. **Note:** making `schemaId` optional on the config list is a deliberate change — the frontend config list page still requires a schema selection, but the API becomes more flexible.

### FilterExpression Construction

Build the `FilterExpression` dynamically based on which query parameters are present. Extract this into a shared utility (`utils/buildListFilter.ts`) since both handlers use the same pattern.

The utility should accept a params object and return a result matching this interface:

```typescript
interface ListFilterResult {
  filterExpression: string | undefined;
  expressionAttributeNames: Record<string, string>;
  expressionAttributeValues: Record<string, unknown>;
}

interface ListFilterParams {
  name?: string;
  id?: string;
  status?: string;
  schemaId?: string; // config list only
}
```

Example pseudocode:

```typescript
const filters: string[] = [];
const exprValues: Record<string, unknown> = {};
const exprNames: Record<string, string> = { '#n': 'name', '#s': 'status' };

if (nameFilter) {
  filters.push('contains(#n, :nameFilter)');
  exprValues[':nameFilter'] = nameFilter.toLowerCase();
}
if (idFilter) {
  filters.push('contains(id, :idFilter)');
  exprValues[':idFilter'] = idFilter.toLowerCase();
}
if (statusFilter) {
  filters.push('#s = :status');
  exprValues[':status'] = statusFilter;
}
if (schemaIdFilter) {
  // config list only
  filters.push('schemaId = :schemaId');
  exprValues[':schemaId'] = schemaIdFilter;
}

const filterExpression = filters.length > 0 ? filters.join(' AND ') : undefined;
```

### Pagination Caveat

DynamoDB's `Limit` parameter caps the number of items _evaluated_, not the number of items _returned_. When `FilterExpression` discards items, a page of 20 evaluated items might return only 3 matches. The `lastEvaluatedKey` still reflects the scan position, so the client can paginate forward to get more results. **Do not change this behavior** — the frontend already handles sparse pages via its pagination controls. Document this behavior in the API response so frontend developers understand that a page may return fewer items than `limit` while still providing a `nextToken`.

## GSI Changes

### Keep `schemas-status-index`

The status-only query is the default table view (most common request). The GSI keeps this path efficient — a `Query` on `schemas-status-index` reads only matching items, whereas a `Scan` with a `FilterExpression` reads the entire table. Worth the write replication cost.

### Keep `schemas-name-index` and `configs-name-index`

These are still used by the **create** handlers to check for name conflicts (exact match query). They are not involved in the search flow but remain necessary.

### Keep `configs-schemaId-index`

Still used by the **config create** handler for name-conflict checks scoped to a schema (and potentially useful for other query patterns). Keep it, though the list handler will no longer use it.

### No GSI Changes Required

All existing GSIs are retained. No changes to `scripts/init-db-schema.ts` are needed.

## Handler Changes

### Schema List Handler (`list.ts`)

1. Read new optional query parameters: `name`, `id` (in addition to existing `status`, `limit`, `nextToken`).
2. Lowercase the `name` query value if present.
3. Choose the code path:
   - **Status only (no `name` or `id`)** → `Query` on `schemas-status-index` (existing fast path, unchanged).
   - **No filters at all** → `Scan` on the base table (existing behavior, unchanged).
   - **`name` and/or `id` present** → `Scan` with a dynamically built `FilterExpression` using the shared utility. Include `status` in the filter if provided.
4. Return the same response shape: `{ items, nextToken? }`.

### Config List Handler (`list.ts`)

1. Remove the hard requirement for `schemaId`. It becomes an optional filter like the others.
2. Read new optional query parameters: `name`, `id`, `schemaId`, `status`, `limit`, `nextToken`.
3. Choose the code path:
   - **`schemaId` only (no `name` or `id`)** → `Query` on `configs-schemaId-index`, with optional `status` as `FilterExpression` (existing fast path, unchanged).
   - **No filters at all** → `Scan` on the base table.
   - **`name` and/or `id` present** → `Scan` with a dynamically built `FilterExpression` using the shared utility. Include `schemaId` and `status` in the filter if provided.
4. Return the same response shape: `{ items, nextToken? }`.

## Testing

### Unit Tests

Update existing list handler tests and add new cases:

- **No filters** — returns all items (existing behavior, unchanged).
- **Status only** — returns only items matching the status.
- **Name substring** — returns items whose name contains the substring (case-insensitive).
- **ID substring** — returns items whose ID contains the substring.
- **Multiple filters** — combines with AND logic (e.g., name + status).
- **No matches** — returns empty `items` array with no `nextToken`.
- **Pagination with filters** — verifies `nextToken` is returned when more results exist.

For config list, additionally test:

- **schemaId filter** — returns only configs for that schema.
- **No schemaId** — returns configs across all schemas.

### Sanity Check

Update `scripts/backend-sanity-check.ts` to exercise the new filter parameters:

- Create a schema, then list with `?name=<partial>` and verify it appears.
- List with `?status=disabled` and verify the disabled schema appears (or doesn't, depending on its state).

## File Checklist

| File                                                 | Action                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `handlers/schema-handlers/list.ts`                   | Add name/id filter support, keep status-only GSI fast path                           |
| `handlers/config-handlers/list.ts`                   | Add name/id filter support, make schemaId optional, keep schemaId-only GSI fast path |
| `utils/buildListFilter.ts`                           | New shared utility for constructing FilterExpression                                 |
| `__tests__/helpers/buildListFilter.test.ts`          | Unit tests for the new shared filter utility                                         |
| `__tests__/handlers/schemas/list.test.ts`            | Update + add filter test cases                                                       |
| `__tests__/handlers/configs/list.test.ts`            | Update + add filter test cases                                                       |
| `scripts/backend-sanity-check.ts`                    | Add filter parameter smoke tests                                                     |
| Adapters (`express-adapter.ts`, `lambda-adapter.ts`) | No changes needed — both already pass all query parameters through to handlers       |

## Rules

- Follow all TypeScript rules from `.cursorrules` (strict types, explicit return types, no `any`).
- Follow the backend adapter pattern — handler logic stays in the handler, thin adapters convert request formats.
- Follow the observability pattern — `trackEvent`, `startTimer`, `logError` in every handler.
- Extract the filter-building logic into a pure, stateless utility function that is independently unit-testable.
