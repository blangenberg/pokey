# Pokey

![Pokey logo](assets/pokey-logo.png)

A flexible, schema-driven configuration system for front-end content. Define JSON Schemas, then create and manage configurations that conform to those schemas — with full validation, backward-compatibility enforcement, and lifecycle management.

## Features

- **Schema Management** — Create, update, disable, and activate JSON Schema definitions. Updates are validated for backward compatibility so existing configurations remain valid.
- **Configuration Management** — Create configurations against any active schema. Configurations are validated with Ajv at write-time.
- **Cursor-based Pagination** — Efficient listing of schemas and configurations with optional status filtering.
- **Observability** — Prometheus metrics (event counters, error counters, P95/P99 latency histograms) and structured error logging.
- **Local Development** — Express dev server backed by DynamoDB Local (via Podman/Docker). The same handler code runs locally and as AWS Lambda functions.

## Tech Stack

| Layer         | Technology                                   |
| ------------- | -------------------------------------------- |
| Frontend      | React 19, Vite, Ladle, Ky                    |
| Backend       | Node 22, Express (local), AWS Lambda (prod)  |
| Database      | DynamoDB (local via `amazon/dynamodb-local`) |
| Validation    | Ajv (JSON Schema)                            |
| Observability | prom-client (Prometheus)                     |
| Build         | Vite, TypeScript (strict)                    |
| Testing       | Vitest                                       |
| Deployment    | AWS SAM                                      |

## Directory Structure

```text
pokey/
├── .github/workflows/        # CI/CD pipeline definitions (placeholder)
├── scripts/                   # Developer onboarding scripts
│   ├── init-podman.sh         # Podman setup + DynamoDB image pull
│   ├── init-db.sh             # Start DynamoDB Local + create tables
│   └── init-node.sh           # Verify Node 22 + install dependencies
├── packages/
│   ├── pokey-common/          # Shared TypeScript types, enums, API contracts
│   ├── pokey-backend/         # Express server, Lambda handlers, DynamoDB layer
│   └── pokey-frontend/        # React SPA
├── docker-compose.yml         # DynamoDB Local service
├── package.json               # Workspace root with NPM workspaces
├── tsconfig.base.json         # Shared TypeScript compiler options
├── eslint.config.mjs          # ESLint (strict TypeScript)
└── .prettierrc                # Prettier (140 char width)
```

## Getting Started

### Prerequisites

- **Node.js 22+**
- **Podman** (or Docker with the alias in place)

### Quick Setup

```bash
npm run init
```

This runs four steps in order:

1. **init:podman** — Verifies Podman is installed, adds a `docker → podman` alias to `~/.zshrc`, and pulls the `amazon/dynamodb-local` image.
2. **init:node** — Verifies Node 22+ is installed and runs `npm install`.
3. **init:db** — Starts the DynamoDB Local container and creates the required tables.
4. **init:build** — Builds all packages in dependency order (common → backend → frontend).

### Running Locally

```bash
npm start
```

This ensures DynamoDB Local is running and tables exist, then starts the backend Express server (port 3001) and the frontend Vite dev server (port 3000) concurrently.

The database check (`init:db`) runs automatically before the dev servers launch. It starts the DynamoDB Local container if it's stopped and creates any missing tables. This is fully idempotent — it won't restart an already-running container or drop existing tables/data, so it's safe to run repeatedly.

### Sanity Check

With the backend running, you can verify all API routes work end-to-end:

```bash
npm run backend:sanity-check
```

This creates a schema and config with a randomized name suffix, exercises every CRUD and lifecycle operation, asserts the expected HTTP status codes, and disables everything it created at the end. Safe to run repeatedly.

### Sample API Walkthrough

With the backend running on port 3001, you can exercise the full schema and config lifecycle. Replace `<schema-id>` and `<config-id>` with IDs from the responses.

```bash
# Create a schema for aura.com dashboard pages
curl -s -X POST http://localhost:3001/api/schemas \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "AuraDashboardPage",
    "schemaData": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "theme": { "type": "string" },
        "widgets": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["title", "theme"]
    }
  }' | jq .

# List all schemas
curl -s http://localhost:3001/api/schemas | jq .

# Get the schema by ID
curl -s http://localhost:3001/api/schemas/<schema-id> | jq .

# Create a config that conforms to the schema
curl -s -X POST http://localhost:3001/api/configs \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "HomeDashboard",
    "schemaId": "<schema-id>",
    "configData": {
      "title": "Home",
      "theme": "dark",
      "widgets": ["revenue-chart", "active-users"]
    }
  }' | jq .

# Create a config that FAILS schema validation (theme is required but missing)
curl -s -X POST http://localhost:3001/api/configs \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "BadDashboard",
    "schemaId": "<schema-id>",
    "configData": {
      "title": "Oops"
    }
  }' | jq .

# List configs for this schema
curl -s 'http://localhost:3001/api/configs?schemaId=<schema-id>' | jq .

# Get the config by ID
curl -s http://localhost:3001/api/configs/<config-id> | jq .

# Update the schema — add an optional subtitle (backward-compatible)
curl -s -X PUT http://localhost:3001/api/schemas/<schema-id> \
  -H 'Content-Type: application/json' \
  -d '{
    "schemaData": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "subtitle": { "type": "string" },
        "theme": { "type": "string" },
        "widgets": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["title", "theme"]
    }
  }' | jq .

# Disable the schema
curl -s -X POST http://localhost:3001/api/schemas/<schema-id>/disable | jq .

# List only active schemas (disabled one is excluded)
curl -s 'http://localhost:3001/api/schemas?status=active' | jq .

# Re-activate the schema
curl -s -X POST http://localhost:3001/api/schemas/<schema-id>/activate | jq .
```

### Running Tests

```bash
npm test
```

Runs Vitest across all workspace packages.
