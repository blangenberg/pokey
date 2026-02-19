# POKEY: Frontend Initialization Prompt

Generate the Pokey frontend admin tool. It must look and feel identical to the existing Flanders admin tool (checked out at `./flanders/`). Use the screenshot at `assets/Flanders-ui.png` as a visual reference.

## Tech Stack

- Node v22, matching the parent repo
- React 19
- Vite (already scaffolded in `packages/pokey-frontend`)
- Ky as the HTTP client. **Do NOT use Axios.**
- TypeScript — strict mode, following all rules in `.cursorrules`
- SCSS for styling
- BlueprintJS 5 for UI components (Flanders uses BlueprintJS 3; upgrade to the latest v5 for React 19 compatibility)
- React Router v6 (Flanders uses v5; use v6 for modern conventions)
- oauth4webapi for Okta PKCE flow (same library as Flanders)
- Vitest for testing
- Ladle for component stories (not Storybook)

## Application Skeleton

### Directory Structure

```text
packages/pokey-frontend/src/
  assets/              – Static assets (Okta icon, Aura logo SVG, etc.)
  components/
    Logo/              – Aura SVG logo (port from flanders/src/components/Logo/)
    Page/              – Main layout shell: top nav + sub-header + body
    OktaSignin/        – Initiates Okta PKCE authorization redirect
    OktaRedirectHandler/ – Handles Okta callback, token exchange, role picker
    AuthGuard/         – Route guard: redirects to Okta sign-in if unauthenticated
  pages/
    Schemas/
      SchemaList.tsx   – Filterable, paginated schema table
      SchemaEditor.tsx – Create / edit schema (tree + property panel)
      SchemaTree.tsx   – Recursive tree view of schema structure
      PropertyPanel.tsx – Right-panel property configuration form
      EditJsonModal.tsx – Raw JSON editor modal with validation
      schemaNode.ts    – SchemaNode type + tree ↔ JSON Schema conversion utils
    Configs/
      ConfigList.tsx     – Filterable, paginated config table
      ConfigEditor.tsx   – Create / edit config (schema selector + dynamic form)
      DynamicFormRenderer.tsx – Recursive form renderer driven by JSON Schema
      ArrayField.tsx     – Array item list with +/- controls
  components/
    shared/
      SchemaSelector.tsx – Type-ahead dropdown for selecting a schema (used by config list + editor)
      StatusToggle.tsx   – Activate/disable switch (used by schema + config editors)
      PaginationControls.tsx – Back/Next buttons (used by schema + config lists)
      ListPage.tsx       – Shared list page layout (filter bar, create button, table, pagination)
  hooks/
    useAuth.ts         – Auth state: access token, refresh token, sign out
    usePagination.ts   – Reusable cursor-based pagination state hook
  services/
    auth.ts            – Token storage, refresh logic, Okta token swap
    api.ts             – Ky instance with auth interceptor (Bearer token)
    toaster.ts         – Shared OverlayToaster instance
  styles/
    colors.scss        – Aura brand color tokens (port from flanders/src/colors.scss)
    global.scss        – Global styles, Blueprint imports, font, body background
    page.scss          – Page layout, header, sub-header styles
  App.tsx              – Router + AuthGuard + Page shell
  main.tsx             – Entry point
```

### Routing

Use React Router v6. Top-level routes:

| Path             | Component              | Description                           |
| ---------------- | ---------------------- | ------------------------------------- |
| `/`              | Redirect to `/schemas` | Default landing                       |
| `/schemas`       | `SchemaList`           | Schema list with filters + pagination |
| `/schemas/new`   | `SchemaEditor`         | Create new schema                     |
| `/schemas/:id`   | `SchemaEditor`         | Edit existing schema                  |
| `/configs`       | `ConfigList`           | Config list with filters + pagination |
| `/configs/new`   | `ConfigEditor`         | Create new config                     |
| `/configs/:id`   | `ConfigEditor`         | Edit existing config                  |
| `/okta-signin`   | `OktaSignin`           | Initiates Okta redirect               |
| `/okta-redirect` | `OktaRedirectHandler`  | Okta callback handler                 |

## Main Header

The main header is a fixed-position top navigation bar styled identically to Flanders. Reference `flanders/src/components/Page/index.js` and `flanders/src/components/Page/styles.scss`.

### Left Side

1. **Aura Logo** — The inline SVG from `flanders/src/components/Logo/index.js`. Clicking it navigates to `/`.
2. **"Pokey" nav entry** — A single nav button with the `cog` icon and text "Pokey", matching the style of Flanders' "Config" entry. Since Pokey only has one top-level section, this is always selected/active.

### Right Side

1. **Environment badge** — A `Tag` component displaying the current environment in uppercase (e.g., `DEV`, `TEST`, `PROD`). Source the value from an environment variable (`VITE_STAGE`). Matches the Flanders `aura-page-env` tag.
2. **User menu** — A `Popover` with a `Button` showing the logged-in user's alias (or truncated user ID). The popover menu contains:
   - Role display (disabled menu item)
   - Divider
   - "Sign out" (intent: danger, icon: `log-out`)

### Header Styling

