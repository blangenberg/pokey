import { randomUUID } from 'node:crypto';

// ── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env['POKEY_BASE_URL'] ?? 'http://localhost:3001/api';
const RUN_ID = randomUUID().split('-')[0] ?? 'unknown';
let pass = 0;
let fail = 0;

// ── Formatting helpers ──────────────────────────────────────────────────────

const green = (s: string): string => `\x1b[32m${s}\x1b[0m`;
const red = (s: string): string => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string): string => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string): string => `\x1b[2m${s}\x1b[0m`;

function prettyJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2)
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');
}

// ── HTTP helpers ────────────────────────────────────────────────────────────

interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

async function api(method: string, path: string, data?: Record<string, unknown>): Promise<ApiResult> {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (data) opts.body = JSON.stringify(data);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, body };
}

// ── Assertion helpers ───────────────────────────────────────────────────────

function assertStatus(label: string, expected: number, result: ApiResult): void {
  if (result.status === expected) {
    console.log(green(`  ✓ ${label} (HTTP ${String(result.status)})`));
    console.log(dim(prettyJson(result.body)));
    pass++;
  } else {
    console.log(red(`  ✗ ${label} — expected ${String(expected)}, got ${String(result.status)}`));
    console.log(prettyJson(result.body));
    fail++;
  }
}

// ── Run ─────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  const schemaName = `AuraDashboard-${RUN_ID}`;
  const configName = `HomeDashboard-${RUN_ID}`;
  const badConfigName = `BadDashboard-${RUN_ID}`;

  console.log(bold(`Pokey Backend Sanity Check  (run: ${RUN_ID})`));
  console.log('');

  // -- Schema lifecycle -------------------------------------------------------
  console.log(bold('Schema lifecycle'));

  const createSchema = await api('POST', '/schemas', {
    name: schemaName,
    schemaData: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        theme: { type: 'string' },
        widgets: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'theme'],
    },
  });
  const schemaId = createSchema.body['id'] as string;
  assertStatus('Create schema', 200, createSchema);

  const listSchemas = await api('GET', '/schemas');
  assertStatus('List schemas', 200, listSchemas);

  const getSchema = await api('GET', `/schemas/${schemaId}`);
  assertStatus('Get schema', 200, getSchema);

  // -- Config lifecycle -------------------------------------------------------
  console.log('');
  console.log(bold('Config lifecycle'));

  const createConfig = await api('POST', '/configs', {
    name: configName,
    schemaId,
    configData: {
      title: 'Home',
      theme: 'dark',
      widgets: ['revenue-chart', 'active-users'],
    },
  });
  const configId = createConfig.body['id'] as string;
  assertStatus('Create valid config', 200, createConfig);

  const createBadConfig = await api('POST', '/configs', {
    name: badConfigName,
    schemaId,
    configData: {
      title: 'Oops',
    },
  });
  assertStatus('Create invalid config (expect 406)', 406, createBadConfig);

  const listConfigs = await api('GET', `/configs?schemaId=${schemaId}`);
  assertStatus('List configs for schema', 200, listConfigs);

  const getConfig = await api('GET', `/configs/${configId}`);
  assertStatus('Get config', 200, getConfig);

  // -- Schema update ----------------------------------------------------------
  console.log('');
  console.log(bold('Schema update'));

  const updateSchema = await api('PUT', `/schemas/${schemaId}`, {
    schemaData: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        theme: { type: 'string' },
        widgets: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'theme'],
    },
  });
  assertStatus('Update schema (add subtitle)', 200, updateSchema);

  // -- Disable → verify → re-activate ----------------------------------------
  console.log('');
  console.log(bold('Disable → verify → re-activate'));

  const disableSchema = await api('POST', `/schemas/${schemaId}/disable`);
  assertStatus('Disable schema', 200, disableSchema);

  const activeList = await api('GET', '/schemas?status=active');
  const items = activeList.body['items'] as Array<Record<string, unknown>>;
  const found = items.some((item) => item['id'] === schemaId);
  if (!found) {
    console.log(green('  ✓ Disabled schema excluded from active list'));
    pass++;
  } else {
    console.log(red('  ✗ Disabled schema still appears in active list'));
    fail++;
  }

  const activateSchema = await api('POST', `/schemas/${schemaId}/activate`);
  assertStatus('Re-activate schema', 200, activateSchema);

  // -- Cleanup ----------------------------------------------------------------
  console.log('');
  console.log(bold('Cleanup'));

  const disableConfig = await api('POST', `/configs/${configId}/disable`);
  assertStatus('Disable config', 200, disableConfig);

  const disableSchemaFinal = await api('POST', `/schemas/${schemaId}/disable`);
  assertStatus('Disable schema (final)', 200, disableSchemaFinal);

  // -- Summary ----------------------------------------------------------------
  console.log('');
  console.log(bold('────────────────────────────────'));
  if (fail === 0) {
    console.log(green(`All ${String(pass)} checks passed.`));
  } else {
    console.log(red(`${String(fail)} of ${String(pass + fail)} checks failed.`));
    process.exitCode = 1;
  }
}

run().catch((err: unknown) => {
  console.error(red('Fatal error:'), err);
  process.exitCode = 1;
});
