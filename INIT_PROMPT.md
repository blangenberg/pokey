# POKEY: A Flexible, Schema-Driven Configuration System

This is will be a new Node.js project called "Pokey" (Gumby's friend). Pokey will be a flexible, schema-driven configuration system for front-end content.

## MONO-REPO ARCHITECTURE

This should be a mono-repo that features a react app and backend running Node v22 using TypeScript. Both should use Vite as the build system and NPM for package management. Packages should be different for the client app and backend. There should be a top-level package.json with scripts to start both services as background.

Both the client app and backend should have their own CI/CD tests. Use Vitest for the CI/CD testing framework.

At the top level, set up a `.github/workflows` folder, .gitignore with the standard node template, package.json.
Create an `/packages` directory with `pokey-frontend`, `pokey-backend`, and `pokey-common` as three complete node projects within the mono-repo, each with their own package.json. `pokey-frontend` and `pokey-backend` will import `pokey-common`. `pokey-common` should have API TypeScript types and enums that are shared.

For now, you can leave the `.github/workflows` empty.

## CLIENT APP

### CLIENT APP ARCHITECTURE

Build a shell React Vite app. Make sure it has its own package.json with versioning and build system.

Use Ladle (https://ladle.dev/docs/) for Storybook implementation

### CLIENT APP FUNCTIONALITY

It should be a simple page "Welcome to Pokey." We will implement the APIs and UIs in a later step.

We will use `Ky` as the HTTP wrapper. Do not use `Axios`.

## BACKEND APP

### BACKEND APP ARCHITECTURE

This should use serverless functions (AWS lambdas) and DynamoDB using Docker (docker-compose).

I want this to be flexible for local development. Each serverless function should be abstracted from its routing. Developers should be able to start a local Node webserver that provides routing to each function.

#### BACKEND APP ABSTRACTIONS

- OBSERVABILITY: Centralize code for observabiltiy and error tracking. This includes Prometheus metrics (event and error enum values with increments), P95 and P99 latency. Prometheus should be used for real-time observability, while error logging provides more details, including the message, code (enum value), class, line, etc.
- DATA: Create a Data Layer abstraction for reading and writing data from DynamoDB. This should be an instantiated class that receives connection params in the constructor.
- ROUTING: the methods will run as serverless functions in AWS, but need a webserver locally with routing. Use Express. Do not duplicate function code. Use the AWS SAM as the deployment framework for Lambdas.
- DATETIME: Create a helper class that can be mocked for returning the current UTC time
- UUID: Create a helper class that can be mocked for returning a new UUID

### BACKEND APP FUNCTIONALITY

There are two main features: schema definition and creating configurations. We will use `Ajv` as a framework for this. See https://ajv.js.org/guide/typescript.html for examples and docs.

Additionally, log errors with full details.

#### SCHEMA DEFINITION FUNCTIONALITY

Users must be able to create, update, and delete schema definitions. Schemas will be stored in DynamoDB. Since we are using TypeScript, the format of the document will be fixed. All fields are required.

- `id` (primary key): UUID
- `name`: string
- `status`: an enum (active, disabled)
- `schemaData`: a JSON Schema object that can be compiled by Ajv
- `createdAt`: UTC timestamp with timezone indicating when the config was created.
- `updatedAt`: UTC timestamp with timezone indicating when the config was last updated.

We need serverless functions for schema operations: `get`, `list`, `create`, `update`, `disable`, and `activate`. Prometheus metrics are implemented in each serverless function, per above.

In `Ajv`, `additionalProperties` should always be `true`. It's OK if an object has more data than the schema requires.

##### SCHEMA SERVERLESS FUNCTION DETAILS

- `get`: retrieve a single schema by id.
- `list`: retrieve a cursor-based paginated list of schemas. params include the `limit`, `nextToken` (optional), and `status` (optional) as a filter. max limit is 100. Omit the `schemaData` payload for each in the response to keep the size small. This should have a different TypeScript type: `SchemaListItem`
- `create`: create a new schema. accept `name`, and a JSON payload for the `schemaData`. Lowercase the name. Two validations must happen: there cannot be another schema with the same `name` (after lowercasing), and ensure the schema can be parsed by `Ajv` before saving. Newly created schemas should start with `status` of `active`. Set the `createdAt` and `updatedAt` timestamps to the current instant using the helper datetime class and `id` from the uuid class from the abstractions, above.
- `update`: retrieve the specified schema by id. Accept a schema as input and parse the `schemaData`. Validate the existing schema via `Ajv`. Then, calculate the Object diff between the existing schema and new one and determine if it is backward-compatible in theory with any existing configurations that might exist (do no load any configurations. this can be determined without examples.). Changes must be purely additive or otherwise safe. If the new payload is not backwards-compatible, return an error (and track the compatibility issue as a prometheus error enum). Set the `updatedAt` timestamp to the current instant using the helper datetime class from abstractions. The `name` may change as long as there's no conflict.
- `disable`: retrieve the specified schema by id and update the status to `disabled`. Set the `updatedAt` timestamp to the current instant using the helper datetime class from abstractions.
- `activate`: retrieve the specified schema by id and update the status to `active`. Set the `updatedAt` timestamp to the current instant using the helper datetime class from abstractions.

After implementing the serverless functions, revisit the DynamoDB and set appropriate Global Secondary Indexes based on actual usage.

###### BACKWARD COMPATIBILITY RULES FOR UPDATE

- Adding new properties is safe.
- Making required properties optional is safe.
- Removing optional properties is safe.
- Making optional properties required is unsafe.
- Removing required properties is unsafe.
- Changing a property type is unsafe.

##### CONFIGURATION FUNCTIONALITY

Users can create configurations provided a schema definition. Configurations will be stored in DynamoDB. All fields are required.

- `id` (primary key): UUID
- `name`: string
- `schemaId`: UUID
- `status`: an enum (active, disabled)
- `configData`: a JSON object that can be validated by a compiled Ajv schema.
- `createdAt`: UTC timestamp with timezone indicating when the config was created.
- `updatedAt`: UTC timestamp with timezone indicating when the config was last updated.

We need serverless functions for configuration operations: `get`, `list`, `create`, `update`, `disable`, and `activate`. Prometheus metrics are implemented in each serverless function, per above.

##### CONFIGURATION SERVERLESS FUNCTION DETAILS

- `get`: retrieve a single config by id. Include a param for `includeDisabled`. This should default to `false`. If the specified config is disabled, return a 404 unless `includeDisabled` is `true`.
- `list`: retrieve a cursor-based paginated list of configuration for a given schema. params include the `schemaId`, `limit`, `nextToken` (optional), and `status` (optional) as a filter. max limit is 100. Omit the `configData` payload for each in the response to keep the size small. This should have a different TypeScript type: `ConfigListItem`
- `create`: create a new config. accept `name`, `schemaId`, and a JSON payload for the `configData`. Lowercase the name. Get the schema by id. Three validations must happen: the schema must be present and active; the `configData` must conform to the matching schema before saving; there cannot be another config with the same `name` (after lowercasing). Newly created configs should start with `status` of `active`. Set the `createdAt` and `updatedAt` timestamps to the current instant using the helper datetime class and `id` from the uuid class from the abstractions, above.
- `update`: retrieve the specified config by id. Accept a complete config as input. Get the schema by id. The `schemaId` may change via an update, just fetch the one specified in the update. Two validations must happen: the schema must be present and active; the `configData` must conform to the matching schema before saving. Set the `updatedAt` timestamp to the current instant using the helper datetime class from abstractions. The `name` may change as long as there's no conflict.
- `disable`: retrieve the specified config by id and update the status to `disabled`. Set the `updatedAt` timestamp to the current instant using the helper datetime class from abstractions.
- `activate`: retrieve the specified config by id and update the status to `active`. Set the `updatedAt` timestamp to the current instant using the helper datetime class from abstractions.

After implementing the serverless functions, revisit the DynamoDB and set appropriate Global Secondary Indexes based on actual usage.

Create tests for the serverless functions with unit tests for the stateless helper functions.

Status response codes:

- 200: success (any)
- 400: bad request
- 404: not found, or disabled
- 406: `configData` fails schema check
- 409: name conflict
- 422: malformed `schemaData` or `configData`, cannot be parsed by Ajv

### BACKEND LOCAL DATA

Use `amazon/dynamodb-local` as the local DynamoDB instance. You can use the canonical docker commands, but we use podman in actuality.

## CODING BEST PRACTICES

- Use camelCase.
- Set up Prettier for formatting with 140 char width
- Set up ESLint for enforcing TypeScript strictness
- Use husky + lint-staged to ensure that changed code is formatted and complies with our Strict TypeScript standards.
- All code must use STRICT TypeScript. Do not allow `any`. Use `unknown` when you must.
- Never initialize classes statically in the file. This is bad for testing.
- Use constructor depedency injection to ensure class can be mocked cleanly in test.
- Create helper functions for stateless business logic, particularly when repeated.

## DEVELOPER ONBOARDING

At the top-level, create an npm script to initialize the project locally. This should include several steps, each with its own script:

- Ensure podman is installed, appending podman -> docker aliases to `.zshrc`, and installing the `amazon/dynamodb-local` image
- Initialize the datasource
- Ensure that Node 22 is installed
- build all packages in the proper dependency order (common, backend, frontend)

Create a README with a objective overview, functionality overview, and high-level directory structure (to the package level).

Make no changes to the `INIT_PROMPT.md` prompt.