- Background: linear gradient from `$aura-american-blue` (#1e306e) to `$aura-denim-blue` (#1074d0).
- Fixed position, full width, z-index 8.
- Buttons use Blueprint's `minimal` style with light text (#f5f8fa).
- Icons default to #a7b6c2, hover to inherit.
- Dividers use `rgba(255, 255, 255, 0.15)`.
- Port the full `.aura-page-nav .bp5-navbar` SCSS block from `flanders/src/components/Page/styles.scss` (updating `bp3-` prefixes to `bp5-` for BlueprintJS 5).

## Sub-Header

When Pokey is selected (always), render a sub-header bar below the main header. Reference `Page.Head` in `flanders/src/components/Page/index.js` and the `.aura-page-head` SCSS.

### Sub-Header Layout

1. **Title** — An `H3` element with text "Pokey", styled with `aura-page-head-title`.
2. **Tab buttons** — Two tab buttons: **"Schemas"** and **"Configs"**. The active tab is `outlined`. Clicking a tab navigates to the corresponding route (`/schemas` or `/configs`).

### Sub-Header Styling

- Fixed position, top: 50px, full width, height: 50px.
- Background: linear gradient from `$aura-gray` (#d6d7db) to #F4F4F4.
- Box shadow: `0 2px 2px -1px rgba(#BBB, .75)`.
- Flexbox layout with vertically centered items.
- z-index: 11.

## Authentication (Okta)

Implement Okta authentication using the same PKCE flow as Flanders. Reference these Flanders files:

- `flanders/src/components/OktaSignin/index.js`
- `flanders/src/components/OktaRedirectHandler/index.js`
- `flanders/src/components/AuthAttemptDialog/index.js`
- `flanders/src/services/auth/redux.js`
- `flanders/src/components/Router/index.js`

### Flow

1. **AuthGuard** checks for a valid (non-expired) refresh token. If missing or expired, redirect to `/okta-signin`. Allow `/okta-redirect` to render without auth.
2. **OktaSignin** component:
   - Uses `oauth4webapi` to discover the Okta authorization server.
   - Generates a PKCE `code_verifier`, stores it in `sessionStorage`.
   - Builds the authorization URL with `client_id`, `code_challenge` (S256), `redirect_uri`, `response_type=code`, `scope=openid email profile groups`, and `state` (current URL path).
   - Redirects the browser to Okta.
3. **OktaRedirectHandler** component:
   - Exchanges the authorization code for tokens using `oauth4webapi`.
   - Decodes the `id_token` to inspect `groups`.
   - If multiple groups, renders a role picker dialog (matching Flanders' style with `Logo`, group buttons).
   - Calls the backend `auth.admin.okta_token_swap` endpoint (or equivalent Pokey auth endpoint) with `id_token` and `selected_group`.
   - Stores `access_token` and `refresh_token` in application state and `localStorage`.
   - Redirects to the saved `urlState` or `/`.

### Local Development Bypass

When running locally (`VITE_STAGE` is unset or `local`), skip the Okta flow entirely. Auto-authenticate with a mock user:

- **User alias**: `Local Developer`
- **Role**: `local-admin`

The `AuthGuard` should detect local mode and inject the mock identity without redirecting to Okta. The main header should display "Local Developer" in the user menu and "LOCAL" in the environment badge. No real tokens are needed — API requests to the local backend (`localhost:3001`) do not require authentication.

### Configuration

Okta settings come from Vite environment variables:

| Variable                 | Description          | Dev Default                           |
| ------------------------ | -------------------- | ------------------------------------- |
| `VITE_OKTA_BASE_URL`     | Okta issuer base URL | `https://aurahub.okta.com`            |
| `VITE_OKTA_CLIENT_ID`    | Okta OAuth client ID | (obtain from Okta admin)              |
| `VITE_OKTA_REDIRECT_URI` | OAuth redirect URI   | `http://localhost:3000/okta-redirect` |

### Token Management

- Store tokens in `localStorage` keyed by `btoa(window.location.origin)` (same pattern as Flanders).
- Attach the access token to all API requests via a Ky `beforeRequest` hook: `Authorization: Bearer <access_token>`.
- Implement token refresh logic before expiry.
- On sign-out, clear stored tokens and redirect to `/`.

### Key Differences from Flanders

- **Ky instead of Axios** — Use Ky's `beforeRequest` hooks for auth headers, not Axios interceptors.
- **No Eddie/Wiseguy/Carl-Carlson** — Pokey does not use the `@isubscribed/eddie` passkey/auth SDK or other internal Aura auth packages. Okta is the only sign-in method.
- **No password/MFA flows** — Only Okta SSO. The sign-in dialog is simpler: just the Aura logo, app title, and a "Sign in with Okta" button.
- **TypeScript** — Flanders auth files are plain JavaScript. Every Pokey auth file (`OktaSignin`, `OktaRedirectHandler`, `AuthGuard`, `useAuth`, `services/auth.ts`) **must be TypeScript (`.ts` / `.tsx`)** with strict types, explicit return types, and no `any`. Use `unknown` when necessary.

## HTTP Client (Ky)

Create a shared Ky instance in `services/api.ts`:

```typescript
import ky from 'ky';

const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAccessToken(); // from auth service
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
  },
});
```

## Style Guide

### Brand Colors

Port from `flanders/src/colors.scss`:

```scss
$aura-american-blue: #1e306e;
$aura-baby-blue: #a7eaff;
$aura-denim-blue: #1074d0;
$aura-sky-blue: #47c1fd;
$aura-gray: #d6d7db;
$aura-cool-gray: #e7f0f5;
$aura-horizon-orange: #ff5f2d;
$aura-mandarin: #ff8e58;
$aura-night-blue: #040443;
$aura-orange: #ffbe82;
$aura-pale-yellow: #ffedad;
```

### Typography

- Font: `"Roboto Mono", monospace` — applied globally via `body *`.
- Base font size: 14px.
- Import from Google Fonts: `https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500&display=swap`

### Global Styles

- `html` background: #f8f8f8.
- `body` background: linear gradient from `$aura-american-blue` to `$aura-denim-blue`.
- Import BlueprintJS 5 CSS (normalize, icons, core, select, table).
- Page body content area: `padding: 120px 20px 20px 20px` to clear fixed header + sub-header.

### Component-Level Styles

Each component directory contains a `styles.scss` (or `styles.module.scss`) file. Follow the same pattern as Flanders.

## Schema Pages

Reference `assets/Flanders-ui.png` for overall list layout and `assets/schema-ui-example.png` for the schema editor design.

### Schema List (`/schemas`)

#### Schema List Layout

The schema list is the default page. It renders a filterable, paginated table of schemas inside the page body area (below the fixed header and sub-header).

#### Search Filters

Render a filter bar at the top of the page body with these controls on a single row:

| Control    | Type       | Description                                                                                                                                                      |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**   | Text input | Filter by schema name (substring match)                                                                                                                          |
| **ID**     | Text input | Filter by exact schema ID                                                                                                                                        |
| **Status** | Dropdown   | Options: `active` (default), `all`, `disabled`. `active` sends `status=active`, `disabled` sends `status=disabled`, `all` omits the `status` parameter entirely. |

Filters should update the list when the user changes them (debounce text inputs by ~300ms). Changing any filter resets pagination to the first page.

#### "Create Schema" Button

A green `Button` with `intent="success"` and text "Create Schema", positioned in the upper-right corner of the page body (same placement as the "Create Role" button in Flanders). The button is always enabled. Clicking it navigates to `/schemas/new`.

#### Table

Render schemas in a table matching the Flanders Roles table style. Columns:

| Column      | Description                                                |
| ----------- | ---------------------------------------------------------- |
| **name**    | Schema name (clickable link — navigates to `/schemas/:id`) |
| **status**  | `active` or `disabled`                                     |
| **created** | Formatted `createdAt` timestamp                            |
| **updated** | Formatted `updatedAt` timestamp                            |

Clicking a row's name navigates to the schema editor for that schema.

#### Pagination

Uses the shared cursor-based pagination pattern (see "Shared Patterns > Cursor-Based Pagination"). Render the `PaginationControls` component at both the top and bottom of the table. Pagination state is preserved when navigating to/from the schema editor.

### Schema Editor (`/schemas/new` and `/schemas/:id`)

This page is used for both creating and editing schemas. Reference `assets/schema-ui-example.png` for the visual design. Ignore header discrepancies in that image — use the standard Pokey header/sub-header.

#### Top Bar

A row at the top of the page body containing:

- **Schema Name** — A text input (editable in create mode, read-only in edit mode) on the left.
- **Status Toggle** — Only shown in edit mode. A `Switch` component labeled "Active" / "Disabled" reflecting the schema's current status. Toggling it immediately calls POST `/api/schemas/:id/activate` or POST `/api/schemas/:id/disable` and updates the displayed status. Use `intent="success"` when active and `intent="danger"` when disabled.
- **Save Schema** — A green `Button` (`intent="success"`) on the right. Disabled until the schema is valid.
- **Edit JSON** — A secondary `Button` next to Save Schema. Opens a modal dialog with a JSON text editor (see below).
- **Validate** - Determines if the schema is valid JSON and can be compiled by `Ajv`
- **Cancel** — A minimal `Button` that navigates back to `/schemas` without saving. Pagination state is preserved.

#### Split-Pane Layout

The editor body is a horizontal split into two panels:

##### Left Panel: Schema Structure (Tree View)

A visual tree representing the JSON Schema. The tree must be capable of representing **every construct in the JSON Schema draft-07 specification** (https://ajv.js.org/json-schema.html#draft-07). The visual UI is a convenience layer — it must never lose fidelity with the underlying JSON Schema. Any valid draft-07 schema loaded via the Edit JSON modal or fetched from the backend must render correctly in the tree, even if it uses advanced keywords the UI doesn't have dedicated controls for.

**Node display:**

Each node in the tree displays:

- **Icon** indicating type:
  - Folder icon for `object`
  - List/grid icon for `array`
  - `T` icon for `string`
  - `#` icon for `number` / `integer`
  - Toggle icon for `boolean`
  - Question-mark or generic icon for polymorphic nodes (`oneOf`, `anyOf`, `allOf`, `not`, `if/then/else`, or schemas without a `type`)
- **Display name** (the property key)
- **Type label** in parentheses: e.g., `(Text)`, `(Number)`, `(Object)`, `(List)`, `(True / False)`
- **Required indicator** — a red dot if the property is in the parent's `required` array
- **Expand/collapse** chevron for `object`, `array`, and composition nodes

The root node is always an `object` labeled "Root (Object)".

**Draft-07 coverage:**

The tree and property panel must support the full draft-07 keyword set. The table below groups keywords by category. The "UI control" column describes how each keyword should be surfaced in the property configuration panel.

_Core type keywords:_

| Keyword   | Applies to | UI Control                                               |
| --------- | ---------- | -------------------------------------------------------- |
| `type`    | All        | Type selector (dropdown or set at creation via "+" menu) |
| `enum`    | All        | Tag input — user enters allowed values as a list         |
| `const`   | All        | Single-value input                                       |
| `default` | All        | Input matching the node's type                           |

_String keywords:_

| Keyword            | UI Control                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `minLength`        | Number input                                                                                                                             |
| `maxLength`        | Number input                                                                                                                             |
| `pattern`          | Text input (regex)                                                                                                                       |
| `format`           | Dropdown: None, email, uri, uri-reference, date, date-time, time, hostname, ipv4, ipv6, uuid, json-pointer, relative-json-pointer, regex |
| `contentEncoding`  | Text input                                                                                                                               |
| `contentMediaType` | Text input                                                                                                                               |

_Numeric keywords (`number` and `integer`):_

| Keyword            | UI Control                                                 |
| ------------------ | ---------------------------------------------------------- |
| `minimum`          | Number input                                               |
| `maximum`          | Number input                                               |
| `exclusiveMinimum` | Number input (draft-07 uses a number value, not a boolean) |
| `exclusiveMaximum` | Number input                                               |
| `multipleOf`       | Number input                                               |

_Array keywords:_

| Keyword           | UI Control                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`           | If a single schema: shown as a child node labeled "(items)". If a tuple (array of schemas): each positional schema shown as a numbered child node. |
| `additionalItems` | Toggle (true/false) or a child schema node                                                                                                         |
| `minItems`        | Number input                                                                                                                                       |
| `maxItems`        | Number input                                                                                                                                       |
| `uniqueItems`     | Toggle switch                                                                                                                                      |
| `contains`        | Child schema node labeled "(contains)"                                                                                                             |

_Object keywords:_

| Keyword                | UI Control                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `properties`           | Each property is a child node in the tree                                                         |
| `required`             | Per-child toggle (the red dot / "Required Field" switch)                                          |
| `additionalProperties` | Toggle (true/false) or a child schema node                                                        |
| `patternProperties`    | Each pattern shown as a child node labeled with the regex pattern                                 |
| `propertyNames`        | Child schema node labeled "(propertyNames)"                                                       |
| `minProperties`        | Number input                                                                                      |
| `maxProperties`        | Number input                                                                                      |
| `dependencies`         | List of property-name → schema or property-name → string-array pairs (advanced; key-value editor) |

_Composition keywords:_

| Keyword | UI Control                                                                |
| ------- | ------------------------------------------------------------------------- |
| `allOf` | Renders as a parent node labeled "All Of" with each sub-schema as a child |
| `anyOf` | Renders as a parent node labeled "Any Of" with each sub-schema as a child |
| `oneOf` | Renders as a parent node labeled "One Of" with each sub-schema as a child |
| `not`   | Renders as a parent node labeled "Not" containing the negated schema      |

_Conditional keywords:_

| Keyword | UI Control                                                                       |
| ------- | -------------------------------------------------------------------------------- |
| `if`    | Renders as a parent group "If / Then / Else" with up to three child schema nodes |
| `then`  | Child of the conditional group                                                   |
| `else`  | Child of the conditional group                                                   |

_Metadata keywords (all types):_

| Keyword       | UI Control       |
| ------------- | ---------------- |
| `title`       | Text input       |
| `description` | Textarea         |
| `examples`    | JSON array input |
| `readOnly`    | Toggle switch    |
| `writeOnly`   | Toggle switch    |
| `$comment`    | Text input       |

_Reference keywords:_

| Keyword                 | UI Control                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `$ref`                  | Text input (JSON Pointer). The tree should display the reference target path and ideally resolve it for preview.                         |
| `definitions` / `$defs` | A collapsible "Definitions" section at the bottom of the tree. Each definition is a named schema node that can be referenced via `$ref`. |

**Graceful handling of unrecognized keywords:** If a loaded schema contains keywords the UI doesn't have dedicated controls for, preserve them in the underlying JSON Schema state and surface them in the property panel as a read-only "Additional Keywords" JSON block. The user can always edit them via the Edit JSON modal.

**Interactions:**

- **Click a node** to select it — the right panel shows its configuration.
- **Drag and drop** to reorder properties within the same parent.
- **"+" button** at the top of the tree — opens a type picker dropdown with options:
  - Text (string)
  - Number
  - Boolean (True / False)
  - Object
  - List (array)
  - Composition (allOf / anyOf / oneOf)

  Selecting a type adds a new property of that type to the currently selected object node (or the root if nothing is selected). The new node is auto-selected so the user can immediately configure it in the right panel.

- **Delete** — Each non-root node has a delete action (context menu or icon button). Deleting a node removes it and its children from the schema.

##### Right Panel: Property Configuration

When a node is selected in the tree, the right panel shows a form for configuring that property. The header reads "Configuration: {display name}".

The panel dynamically renders controls based on the node's type, showing all applicable keywords from the tables above. Organize the controls into collapsible sections:

1. **General** — Display Name, Type, Description, Required, Default, Enum, Const
2. **Validation** — Type-specific constraint fields (minLength, maximum, pattern, etc.)
3. **Metadata** — Title, Examples, Read Only, Write Only, $comment
4. **Advanced** — Any additional/unrecognized keywords displayed as editable JSON

**Common fields (all types):**

| Field          | Control                | Description                                                                                                                                                                                                                                            |
| -------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Display Name   | Text input             | Human-readable label for the property (e.g., `"Phone Number"`, `"User Name"`). Free-form text.                                                                                                                                                         |
| ID             | Read-only text         | The property key used in the JSON Schema. Auto-generated from Display Name by converting to camelCase (e.g., `"Phone Number"` → `"phoneNumber"`, `"User Name"` → `"userName"`). Updates live as the user types in Display Name. Not directly editable. |
| Group          | Text input             | Optional grouping label (stored in schema metadata)                                                                                                                                                                                                    |
| Description    | Textarea               | Maps to JSON Schema `description`                                                                                                                                                                                                                      |
| Required Field | Toggle switch          | Adds/removes this key from the parent's `required` array                                                                                                                                                                                               |
| Default        | Type-appropriate input | Maps to `default`                                                                                                                                                                                                                                      |
| Enum           | Tag input              | Maps to `enum` — list of allowed values                                                                                                                                                                                                                |
| Const          | Single-value input     | Maps to `const`                                                                                                                                                                                                                                        |

**Type-specific fields:**

| Type                                | Additional Fields                                                                                                                                                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Text** (string)                   | Min Length (`minLength`), Max Length (`maxLength`), Pattern (`pattern`), Format dropdown (`format`), Content Encoding, Content Media Type                                                                                                                 |
| **Number** / **Integer**            | Minimum (`minimum`), Maximum (`maximum`), Exclusive Minimum (`exclusiveMinimum`), Exclusive Maximum (`exclusiveMaximum`), Multiple Of (`multipleOf`)                                                                                                      |
| **Boolean**                         | Default Value dropdown (None, True, False)                                                                                                                                                                                                                |
| **Object**                          | Additional Properties toggle, Min Properties, Max Properties, Pattern Properties editor, Dependencies editor. Child properties are managed in the tree.                                                                                                   |
| **List** (array)                    | Items schema (single or tuple), Additional Items toggle, Min Items (`minItems`), Max Items (`maxItems`), Unique Items toggle (`uniqueItems`), Contains schema. If Items is a single Object schema, its properties are managed as child nodes in the tree. |
| **Composition** (allOf/anyOf/oneOf) | Sub-schemas managed as child nodes. "Not" has a single child.                                                                                                                                                                                             |
| **Conditional** (if/then/else)      | Three child schema slots managed in the tree.                                                                                                                                                                                                             |

#### Edit JSON Modal

Triggered by the "Edit JSON" button. Opens a modal dialog containing:

- A full-height code editor (use a simple `<textarea>` with monospace font, or a lightweight code editor component if available) pre-populated with the current schema as pretty-printed JSON.
- The user can directly edit the JSON.
- **OK** button: Validates the JSON:
  1. Parse check — is it valid JSON?
  2. Ajv compilation check — can Ajv compile it as a valid JSON Schema?
     If both pass, update the tree view to reflect the new schema and close the modal.
     If either fails, show an inline error message below the editor. Do not close the modal.
- **Cancel** button: Closes the modal without changes.

#### Schema ↔ Tree Mapping

The editor must maintain a bidirectional mapping between the visual tree and a JSON Schema (draft-07) object:

- **Tree → JSON Schema**: When the user modifies the tree (add/remove/reorder nodes, change properties in the right panel), regenerate the JSON Schema object in state. This is what gets sent to the backend on save.
- **JSON Schema → Tree**: When loading an existing schema for editing, or after accepting changes from the Edit JSON modal, parse the JSON Schema into the tree data structure.

The internal tree state should be a recursive structure like:

```typescript
type SchemaNodeType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
type CompositionKind = 'allOf' | 'anyOf' | 'oneOf' | 'not' | 'if/then/else';

interface SchemaNode {
  id: string; // unique key for React rendering
  name: string; // property key (or label for composition/conditional nodes)
  type?: SchemaNodeType; // undefined for composition/conditional/ref-only nodes
  compositionKind?: CompositionKind; // set for allOf, anyOf, oneOf, not, if/then/else nodes
  required: boolean;
  description?: string;
  title?: string;
  group?: string; // UI-only grouping metadata
  ref?: string; // $ref target if this is a reference node
  // All JSON Schema keywords for this node (minLength, pattern, enum, default, etc.)
  keywords: Record<string, unknown>;
  // Unrecognized keywords preserved for round-trip fidelity
  extraKeywords: Record<string, unknown>;
  // Children: object properties, array items, composition sub-schemas, etc.
  children: SchemaNode[];
}
```

The `keywords` map holds all recognized draft-07 keywords (e.g., `{ minLength: 7, maxLength: 15, format: 'phone' }`). The `extraKeywords` map holds any keywords the UI doesn't have dedicated controls for, ensuring nothing is lost during round-trip editing. Both maps are merged back into the JSON Schema output during Tree → JSON Schema serialization.

#### Create vs. Edit Behavior

| Aspect        | Create (`/schemas/new`)         | Edit (`/schemas/:id`)                          |
| ------------- | ------------------------------- | ---------------------------------------------- |
| Schema name   | Editable text input             | Read-only display                              |
| Initial state | Empty schema (root object only) | Loaded from backend via GET `/api/schemas/:id` |
| Save action   | POST `/api/schemas`             | PUT `/api/schemas/:id`                         |
| Cancel        | Navigate to `/schemas`          | Navigate to `/schemas`                         |

#### Error Handling

Uses the shared toaster instance and error handling rules (see "Shared Patterns > Toaster" and "Shared Patterns > Error Handling").

**On save (create — POST `/api/schemas`):**

| HTTP Status   | Toast Intent | Message                                               |
| ------------- | ------------ | ----------------------------------------------------- |
| 200           | `success`    | "Schema created successfully."                        |
| 409           | `warning`    | "A schema with this name already exists."             |
| 422           | `danger`     | "Schema is malformed: {error message from response}." |
| 5xx           | `danger`     | "Server error — please try again."                    |
| Network error | `danger`     | "Unable to reach the server. Check your connection."  |

**On save (update — PUT `/api/schemas/:id`):**

| HTTP Status   | Toast Intent | Message                                                              |
| ------------- | ------------ | -------------------------------------------------------------------- |
| 200           | `success`    | "Schema updated successfully."                                       |
| 400           | `warning`    | "Schema update is not backward-compatible: {details from response}." |
| 422           | `danger`     | "Schema is malformed: {error message from response}."                |
| 5xx           | `danger`     | "Server error — please try again."                                   |
| Network error | `danger`     | "Unable to reach the server. Check your connection."                 |

**On status toggle (activate/disable):**

| HTTP Status | Toast Intent | Message                            |
| ----------- | ------------ | ---------------------------------- |
| 200         | `success`    | "Schema {activated/disabled}."     |
| 404         | `danger`     | "Schema not found."                |
| 5xx         | `danger`     | "Server error — please try again." |

**On load (GET `/api/schemas/:id` for edit):**

| HTTP Status | Toast Intent | Action                                                                  |
| ----------- | ------------ | ----------------------------------------------------------------------- |
| 200         | —            | Populate editor normally.                                               |
| 404         | `danger`     | "Schema not found." Navigate back to `/schemas`.                        |
| 5xx         | `danger`     | "Failed to load schema. Please try again." Navigate back to `/schemas`. |

## Config Pages

### Config List (`/configs`)

#### Config List Layout

The config list renders a filterable, paginated table of configurations. It follows the same layout pattern as the schema list.

#### Search Filters

Render a filter bar at the top of the page body with these controls on a single row:

| Control    | Type                           | Description                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Schema** | Type-ahead dropdown (required) | The backend requires `schemaId` for listing configs. This control combines a text input with a dropdown: as the user types, it searches active schemas by name (debounced ~300ms). Each option shows the schema name with a dimmed ID beneath it. Only `active` schemas appear. Selecting a schema sets the `schemaId` filter and fetches the config list. The list is empty until a schema is selected. |
| **Name**   | Text input                     | Filter by config name (substring match)                                                                                                                                                                                                                                                                                                                                                                  |
| **Status** | Dropdown                       | Options: `active` (default), `all`, `disabled`. `active` sends `status=active`, `disabled` sends `status=disabled`, `all` omits the `status` parameter entirely.                                                                                                                                                                                                                                         |

Changing any filter resets pagination to the first page.

#### Schema Type-Ahead Dropdown

This is a reusable component (`SchemaSelector`) that should be shared between the config list filter bar and the config editor's schema picker. Implementation details:

- Uses BlueprintJS `Suggest` (or `Select` with a query filter) for the combined input + dropdown experience.
- On mount or when the query changes, calls `GET /api/schemas?status=active` (with an optional name filter if the backend supports it, otherwise filter client-side from a preloaded list of active schemas).
- Each item renders two lines: **schema name** (primary) and **schema ID** (dimmed/secondary).
- Selecting an item calls `onSelect(schema)` with the full schema object (id, name, schemaData).
- Clearing the input clears the selection.
- The component accepts `disabled` and `value` (selected schema) props for controlled usage.

#### "Create Config" Button

A green `Button` with `intent="success"` and text "Create Config", positioned in the upper-right corner of the page body. Always enabled. Clicking it navigates to `/configs/new`.

#### Table

Render configs in a table matching the Flanders Roles table style. Columns:

| Column      | Description                                                |
| ----------- | ---------------------------------------------------------- |
| **name**    | Config name (clickable link — navigates to `/configs/:id`) |
| **schema**  | Schema name (resolved from `schemaId`)                     |
| **status**  | `active` or `disabled`                                     |
| **created** | Formatted `createdAt` timestamp                            |
| **updated** | Formatted `updatedAt` timestamp                            |

Clicking a row's name navigates to the config editor for that config.

#### Pagination

Same cursor-based pagination pattern as the schema list. See the shared pagination pattern in the Schema Pages section — reuse the same state shape (`previousTokens`, `currentToken`, `nextToken`) and Back/Next button component.

### Config Editor (`/configs/new` and `/configs/:id`)

This page is used for both creating and editing configurations.

#### Top Bar

A row at the top of the page body containing:

- **Config Name** — A text input (editable in create mode, read-only in edit mode) on the left.
- **Schema** — In create mode: the `SchemaSelector` type-ahead dropdown (see above). Once a schema is selected, it cannot be changed without starting over. In edit mode: read-only text showing the schema name.
- **Status Toggle** — Only shown in edit mode. A `Switch` labeled "Active" / "Disabled" reflecting the config's current status. Toggling it immediately calls POST `/api/configs/:id/activate` or POST `/api/configs/:id/disable`. Use `intent="success"` when active and `intent="danger"` when disabled.
- **Save Config** — A green `Button` (`intent="success"`) on the right. Disabled until the form passes client-side validation.
- **Cancel** — A minimal `Button` that navigates back to `/configs` without saving. Pagination state is preserved.

#### Dynamic Form Renderer

Once a schema is selected (on create) or loaded (on edit), render an interactive form that lets the user populate `configData` conforming to that schema. This is the core of the config editor — it must make it easy for non-technical users to fill in configuration values without understanding JSON Schema.

The form renderer is a recursive component (`DynamicFormRenderer`) that takes a JSON Schema and the current form data, and renders appropriate controls for each property.

##### Field Rendering by Type

| Schema Type          | Control                     | Details                                                                                                                                                                                                                                                      |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `string`             | Text input                  | Use a textarea if `maxLength > 200` or if the property name suggests long-form content. If `enum` is defined, render a dropdown `Select` instead of a text input. If `format` is `date` or `date-time`, render a BlueprintJS `DateInput` / `DateTimePicker`. |
| `number` / `integer` | Numeric input               | Use BlueprintJS `NumericInput`. Enforce `minimum`, `maximum`, `multipleOf` as input constraints. For `integer`, restrict to whole numbers.                                                                                                                   |
| `boolean`            | Toggle switch               | BlueprintJS `Switch`. Default state comes from `default` if defined, otherwise `false`.                                                                                                                                                                      |
| `object`             | Collapsible fieldset        | Render a `Card` or bordered section with the property name as a header. Recursively render each property defined in `properties` as nested form fields. Collapsible via a chevron toggle.                                                                    |
| `array`              | Item list with +/- controls | See "Array (List) Handling" below.                                                                                                                                                                                                                           |
| `enum` (any type)    | Dropdown select             | Always render as a `Select` dropdown regardless of the underlying type. Options are the enum values.                                                                                                                                                         |

##### Required Field Indicators

Properties listed in the parent schema's `required` array are marked with a red asterisk next to the field label. If a required field is empty on save, show an inline validation error.

##### Help Text

If a property has a `description` in the schema, display it as muted helper text below the field control.

##### Default Values

When the form initializes (create mode) or when a new array item is added, pre-populate fields that have a `default` defined in the schema.

#### Array (List) Handling

Arrays require special UI treatment to allow users to add, remove, and populate items.

##### Layout

Each array property renders as a labeled section containing:

1. A header row with the property name, item count (e.g., "Widgets (2 items)"), and an **"Add Item" (+)** button.
2. A vertical list of item rows. Each item row contains:
   - The rendered form for a single item (based on the `items` schema).
   - A **"Remove" (-)** button aligned to the right or as a trailing icon.
   - An item index label (e.g., "#1", "#2") for clarity.

##### Item Rendering

- If `items` is a **primitive type** (string, number, boolean): each item is a single inline input on one row.
- If `items` is an **object schema**: each item renders as a nested fieldset/card with its own set of form fields (recursive rendering via `DynamicFormRenderer`).
- If `items` is a **tuple** (array of schemas): render each positional item with its corresponding schema.

##### Constraints

- **"Add Item" button** is disabled when the array length equals `maxItems`.
- **"Remove" button** is disabled when the array length equals `minItems`.
- If `uniqueItems` is `true`, show a validation warning when duplicate values are detected.

##### Reordering

Drag-and-drop reordering of array items is a nice-to-have for v1. Design the item component interface to support it later (stable keys per item, not array indices).

#### Client-Side Validation

Before saving, compile the selected schema with Ajv and validate the form data client-side:

- Run `ajv.validate(schema, formData)` and collect errors.
- Map each Ajv error's `instancePath` (e.g., `/widgets/0/name`) back to the corresponding form field and display an inline error message below it.
- If there are validation errors, the **Save Config** button remains disabled and a toast summarizes the issue count: "Fix {n} validation error(s) before saving."
- This provides immediate feedback without a backend round-trip.

#### Create vs. Edit Behavior

| Aspect            | Create (`/configs/new`)              | Edit (`/configs/:id`)                          |
| ----------------- | ------------------------------------ | ---------------------------------------------- |
| Config name       | Editable text input                  | Read-only display                              |
| Schema            | Selectable via `SchemaSelector`      | Read-only (loaded from config's `schemaId`)    |
| Initial form data | Empty (defaults from schema applied) | Loaded from backend via GET `/api/configs/:id` |
| Save action       | POST `/api/configs`                  | PUT `/api/configs/:id`                         |
| Cancel            | Navigate to `/configs`               | Navigate to `/configs`                         |

#### Error Handling

Same shared toaster instance and general rules as the schema pages.

**On save (create — POST `/api/configs`):**

| HTTP Status   | Toast Intent | Message                                                                |
| ------------- | ------------ | ---------------------------------------------------------------------- |
| 200           | `success`    | "Config created successfully."                                         |
| 406           | `warning`    | "Config data does not conform to the schema: {details from response}." |
| 409           | `warning`    | "A config with this name already exists."                              |
| 422           | `danger`     | "Config data is malformed: {error message from response}."             |
| 5xx           | `danger`     | "Server error — please try again."                                     |
| Network error | `danger`     | "Unable to reach the server. Check your connection."                   |

**On save (update — PUT `/api/configs/:id`):**

| HTTP Status   | Toast Intent | Message                                                                |
| ------------- | ------------ | ---------------------------------------------------------------------- |
| 200           | `success`    | "Config updated successfully."                                         |
| 406           | `warning`    | "Config data does not conform to the schema: {details from response}." |
| 422           | `danger`     | "Config data is malformed: {error message from response}."             |
| 5xx           | `danger`     | "Server error — please try again."                                     |
| Network error | `danger`     | "Unable to reach the server. Check your connection."                   |

**On status toggle (activate/disable):**

| HTTP Status | Toast Intent | Message                            |
| ----------- | ------------ | ---------------------------------- |
| 200         | `success`    | "Config {activated/disabled}."     |
| 404         | `danger`     | "Config not found."                |
| 5xx         | `danger`     | "Server error — please try again." |

**On load (GET `/api/configs/:id` for edit):**

| HTTP Status | Toast Intent | Action                                                                  |
| ----------- | ------------ | ----------------------------------------------------------------------- |
| 200         | —            | Populate editor normally.                                               |
| 404         | `danger`     | "Config not found." Navigate back to `/configs`.                        |
| 5xx         | `danger`     | "Failed to load config. Please try again." Navigate back to `/configs`. |

## Shared Patterns

The following patterns are used across both Schema and Config pages. Implement them as reusable utilities and components rather than duplicating logic.

### Toaster

Create a shared `OverlayToaster` instance in `services/toaster.ts`. All components import and use this single instance — no prop drilling, no per-component toaster creation.

- Success toasts auto-dismiss after 3 seconds.
- Error/warning toasts persist until manually dismissed (`timeout: 0`).
- Toasts stack — multiple toasts shown in quick succession are all visible simultaneously. Configure `maxToasts: 5` to prevent runaway stacking.
- When the backend response body includes an `error` or `details` field, incorporate it into the toast message.

### Error Handling

- Wrap all API calls in try/catch. Ky throws `HTTPError` for non-2xx responses and `TypeError` / `TimeoutError` for network failures. Distinguish between them: HTTP errors have a response body to inspect; network errors do not.
- **Every promise and async action must have error handling.** No fire-and-forget `.then()` chains without `.catch()`, no `await` calls outside a try/catch, no unhandled promise rejections. This applies everywhere — API calls, Okta flows, JSON parsing, `sessionStorage`/`localStorage` access. If an error cannot be meaningfully handled at the call site, propagate it to a boundary that can (e.g., show a toast). Silent swallowing of errors is never acceptable.

### Cursor-Based Pagination

Both list pages use the same cursor-based pagination model. Extract a reusable hook or state shape:

```typescript
interface PaginationState {
  previousTokens: string[];
  currentToken: string | undefined;
  nextToken: string | undefined;
}
```

- **Back** is disabled when `previousTokens` is empty.
- **Next** is disabled when `nextToken` is `undefined`.
- **Next** pushes `currentToken` onto `previousTokens` and sets `currentToken = nextToken`.
- **Back** pops from `previousTokens` into `currentToken`.
- Changing any filter resets the pagination state.
- State is preserved when navigating to/from detail pages within the same session.

Extract a reusable `PaginationControls` component that renders the Back/Next buttons and accepts the pagination state + callbacks. Render it at both the top and bottom of the table.

> **Future improvement:** Replace Back/Next buttons with infinite scroll + row virtualization (e.g., `react-window` or `@tanstack/react-virtual`). Not needed for the initial implementation.

### List Page Layout

Both schema and config list pages follow the same structure:

1. Filter bar (top of page body)
2. "Create" button (upper-right)
3. Pagination controls (above table)
4. Data table
5. Pagination controls (below table)

Extract a shared `ListPage` layout component or follow a consistent pattern across both pages so they look and behave identically.

### Status Toggle

Both the schema editor and config editor have an activate/disable toggle in the top bar. Extract a reusable `StatusToggle` component:

- Accepts `status`, `onToggle`, and `disabled` props.
- Renders a `Switch` with `intent="success"` when active and `intent="danger"` when disabled.
- Calls `onToggle` on change — the parent component handles the API call.

## React Best Practices

### Performance

The schema editor tree can grow large with deeply nested objects, arrays, and composition nodes. Every interaction (selecting a node, typing in the property panel, adding/removing nodes) must feel instant. Follow these rules:

- **Memoize `TreeNode` with `React.memo`** — This is one of the few cases where `React.memo` is clearly justified. When the `SchemaEditor` re-renders (e.g., a node was added or a keyword changed), React re-invokes every `TreeNode` in the tree by default — even for nodes whose props are unchanged. With 50–100+ nodes, that adds up. `React.memo` on `TreeNode` short-circuits this: combined with the reducer preserving referential identity for unchanged subtrees, only the affected branch actually re-renders. Do **not** apply `React.memo` broadly to all components — it adds a shallow-comparison cost on every render, which is wasted on components that re-render with new props most of the time (e.g., the property panel changes whenever the user selects a different node).
- **Stable callbacks with `useCallback`** — Callbacks passed to memoized tree nodes (`onSelect`, `onDelete`, `onToggleExpand`) must be wrapped in `useCallback` with proper dependency arrays. Without this, new function references on every render defeat `React.memo`. Only apply `useCallback` where it enables a downstream `React.memo` to skip work — don't use it reflexively on every handler.
- **Stable context values** — If using React context for the schema tree dispatch function, memoize the context value with `useMemo` so consumers don't re-render on every parent render. Prefer splitting context into a "state" context and a "dispatch" context so components that only dispatch (like the property panel) don't re-render when unrelated state changes.
- **Granular state updates** — Avoid replacing the entire tree state on every keystroke. Use a reducer (`useReducer`) with targeted actions (e.g., `UPDATE_NODE_KEYWORD`, `ADD_CHILD`, `REMOVE_NODE`, `MOVE_NODE`) that produce minimal diffs. The reducer should return new references only for the changed node and its ancestors, leaving unchanged subtrees referentially stable. This is what makes `React.memo` on `TreeNode` effective.
- **Debounce text inputs** — For text fields in the property panel (Display Name, Pattern, Description), debounce updates to the tree state by ~150–300ms so the reducer doesn't fire on every keystroke. The input itself should feel responsive (use local component state for the input value), but the tree state update can lag slightly.
- **Virtualize large trees** — If a schema has 50+ visible nodes, consider virtualizing the tree rendering (nice-to-have for v1, but design the component interface to allow it later).

### Component Design

- **Centralized, reusable components** — Build a small library of generic schema-editor primitives that are composed together, not a monolithic component. Examples: `TreeNode`, `PropertyField`, `TypeIcon`, `RequiredDot`, `AddNodeMenu`, `CollapsibleSection`.
- **Data-driven recursive rendering for the tree** — The schema tree is a recursive data structure defined by `SchemaNode.children`. `TreeNode` should receive a `SchemaNode` and recursively render its own children — the caller does not manually map and pass child JSX. This keeps the recursion encapsulated and avoids verbose boilerplate at every call site:

```tsx
// TreeNode handles its own children — caller just passes the node
<TreeNode node={rootNode} selectedId={selectedId} onSelect={handleSelect} />

// Inside TreeNode:
// - render icon, label, required dot, expand/collapse chevron
// - if expanded and node has children, map over node.children
//   and render a <TreeNode> for each (the recursion)
```

- **`children` passthrough for layout containers only** — Use `children` for structural/layout components where the parent is agnostic about its contents: `Page`, `Page.Head`, `CollapsibleSection`, `PropertySection`, modal wrappers. These are composition containers, not data-driven components. Do not use `children` for the tree — the tree's structure comes from data, not JSX composition.
- **Single responsibility** — Each component does one thing. `TreeNode` renders a single node and recurses into its children. `PropertyPanel` reads the selected node and delegates to type-specific sub-forms (`StringFields`, `NumberFields`, `ArrayFields`, `ObjectFields`, `CompositionFields`). `TypeIcon` renders the icon for a given type. Keep components small and focused.
- **Controlled components** — All form inputs in the property panel are controlled (value comes from state, changes go through callbacks). No uncontrolled refs for form data.
- **Key prop discipline** — Use the `SchemaNode.id` (a stable UUID) as the React `key`, never the array index. This ensures correct reconciliation when nodes are reordered or deleted.

### State Architecture

- Use `useReducer` at the `SchemaEditor` level for the tree state. The reducer holds the full `SchemaNode` tree and the selected node ID.
- The property panel reads the selected node from the tree and dispatches actions to update it. It should not hold its own copy of the node data (aside from local debounce state for text inputs).
- Pagination and filter state for the schema list lives in a separate context or component state — it must not be co-located with the editor state.

### Code Quality

- **Extract stateless business logic into pure functions** — Any logic that transforms data without depending on React state or lifecycle should be a standalone function in a dedicated utility module, not inlined in a component body. Examples: `toCamelCase()`, `schemaNodeToJsonSchema()`, `jsonSchemaToTree()`, `validateJsonSchema()`, `buildTypeLabel()`. Pure functions are trivially unit-testable with Vitest and can be developed/verified independently of the UI.
- **Keep cyclomatic complexity low** — Functions and components should have few branches. If a function has more than 2–3 levels of nesting or multiple `if/else if/else` chains, refactor it. Strategies:
  - Use early returns to eliminate `else` blocks.
  - Replace `switch` statements on node types with a lookup map (e.g., `Record<SchemaNodeType, ComponentType>` for the property panel's type-specific sub-forms).
  - Break complex conditionals into named boolean variables or predicate functions (e.g., `const isCompositionNode = ...` rather than a long inline expression).
  - Split large reducer `case` blocks into individual handler functions.
- **Maximize readability and self-documenting code** — Code should be understandable without comments. Prioritize:
  - Descriptive variable and function names that convey intent (`addChildToSelectedNode` over `handleAdd`, `isSchemaBackwardCompatible` over `checkCompat`).
  - Small, focused functions — if a function needs a comment to explain what a section does, that section should be its own named function.
  - Consistent patterns — every type-specific property sub-form should follow the same structure, every tree action should flow through the same dispatch pattern.
  - Avoid clever abstractions. Straightforward, slightly repetitive code is preferable to a generic utility that obscures what's happening.

## TypeScript Rules

Follow all rules from `.cursorrules`:

- `strict: true` with `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`.
- No `any` — use `unknown`.
- Explicit return types on all functions (except test files).
- All function parameters must be typed.
- Prefer `type` imports for type-only imports.
- SCREAMING_SNAKE_CASE for enum members.
- camelCase for variables, functions, and file names.

## Testing

- Vitest for all tests.
- Test files are exempt from `explicit-function-return-type`.

## Ladle Stories

Use Ladle (not Storybook) for component stories.

### File Location

Story files live alongside the component they document, using the `.stories.tsx` suffix:

```text
components/
  Logo/
    index.tsx
    Logo.stories.tsx
  Page/
    index.tsx
    Page.stories.tsx
```

### Naming Convention

- File name: `<ComponentName>.stories.tsx`
- Named exports become individual stories. The default export is not used.

### Example

```tsx
import type { Story } from '@ladle/react';
import { Logo } from './index';

export const Default: Story = () => <Logo />;
```

### What to Cover

Write stories for every reusable UI component: Logo, Page shell, sub-header tabs, environment badge, user menu, `SchemaSelector`, `StatusToggle`, `PaginationControls`, `TreeNode` (with sample schema data), `DynamicFormRenderer` (with sample schemas of various types), `ArrayField`. Stories should render the component in isolation with representative props. Use Ladle's `argTypes` for interactive knobs where useful.

## What NOT to Include

- No password or MFA authentication flows — Okta SSO only.
- No `@isubscribed/eddie`, `@isubscribed/wiseguy`, or `@isubscribed/carl-carlson` packages.
- No Redux — use React context or lightweight state management for auth state.
- No Axios — use Ky.
- No Webpack — use Vite (already configured).
- No Storybook — use Ladle.
