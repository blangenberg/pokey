# Pokey

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

```
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

This starts the backend Express server (port 3001) and the frontend Vite dev server (port 3000) concurrently.

### Running Tests

```bash
npm test
```

Runs Vitest across all workspace packages.
